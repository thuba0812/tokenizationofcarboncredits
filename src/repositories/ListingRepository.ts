import { BaseRepository } from './BaseRepository';
import type { ListingDB } from '../types/database.types';
import type { Project } from '../types';
import { projectRepository } from './ProjectRepository';

export interface MarketplaceItem {
  project: Project;
  quantity: number;
  available: number;
  pricePerToken: number;
  listingId: number;
  onchainListingId?: number;
}

export class ListingRepository extends BaseRepository<ListingDB> {
  constructor() {
    super('LISTINGS');
  }

  async getActiveListings(): Promise<MarketplaceItem[]> {
    const { data, error } = await this.client
      .from('LISTINGS')
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
      .eq('listing_status', 'ACTIVE')
      .gt('available_amount', 0);

    if (error) {
      console.error('Error fetching listings', error);
      return [];
    }

    const items: MarketplaceItem[] = [];

    for (const listing of data as any[]) {
      const vintage = listing.PROJECT_VINTAGES;
      if (!vintage) continue;

      const projectData = vintage.PROJECTS;
      if (!projectData) continue;

      const project = projectRepository.mapToDTO(projectData);
      
      let onchainListingId = undefined;
      if (listing.listing_tx_hash && listing.listing_tx_hash.includes('|')) {
        onchainListingId = parseInt(listing.listing_tx_hash.split('|')[1]);
      }

      items.push({
        project,
        quantity: listing.listed_amount,
        available: listing.available_amount,
        pricePerToken: listing.price_per_unit,
        listingId: listing.listing_id,
        onchainListingId
      });
    }

    return items;
  }

  async createListings(walletAddress: string, items: { vintageId: number, quantity: number, price: number, txHash?: string, onchainListingId?: string }[]): Promise<boolean> {
    const { data: walletData, error: walletError } = await this.client
      .from('WALLETS')
      .select('wallet_id')
      .ilike('wallet_address', walletAddress)
      .single();

    if (walletError || !walletData) {
      console.error('Wallet not found or not connected', walletError);
      return false;
    }

    const seller_wallet_id = walletData.wallet_id;

    const payload = items.map(item => ({
      project_vintage_id: item.vintageId,
      seller_wallet_id,
      price_per_unit: item.price,
      listed_amount: item.quantity,
      available_amount: item.quantity,
      listing_status: 'ACTIVE',
      listing_tx_hash: item.onchainListingId ? `${item.txHash}|${item.onchainListingId}` : item.txHash
    }));

    const { error } = await this.client
      .from('LISTINGS')
      .insert(payload);

    if (error) {
      console.error('Error inserting listings data into database:', error);
      return false;
    }

    return true;
  }

  async recordPurchase(walletAddress: string, projectId: number, listingId: number, quantity: number, price: number, txHash: string): Promise<boolean> {
    try {
      // 1. Get Wallet ID of buyer
      const { data: walletData, error: walletError } = await this.client
        .from('WALLETS')
        .select('wallet_id')
        .ilike('wallet_address', walletAddress)
        .single();

      if (walletError || !walletData) throw new Error('Wallet not found');
      const buyer_wallet_id = walletData.wallet_id;

      // 2. Fetch current listing to get available amount & project_vintage_id
      const { data: listingData, error: listingError } = await this.client
        .from('LISTINGS')
        .select('available_amount, project_vintage_id')
        .eq('listing_id', listingId)
        .single();
        
      if (listingError || !listingData) throw new Error('Listing not found');
      
      const newAvailable = Math.max(0, listingData.available_amount - quantity);
      const newStatus = newAvailable === 0 ? 'SOLD_OUT' : 'ACTIVE';

      // 3. Update Listing
      await this.client
        .from('LISTINGS')
        .update({ available_amount: newAvailable, listing_status: newStatus })
        .eq('listing_id', listingId);

      // 4. Create Purchase Record
      const { data: purchaseData, error: purchaseError } = await this.client
        .from('PURCHASES')
        .insert({
           project_id: projectId,
           buyer_wallet_id,
           purchase_status: 'COMPLETED',
           purchase_tx_hash: txHash,
           fee_amount: 0
        }).select('purchase_id').single();

      if (purchaseError || !purchaseData) throw new Error('Failed to create purchase record');
      const purchase_id = purchaseData.purchase_id;

      // 5. Create Purchase Item
      await this.client
        .from('PURCHASE_ITEMS')
        .insert({
           purchase_id,
           listing_id: listingId,
           purchased_amount: quantity,
           unit_price: price
        });
        
      // 6. Update Buyer Token Balance
      const { data: balanceData } = await this.client
        .from('TOKEN_BALANCES')
        .select('balance_id, current_amount')
        .eq('wallet_id', buyer_wallet_id)
        .eq('project_vintage_id', listingData.project_vintage_id)
        .maybeSingle();
        
      if (balanceData) {
         await this.client.from('TOKEN_BALANCES')
           .update({ current_amount: balanceData.current_amount + quantity })
           .eq('balance_id', balanceData.balance_id);
      } else {
         await this.client.from('TOKEN_BALANCES')
           .insert({
             wallet_id: buyer_wallet_id,
             project_vintage_id: listingData.project_vintage_id,
             current_amount: quantity
           });
      }

      return true;
    } catch (e) {
      console.error('recordPurchase error:', e);
      return false;
    }
  }
}

export const listingRepository = new ListingRepository();
