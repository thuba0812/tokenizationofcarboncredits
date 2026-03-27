import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { Contract, JsonRpcProvider } from 'ethers'

const root = process.cwd()
const envPath = path.join(root, '.env')
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

function readEnv(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, 'm'))
  return match ? match[1].trim() : ''
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const provider = new JsonRpcProvider('http://127.0.0.1:8545')

const marketplaceArtifact = JSON.parse(
  fs.readFileSync(path.join(root, 'artifacts', 'contracts', 'market.sol', 'CarbonMarketplace.json'), 'utf8')
)
const tokenArtifact = JSON.parse(
  fs.readFileSync(path.join(root, 'artifacts', 'contracts', 'token.sol', 'CarbonToken.json'), 'utf8')
)

const MARKETPLACE_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
const CARBON_TOKEN_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'

const marketplace = new Contract(MARKETPLACE_ADDRESS, marketplaceArtifact.abi, provider)
const carbonToken = new Contract(CARBON_TOKEN_ADDRESS, tokenArtifact.abi, provider)

async function syncActiveListings() {
  const { data: listings, error } = await supabase
    .from('LISTINGS')
    .select(`
      listing_id,
      onchain_listing_id,
      listed_amount,
      listing_status,
      seller_wallet_id,
      WALLETS ( wallet_address )
    `)
    .eq('listing_status', 'ACTIVE')

  if (error) {
    throw error
  }

  const listingIds = (listings || []).map((row) => Number(row.listing_id))
  const soldByListingId = new Map()

  if (listingIds.length > 0) {
    const { data: purchaseItems, error: purchaseError } = await supabase
      .from('PURCHASE_ITEMS')
      .select(`
        listing_id,
        purchased_amount,
        PURCHASES (
          purchase_status
        )
      `)
      .in('listing_id', listingIds)

    if (purchaseError) {
      throw purchaseError
    }

    for (const item of purchaseItems || []) {
      const purchase = Array.isArray(item.PURCHASES) ? item.PURCHASES[0] : item.PURCHASES
      if (purchase?.purchase_status !== 'COMPLETED') continue

      const listingId = Number(item.listing_id)
      const amount = Number(item.purchased_amount || 0)
      soldByListingId.set(listingId, (soldByListingId.get(listingId) || 0) + amount)
    }
  }

  for (const row of listings || []) {
    if (!row.onchain_listing_id) {
      console.log(`Skip LISTING ${row.listing_id}: missing onchain_listing_id`)
      continue
    }

    const onchain = await marketplace.getListing(Number(row.onchain_listing_id))
    const availableAmount = Number(onchain.availableAmount)
    const active = Boolean(onchain.active)
    const dbAmount = Number(row.listed_amount || 0)
    const soldAmount = soldByListingId.get(Number(row.listing_id)) || 0
    const nextStatus = active ? 'ACTIVE' : soldAmount > 0 ? 'SOLD_OUT' : 'CANCELLED'

    if (availableAmount !== dbAmount || nextStatus !== row.listing_status) {
      const { error: updateError } = await supabase
        .from('LISTINGS')
        .update({
          listed_amount: availableAmount,
          listing_status: nextStatus,
        })
        .eq('listing_id', row.listing_id)

      if (updateError) {
        console.error(`Failed syncing LISTING ${row.listing_id}`, updateError)
      } else {
        console.log(
          `Synced LISTING ${row.listing_id}: amount ${dbAmount} -> ${availableAmount}, status ${row.listing_status} -> ${nextStatus}`
        )
      }
    }
  }
}

async function syncTokenBalances() {
  const { data: balances, error } = await supabase
    .from('TOKEN_BALANCES')
    .select(`
      balance_id,
      current_amount,
      wallet_id,
      project_vintage_id,
      WALLETS ( wallet_address ),
      PROJECT_VINTAGES ( project_vintage_id )
    `)

  if (error) {
    throw error
  }

  for (const row of balances || []) {
    const wallet = Array.isArray(row.WALLETS) ? row.WALLETS[0] : row.WALLETS
    const vintage = Array.isArray(row.PROJECT_VINTAGES) ? row.PROJECT_VINTAGES[0] : row.PROJECT_VINTAGES
    const walletAddress = wallet?.wallet_address
    const tokenId = Number(vintage?.project_vintage_id ?? row.project_vintage_id)

    if (!walletAddress || !tokenId) {
      continue
    }

    const onchainBalance = Number(await carbonToken.balanceOf(walletAddress, tokenId))
    const dbBalance = Number(row.current_amount || 0)

    if (onchainBalance !== dbBalance) {
      const { error: updateError } = await supabase
        .from('TOKEN_BALANCES')
        .update({
          current_amount: onchainBalance,
        })
        .eq('balance_id', row.balance_id)

      if (updateError) {
        console.error(`Failed syncing TOKEN_BALANCES ${row.balance_id}`, updateError)
      } else {
        console.log(`Synced TOKEN_BALANCES ${row.balance_id}: ${dbBalance} -> ${onchainBalance}`)
      }
    }
  }
}

async function main() {
  console.log('Syncing marketplace state from on-chain...')
  await syncActiveListings()
  await syncTokenBalances()
  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
