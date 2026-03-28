import { BaseRepository } from './BaseRepository'
import type { PurchasedCredit, Transaction, Certificate, TokenYear } from '../types'
import { projectRepository } from './ProjectRepository'

export class PortfolioRepository extends BaseRepository<any> {
  constructor() {
    super('TOKEN_BALANCES')
  }

  async getPurchasedCredits(walletId: number): Promise<PurchasedCredit[]> {
    const { data, error } = await this.client
      .from('TOKEN_BALANCES')
      .select(`
        *,
        PROJECT_VINTAGES (
          *,
          PROJECTS (
            *,
            ORGANIZATIONS (
              *,
              WALLETS ( wallet_address )
            ),
            PROJECT_VINTAGES (
              *,
              LISTINGS ( * )
            )
          )
        )
      `)
      .eq('wallet_id', walletId)
      .gt('current_amount', 0)

    if (error) {
      console.error('Error fetching portfolio:', error)
      return []
    }

    const sellerListingIds = Array.from(
      new Set(
        ((data as any[]) || []).flatMap((row) =>
          ((row.PROJECT_VINTAGES?.PROJECTS?.PROJECT_VINTAGES || []) as any[])
            .flatMap((vintage: any) => vintage.LISTINGS || [])
            .filter((listing: any) => Number(listing.seller_wallet_id) === Number(walletId))
            .map((listing: any) => Number(listing.listing_id))
        )
      )
    )

    const soldAmountByListingId = new Map<number, number>()

    if (sellerListingIds.length > 0) {
      const { data: purchaseItems, error: purchaseItemsError } = await this.client
        .from('PURCHASE_ITEMS')
        .select(`
          listing_id,
          purchased_amount,
          PURCHASES (
            purchase_status
          )
        `)
        .in('listing_id', sellerListingIds)

      if (purchaseItemsError) {
        console.error('Error fetching purchase items for sold amount:', purchaseItemsError)
      } else {
        for (const item of (purchaseItems as any[]) || []) {
          const purchase = Array.isArray(item.PURCHASES) ? item.PURCHASES[0] : item.PURCHASES
          if (purchase?.purchase_status !== 'COMPLETED') continue

          const listingId = Number(item.listing_id)
          const purchasedAmount = Number(item.purchased_amount || 0)
          soldAmountByListingId.set(listingId, (soldAmountByListingId.get(listingId) || 0) + purchasedAmount)
        }
      }
    }

    const credits: PurchasedCredit[] = []

    for (const row of data as any[]) {
      const vintage = row.PROJECT_VINTAGES
      if (!vintage || !vintage.PROJECTS) continue

      const projectData = vintage.PROJECTS
      const project = projectRepository.mapToDTO(projectData)
      const projectVintage = (projectData.PROJECT_VINTAGES || []).find(
        (item: any) => Number(item.project_vintage_id) === Number(row.project_vintage_id)
      )
      const activeListings = (projectVintage?.LISTINGS || []).filter(
        (listing: any) =>
          listing.listing_status === 'ACTIVE' && Number(listing.seller_wallet_id) === Number(walletId)
      )
      const latestActiveListing = [...activeListings].sort(
        (a: any, b: any) => Number(b.listing_id || 0) - Number(a.listing_id || 0)
      )[0]
      const listedAmount = activeListings.reduce(
        (sum: number, listing: any) => sum + Number(listing.listed_amount || 0),
        0
      )
      const activePrice = latestActiveListing ? Number(latestActiveListing.price_per_unit) : null
      const quantity = Number(row.current_amount || 0)
      const sellerListings = (projectVintage?.LISTINGS || []).filter(
        (listing: any) => Number(listing.seller_wallet_id) === Number(walletId)
      )
      const soldAmount = sellerListings.reduce(
        (sum: number, listing: any) => sum + (soldAmountByListingId.get(Number(listing.listing_id)) || 0),
        0
      )

      const token: TokenYear = {
        vintageId: vintage.project_vintage_id,
        year: Number(vintage.vintage_year),
        tokenCode: vintage.credit_code,
        quantity,
        available: quantity,
        listedAmount,
        soldAmount,
        price: activePrice,
        currentListingId: latestActiveListing ? Number(latestActiveListing.listing_id) : null,
        onchainListingId: latestActiveListing?.onchain_listing_id ? Number(latestActiveListing.onchain_listing_id) : null,
        listingTxHash: latestActiveListing?.listing_tx_hash ?? null,
        status: vintage.status,
        tokenId: vintage.status === 'MINTED' && vintage.token_id ? Number(vintage.token_id) : null,
        mintTxHash: vintage.mint_tx_hash ?? null,
        mintedAmount: vintage.minted_amount ?? null,
        mintedAt: vintage.minted_at ?? null,
      }

      credits.push({
        project: {
          ...project,
          co2Reduction: Number(vintage.verified_co2_reduction || 0),
          tokenCount: quantity,
          priceMin: activePrice ?? undefined,
          priceMax: activePrice ?? undefined,
          tokens: [token],
          issuedYear: token.year,
          tokenCode: token.tokenCode,
        },
        quantity,
        pricePerToken: activePrice ?? 0,
        purchaseDate: new Date(row.updated_at).toLocaleDateString('vi-VN'),
      })
    }

    return credits
  }

