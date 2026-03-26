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
      items.push({
        project,
        quantity: listing.listed_amount,
        available: listing.available_amount,
        pricePerToken: listing.price_per_unit,
        listingId: listing.listing_id
      });
    }

    return items;
  }

  async createListings(walletAddress: string, items: { vintageId: number, quantity: number, price: number }[]): Promise<boolean> {
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
      listing_status: 'ACTIVE'
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
}

export const listingRepository = new ListingRepository();
