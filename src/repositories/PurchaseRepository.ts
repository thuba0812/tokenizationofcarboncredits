import { BaseRepository } from './BaseRepository'

export class PurchaseRepository extends BaseRepository<any> {
  constructor() {
    super('PURCHASES')
  }

  async recordPurchase(
    walletAddress: string,
    projectCode: string,
    items: { listingId: number; amount: number; price: number; vintageId: number }[],
    txHash: string
  ): Promise<boolean> {
    try {
      // 1. Lấy buyer_wallet_id
      const { data: walletData, error: walletError } = await this.client
        .from('WALLETS')
        .select('wallet_id')
        .ilike('wallet_address', walletAddress)
        .single()

      if (walletError || !walletData) {
        console.error('Buyer wallet not found', walletError)
        return false
      }
      const buyerWalletId = Number(walletData.wallet_id)

      // 2. Lấy project_id từ projectCode
      const { data: projectData, error: projectError } = await this.client
        .from('PROJECTS')
        .select('project_id')
        .eq('project_code', projectCode)
        .single()

      if (projectError || !projectData) {
        console.error('Project not found', projectError)
        return false
      }
      const projectId = Number(projectData.project_id)

      // 3. Tạo record PURCHASES
      const { data: purchase, error: purchaseError } = await this.client
        .from('PURCHASES')
        .insert({
          project_id: projectId,
          buyer_wallet_id: buyerWalletId,
          purchase_tx_hash: txHash,
          purchase_status: 'COMPLETED',
          executed_at: new Date().toISOString(),
          fee_amount: 0 // Mock fee
        })
        .select()
        .single()

      if (purchaseError || !purchase) {
        console.error('Error creating purchase record', purchaseError)
        return false
      }
      const purchaseId = Number(purchase.purchase_id)

      // 4. Xử lý từng item trong đơn hàng
      for (const item of items) {
        console.log('Processing purchase item:', item);

        // a. Tạo PURCHASE_ITEMS
        const { error: itemError } = await this.client
          .from('PURCHASE_ITEMS')
          .insert({
            purchase_id: purchaseId,
            listing_id: item.listingId,
            purchased_amount: item.amount,
            unit_price: item.price
          })

        if (itemError) {
          console.error('Error creating purchase item:', itemError);
          continue; // Skip logs if item failed? Or continue?
        }

        // b. Cập nhật LISTINGS (giảm listed_amount)
        const { data: listingData, error: fetchListingError } = await this.client
          .from('LISTINGS')
          .select('listed_amount')
          .eq('listing_id', item.listingId)
          .single()
        
        if (fetchListingError) {
          console.error('Error fetching listing amount:', fetchListingError);
        } else {
          const currentListed = Number(listingData?.listed_amount || 0)
          const newListed = Math.max(0, currentListed - item.amount)
          const newStatus = newListed === 0 ? 'SOLD_OUT' : 'ACTIVE'

          const { error: updateListingError } = await this.client
            .from('LISTINGS')
            .update({
              listed_amount: newListed,
              listing_status: newStatus
            })
            .eq('listing_id', item.listingId)
          
          if (updateListingError) console.error('Error updating listing amount:', updateListingError);
        }

        // c. Ghi log TOKEN_ACTIVITY_LOGS cho nguoi mua (NHAN)
        const { error: buyerLogError } = await this.client
          .from('TOKEN_ACTIVITY_LOGS')
          .insert({
            wallet_id: buyerWalletId,
            project_vintage_id: item.vintageId,
            activity_type: 'PURCHASE',
            delta_amount: item.amount,
            reference_id: purchaseId,
            reference_type: 'PURCHASE'
          })
        if (buyerLogError) console.error('Error creating buyer log:', buyerLogError);

        // d. Ghi log TOKEN_ACTIVITY_LOGS cho nguoi ban (TRU DI)
        const { data: sellerListingData, error: fetchSellerError } = await this.client
          .from('LISTINGS')
          .select('seller_wallet_id')
          .eq('listing_id', item.listingId)
          .single()
        
        if (fetchSellerError) {
          console.error('Error fetching seller wallet ID:', fetchSellerError);
        } else if (sellerListingData?.seller_wallet_id) {
          const { error: sellerLogError } = await this.client
            .from('TOKEN_ACTIVITY_LOGS')
            .insert({
              wallet_id: sellerListingData.seller_wallet_id,
              project_vintage_id: item.vintageId,
              activity_type: 'PURCHASE',
              delta_amount: -item.amount,
              reference_id: purchaseId,
              reference_type: 'PURCHASE'
            })
          if (sellerLogError) console.error('Error creating seller log:', sellerLogError);
        }
      }

      return true
    } catch (err) {
      console.error('Fatal error in recordPurchase', err)
      return false
    }
  }
}

export const purchaseRepository = new PurchaseRepository()

