import { BaseRepository } from './BaseRepository'
import type { ListingDB } from '../types/database.types'
import type { Project } from '../types'
import { projectRepository } from './ProjectRepository'

export interface MarketplaceItem {
  project: Project
  tokenId: number
  vintageYear: number
  creditCode: string
  quantity: number
  available: number
  pricePerToken: number
  listingId: number
  sellerWalletAddress: string
}

export class ListingRepository extends BaseRepository<ListingDB> {
  constructor() {
    super('LISTINGS')
  }

  async getActiveListings(): Promise<MarketplaceItem[]> {
    const { data, error } = await this.client
      .from('LISTINGS')
      .select(`
        *,
        WALLETS ( wallet_address ),
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
      .eq('listing_status', 'ACTIVE')
      .gt('listed_amount', 0)

    if (error) {
      console.error('Error fetching listings', error)
      return []
    }

    const items: MarketplaceItem[] = []

    for (const listing of data as any[]) {
      const vintage = listing.PROJECT_VINTAGES
      if (!vintage || vintage.status !== 'MINTED') continue

      const projectData = vintage.PROJECTS
      if (!projectData) continue

      const project = projectRepository.mapToDTO(projectData)
      items.push({
        project,
        tokenId: Number(vintage.token_id),
        vintageYear: Number(vintage.vintage_year),
        creditCode: vintage.credit_code,
        quantity: Number(listing.listed_amount),
        available: Number(listing.listed_amount),
        pricePerToken: Number(listing.price_per_unit),
        listingId: Number(listing.listing_id),
        sellerWalletAddress: listing.WALLETS?.wallet_address || '',
      })
    }

    return items
  }

  async createListings(walletAddress: string, items: { vintageId: number; quantity: number; price: number }[]): Promise<boolean> {
    const { data: walletData, error: walletError } = await this.client
      .from('WALLETS')
      .select('wallet_id')
      .ilike('wallet_address', walletAddress)
      .single()

    if (walletError || !walletData) {
      console.error('Wallet not found or not connected', walletError)
      return false
    }

    const sellerWalletId = Number(walletData.wallet_id)
    const vintageIds = items.map((item) => item.vintageId)

    const { data: existingListings, error: existingListingsError } = await this.client
      .from('LISTINGS')
      .select('listing_id, project_vintage_id, listed_amount')
      .eq('seller_wallet_id', sellerWalletId)
      .eq('listing_status', 'ACTIVE')
      .in('project_vintage_id', vintageIds)

    if (existingListingsError) {
      console.error('Error loading active listings:', existingListingsError)
      return false
    }

    const restoredAmounts = new Map<number, number>()
    for (const listing of (existingListings as any[]) || []) {
      const vintageId = Number(listing.project_vintage_id)
      const amount = Number(listing.listed_amount || 0)
      restoredAmounts.set(vintageId, (restoredAmounts.get(vintageId) || 0) + amount)
    }

    const { data: balances, error: balancesError } = await this.client
      .from('TOKEN_BALANCES')
      .select('balance_id, project_vintage_id, current_amount')
      .eq('wallet_id', sellerWalletId)
      .in('project_vintage_id', vintageIds)

    if (balancesError) {
      console.error('Error loading token balances:', balancesError)
      return false
    }

    const balanceByVintageId = new Map<number, any>()
    for (const balance of (balances as any[]) || []) {
      balanceByVintageId.set(Number(balance.project_vintage_id), balance)
    }

    for (const item of items) {
      const balance = balanceByVintageId.get(item.vintageId)
      const currentAmount = Number(balance?.current_amount || 0)
      const restored = restoredAmounts.get(item.vintageId) || 0
      const totalOwned = currentAmount + restored

      if (!balance || totalOwned < item.quantity) {
        console.error('Insufficient balance for listing update', { item, currentAmount, restored })
        return false
      }
    }

    if ((existingListings as any[])?.length) {
      const { error: deactivateError } = await this.client
        .from('LISTINGS')
        .update({
          listing_status: 'INACTIVE',
        })
        .eq('seller_wallet_id', sellerWalletId)
        .eq('listing_status', 'ACTIVE')
        .in('project_vintage_id', vintageIds)

      if (deactivateError) {
        console.error('Error deactivating old listings:', deactivateError)
        return false
      }
    }

    for (const item of items) {
      const balance = balanceByVintageId.get(item.vintageId)
      const restored = restoredAmounts.get(item.vintageId) || 0
      const totalOwned = Number(balance.current_amount || 0) + restored

      const { error: restoreError } = await this.client
        .from('TOKEN_BALANCES')
        .update({
          current_amount: totalOwned - item.quantity,
        })
        .eq('balance_id', balance.balance_id)

      if (restoreError) {
        console.error('Error updating token balance after listing:', restoreError)
        return false
      }
    }

    const payload = items.map((item) => ({
      project_vintage_id: item.vintageId,
      seller_wallet_id: sellerWalletId,
      price_per_unit: item.price,
      listed_amount: item.quantity,
      listing_status: 'ACTIVE',
    }))

    const { error } = await this.client.from('LISTINGS').insert(payload)

    if (error) {
      console.error('Error inserting listings data into database:', error)
      return false
    }

    return true
  }
}

export const listingRepository = new ListingRepository()