  async getTransactions(walletId: number): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('TOKEN_ACTIVITY_LOGS')
      .select(`
        *,
        PROJECT_VINTAGES (
          *,
          PROJECTS ( project_code )
        )
      `)
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }

    return (data as any[]).map((row) => {
      let type: 'mint' | 'sell' | 'request' | 'retire' = 'request'
      if (row.activity_type === 'MINT') type = 'mint'
      else if (row.activity_type === 'PURCHASE') type = 'sell'
      else if (row.activity_type === 'RETIRE' || row.activity_type === 'BURN') type = 'retire'
      else if (row.activity_type === 'LIST' || row.activity_type === 'PURCHASE') type = 'sell'

      const projectCode = row.PROJECT_VINTAGES?.PROJECTS?.project_code || 'UNKNOWN'

      return {
        id: row.activity_id.toString(),
        date: new Date(row.created_at).toLocaleDateString('vi-VN'),
        txHash: row.reference_type === 'RETIREMENT' ? '0x...' : ('0x' + Math.random().toString(16).substr(2, 8)),
        activity: `${row.activity_type} (${projectCode})`,
        projectCode,
        amount: row.delta_amount,
        type,
      }
    })
  }

  async getCertificates(organizationId: number): Promise<Certificate[]> {
    const { data, error } = await this.client
      .from('RETIREMENTS')
      .select(`
        *,
        RETIREMENT_DETAILS (
          *,
          PROJECT_VINTAGES (
            credit_code,
            PROJECTS ( project_id, project_code, project_name )
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('retirement_status', 'COMPLETED')

    if (error) {
      console.error('Error fetching certificates', error)
      return []
    }

    const certs: Certificate[] = []
    for (const cert of data as any[]) {
      for (const det of cert.RETIREMENT_DETAILS || []) {
        const project = det.PROJECT_VINTAGES?.PROJECTS
        const creditCode = det.PROJECT_VINTAGES?.credit_code || 'UNKNOWN'
        if (!project) continue

        certs.push({
          id: `RTM-${creditCode}`,
          projectId: project.project_id.toString(),
          projectName: project.project_name,
          projectCode: project.project_code,
          date: new Date(cert.retired_at || cert.created_at).toLocaleDateString('vi-VN'),
          quantity: det.retired_amount,
          retirementId: cert.retirement_id,
        })
      }
    }

    return certs
  }

  async retireTokens(walletAddress: string, items: { vintageId: number; quantity: number }[], txHash: string): Promise<number | null> {
    const { data: walletData, error: walletError } = await this.client
      .from('WALLETS')
      .select('wallet_id, organization_id')
      .ilike('wallet_address', walletAddress)
      .single()

    if (walletError || !walletData) return null

    const walletId = Number(walletData.wallet_id)
    const orgId = Number(walletData.organization_id)

    const vintageIds = items.map((item) => item.vintageId)
    const { data: balances } = await this.client
      .from('TOKEN_BALANCES')
      .select('balance_id, project_vintage_id, current_amount')
      .eq('wallet_id', walletId)
      .in('project_vintage_id', vintageIds)

    const balanceByVintageId = new Map<number, any>()
    for (const balance of (balances as any[]) || []) {
      balanceByVintageId.set(Number(balance.project_vintage_id), balance)
    }

    const { data: quotaData } = await this.client
      .from('CARBON_QUOTAS')
      .select('quota_id')
      .eq('organization_id', orgId)
      .limit(1)
    const quotaId = quotaData && quotaData.length > 0 ? quotaData[0].quota_id : null

    const { data: retirement, error: retError } = await this.client
      .from('RETIREMENTS')
      .insert({
        organization_id: orgId,
        wallet_id: walletId,
        quota_id: quotaId,
        retirement_status: 'COMPLETED',
        retired_at: new Date().toISOString(),
        retirement_tx_hash: txHash,
      })
      .select('retirement_id')
      .single()

    if (retError || !retirement) {
      console.error('Error inserting retirement:', retError)
      return null
    }

    const retirementId = retirement.retirement_id

    for (const item of items) {
      const qtyVal = Number(item.quantity)

      const { error: detailError } = await this.client.from('RETIREMENT_DETAILS').insert({
        retirement_id: retirementId,
        project_vintage_id: item.vintageId,
        retired_amount: qtyVal,
      })

      if (detailError) console.error('Error inserting retirement detail:', detailError)

      // The TOKEN_ACTIVITY_LOGS insert will trigger the balance update in the DB.
      // We do NOT update TOKEN_BALANCES manually here to avoid double-subtraction.
      const { error: logError } = await this.client.from('TOKEN_ACTIVITY_LOGS').insert({
        wallet_id: walletId,
        project_vintage_id: item.vintageId,
        activity_type: 'RETIRE',
        delta_amount: -qtyVal,
        reference_id: retirementId,
        reference_type: 'RETIREMENT',
      })

      if (logError) console.error('Error inserting activity log:', logError)
    }

    return retirementId
  }
}

export const portfolioRepository = new PortfolioRepository()
