import { BaseRepository } from './BaseRepository'
import type { ListingDB } from '../types/database.types'
import type { Project } from '../types'
import { projectRepository } from './ProjectRepository'
import { isContractConfigured } from '../contracts/contractConfig'
import * as contractService from '../services/contractService'

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

export interface ListingSyncItem {
  vintageId: number
  quantity: number
  price: number
}

export interface ListingSyncMetadata {
  txHash?: string | null
  onchainListingId?: number | null
  walletBalanceAfter?: number | null
  listedAmountAfter?: number | null
  isActiveOnChain?: boolean | null
}

export class ListingRepository extends BaseRepository<ListingDB> {
  constructor() {
    super('LISTINGS')
  }

  private throwDetailedError(message: string, error: any, context?: Record<string, unknown>): never {
    console.error(message, {
      error,
      context,
    })

    const details = [error?.message, error?.details, error?.hint].filter(Boolean).join(' | ')
    throw new Error(details ? `${message}: ${details}` : message)
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
        tokenId: Number(vintage.project_vintage_id),
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

  async createListings(
    walletAddress: string,
    items: ListingSyncItem[],
    metadataByVintageId?: Record<number, ListingSyncMetadata>
  ): Promise<boolean> {
    const { data: walletData, error: walletError } = await this.client
      .from('WALLETS')
      .select('wallet_id')
      .ilike('wallet_address', walletAddress)
      .single()

    if (walletError || !walletData) {
      this.throwDetailedError('Wallet not found or not connected', walletError, { walletAddress })
    }

    const sellerWalletId = Number(walletData.wallet_id)
    const vintageIds = items.map((item) => item.vintageId)

    const { data: existingListings, error: existingListingsError } = await this.client
      .from('LISTINGS')
      .select('listing_id, project_vintage_id, listed_amount, price_per_unit, onchain_listing_id')
      .eq('seller_wallet_id', sellerWalletId)
      .eq('listing_status', 'ACTIVE')
      .in('project_vintage_id', vintageIds)

    if (existingListingsError) {
      this.throwDetailedError('Error loading active listings', existingListingsError, {
        sellerWalletId,
        vintageIds,
      })
    }

    const restoredAmounts = new Map<number, number>()
    const activeListingByVintageId = new Map<number, any>()
    for (const listing of (existingListings as any[]) || []) {
      const vintageId = Number(listing.project_vintage_id)
      const amount = Number(listing.listed_amount || 0)
      restoredAmounts.set(vintageId, (restoredAmounts.get(vintageId) || 0) + amount)
      const existing = activeListingByVintageId.get(vintageId)
      if (!existing || Number(existing.listing_id || 0) < Number(listing.listing_id || 0)) {
        activeListingByVintageId.set(vintageId, listing)
      }
    }

    const { data: balances, error: balancesError } = await this.client
      .from('TOKEN_BALANCES')
      .select('balance_id, project_vintage_id, current_amount')
      .eq('wallet_id', sellerWalletId)
      .in('project_vintage_id', vintageIds)

    if (balancesError) {
      this.throwDetailedError('Error loading token balances', balancesError, {
        sellerWalletId,
        vintageIds,
      })
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
      if (!balance || item.quantity < 0 || totalOwned < item.quantity) {
        throw new Error(
          `Insufficient balance for listing update: vintageId=${item.vintageId}, current=${currentAmount}, restored=${restored}, requested=${item.quantity}`
        )
      }
    }

    for (const item of items) {
      const nextListingStatus = item.quantity === 0 ? 'CANCELLED' : 'INACTIVE'
      const currentListing = activeListingByVintageId.get(item.vintageId)
      const metadata = metadataByVintageId?.[item.vintageId]
      const effectiveOnchainListingId = metadata?.onchainListingId ?? currentListing?.onchain_listing_id ?? null
      let effectiveWalletBalanceAfter = metadata?.walletBalanceAfter ?? null
      let effectiveListedAmountAfter = metadata?.listedAmountAfter ?? null
      let effectiveIsActiveOnChain = metadata?.isActiveOnChain ?? null
      let insertedListingId: number | null = null

      if (isContractConfigured() && effectiveOnchainListingId) {
        try {
          const listingSnapshot = await contractService.getListingOnChain(Number(effectiveOnchainListingId))
          effectiveWalletBalanceAfter = await contractService.getCarbonTokenBalance(
            listingSnapshot.tokenId,
            listingSnapshot.seller
          )
          effectiveListedAmountAfter = listingSnapshot.availableAmount
          effectiveIsActiveOnChain = listingSnapshot.active
        } catch (onchainError) {
          console.error('Error refreshing on-chain listing snapshot before DB sync', {
            onchainError,
            vintageId: item.vintageId,
            effectiveOnchainListingId,
          })
        }
      }

      if (currentListing) {
        const { error: deactivateError } = await this.client
          .from('LISTINGS')
          .update({
            listing_status: nextListingStatus,
          })
          .eq('listing_id', currentListing.listing_id)

        if (deactivateError) {
          this.throwDetailedError('Error updating previous listing status', deactivateError, {
            sellerWalletId,
            vintageId: item.vintageId,
            listingId: currentListing.listing_id,
            nextListingStatus,
          })
        }
      }

      const balance = balanceByVintageId.get(item.vintageId)
      const restored = restoredAmounts.get(item.vintageId) || 0
      const totalOwned = Number(balance.current_amount || 0) + restored
      const nextBalance =
        typeof effectiveWalletBalanceAfter === 'number'
          ? effectiveWalletBalanceAfter
          : totalOwned - item.quantity

      const { error: restoreError } = await this.client
        .from('TOKEN_BALANCES')
        .update({
          current_amount: nextBalance,
        })
        .eq('balance_id', balance.balance_id)

      if (restoreError) {
        this.throwDetailedError('Error updating token balance after listing', restoreError, {
          balanceId: balance.balance_id,
          vintageId: item.vintageId,
          nextBalance,
        })
      }

      const previousListedAmount = restoredAmounts.get(item.vintageId) || 0
      const deltaAmount = previousListedAmount - item.quantity
      const previousPrice = currentListing ? Number(currentListing.price_per_unit || 0) : 0
      let referenceId = currentListing ? Number(currentListing.listing_id) : null
      let referenceType: 'LISTING' | 'UNLIST' = item.quantity < previousListedAmount ? 'UNLIST' : 'LISTING'

      if (item.quantity > 0) {
        const timestamp = new Date().toISOString()
        const payload = {
          project_vintage_id: item.vintageId,
          seller_wallet_id: sellerWalletId,
          price_per_unit: item.price,
          listed_amount:
            typeof effectiveListedAmountAfter === 'number' ? effectiveListedAmountAfter : item.quantity,
          listing_status: effectiveIsActiveOnChain === false ? 'SOLD_OUT' : 'ACTIVE',
          listing_tx_hash: metadata?.txHash ?? null,
          onchain_listing_id: effectiveOnchainListingId,
          created_at: timestamp,
          updated_at: timestamp,
        }

        const { data: insertedListing, error: insertError } = await this.client
          .from('LISTINGS')
          .insert(payload)
          .select('listing_id')
          .single()

        if (insertError) {
          this.throwDetailedError('Error inserting listings data into database', insertError, payload)
        }

        insertedListingId = Number(insertedListing.listing_id)
        referenceId = insertedListingId
        referenceType = 'LISTING'
      }

      const shouldWriteActivity =
        deltaAmount !== 0 || previousListedAmount !== item.quantity || previousPrice !== item.price
      if (shouldWriteActivity) {
        const activityPayload = {
          wallet_id: sellerWalletId,
          project_vintage_id: item.vintageId,
          activity_type: 'LIST',
          delta_amount: deltaAmount,
          reference_id: referenceId,
          reference_type: referenceType,
        }

        const { error: activityError } = await this.client
          .from('TOKEN_ACTIVITY_LOGS')
          .insert(activityPayload)

        if (activityError) {
          this.throwDetailedError('Error inserting token activity log', activityError, activityPayload)
        }
      }

      if (isContractConfigured()) {
        try {
          let finalWalletBalance: number | null = null
          let finalListedAmount: number | null = null
          let finalListingStatus: string | null = null

          if (effectiveOnchainListingId) {
            const listingSnapshot = await contractService.getListingOnChain(Number(effectiveOnchainListingId))
            finalWalletBalance = await contractService.getCarbonTokenBalance(listingSnapshot.tokenId, listingSnapshot.seller)
            finalListedAmount = listingSnapshot.availableAmount
            finalListingStatus = listingSnapshot.active ? 'ACTIVE' : item.quantity === 0 ? 'CANCELLED' : 'SOLD_OUT'
          } else {
            finalWalletBalance = await contractService.getCarbonTokenBalance(item.vintageId, walletAddress)
          }

          if (typeof finalWalletBalance === 'number') {
            const { error: finalBalanceError } = await this.client
              .from('TOKEN_BALANCES')
              .update({
                current_amount: finalWalletBalance,
              })
              .eq('balance_id', balance.balance_id)

            if (finalBalanceError) {
              console.error('Error finalizing token balance from on-chain', {
                finalBalanceError,
                balanceId: balance.balance_id,
                vintageId: item.vintageId,
                finalWalletBalance,
              })
            }
          }

          if (insertedListingId && typeof finalListedAmount === 'number') {
            const { error: finalListingError } = await this.client
              .from('LISTINGS')
              .update({
                listed_amount: finalListedAmount,
                listing_status: finalListingStatus ?? 'ACTIVE',
              })
              .eq('listing_id', insertedListingId)

            if (finalListingError) {
              console.error('Error finalizing listing from on-chain', {
                finalListingError,
                listingId: insertedListingId,
                vintageId: item.vintageId,
                finalListedAmount,
                finalListingStatus,
              })
            }
          }
        } catch (finalizeError) {
          console.error('Error reconciling seller DB state from on-chain after listing sync', {
            finalizeError,
            vintageId: item.vintageId,
            effectiveOnchainListingId,
          })
        }
      }
    }

    return true
  }
}

export const listingRepository = new ListingRepository()
