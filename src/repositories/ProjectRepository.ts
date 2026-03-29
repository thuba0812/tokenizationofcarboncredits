/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase nested joins return untyped results */
import { BaseRepository } from './BaseRepository';
import type { ProjectDB, OrganizationDB, ProjectVintageDB } from '../types/database.types';
import type { Project, Representative, TokenYear, ProjectStatus } from '../types';

export interface ProjectWithDetails extends ProjectDB {
  ORGANIZATIONS: OrganizationDB & { WALLETS?: { wallet_address: string }[] };
  PROJECT_VINTAGES: (ProjectVintageDB & { LISTINGS?: any[] })[];
}

export class ProjectRepository extends BaseRepository<ProjectDB> {
  constructor() {
    super('PROJECTS');
  }

  // Mapper: converts DB model to UI model
  public mapToDTO(row: any): Project {
    const org = row.ORGANIZATIONS;
    const wallet = org?.WALLETS?.[0]?.wallet_address || '0x0000000000000000000000000000000000000000';

    const rep: Representative = {
      company: org?.organization_name || 'N/A',
      taxId: org?.tax_code || 'N/A',
      contact: org?.legal_representative || 'N/A',
      phone: org?.phone_number || 'N/A',
      email: org?.email || 'N/A',
      walletAddress: wallet,
    };

    const tokens: TokenYear[] = (row.PROJECT_VINTAGES || []).map((v: any) => {
      const activeListings = (v.LISTINGS || []).filter((l: any) => l.listing_status === 'ACTIVE')
      const latestActiveListing = [...activeListings].sort(
        (a: any, b: any) => Number(b.listing_id || 0) - Number(a.listing_id || 0)
      )[0]
      const activeListingsTotal = activeListings.reduce(
        (sum: number, l: any) => sum + Number(l.listed_amount || 0),
        0
      )

      const totalOwnedMock = v.issued_creadit_amount - (v.minted_amount || 0)

      return {
        vintageId: v.project_vintage_id,
        year: v.vintage_year,
        tokenCode: v.credit_code,
        quantity: v.issued_creadit_amount,
        available: Math.max(0, totalOwnedMock - activeListingsTotal),
        price: latestActiveListing ? Number(latestActiveListing.price_per_unit || 0) : 0,
        currentListingId: latestActiveListing ? Number(latestActiveListing.listing_id) : null,
        onchainListingId: latestActiveListing?.onchain_listing_id ? Number(latestActiveListing.onchain_listing_id) : null,
        listingTxHash: latestActiveListing?.listing_tx_hash ?? null,
        status: v.status,
        tokenId: v.token_id ? Number(v.token_id) : null,
        mintTxHash: v.mint_tx_hash ?? null,
        mintedAmount: v.minted_amount ?? null,
        mintedAt: v.minted_at ?? null,
      }
    });

    // Status map
    let status: ProjectStatus = 'pending';
    if (row.project_status === 'ACTIVE') status = 'approved';
    if (row.project_status === 'COMPLETED' || row.PROJECT_VINTAGES?.length > 0) status = 'token-issued';

    return {
      id: row.project_id.toString(),
      code: row.project_code,
      name: row.project_name,
      description: row.project_description || '',
      domain: row.sector || 'N/A',
      location: [row.country, row.province_city].filter(Boolean).join(', '),
      startDate: row.start_date || '',
      endDate: row.end_date || '',
      metadataLink: '',
      co2Reduction: row.PROJECT_VINTAGES?.reduce((sum: number, v: any) => sum + Number(v.verified_co2_reduction), 0) || 0,
      tokenCount: row.PROJECT_VINTAGES?.reduce((sum: number, v: any) => sum + Number(v.issued_creadit_amount), 0) || 0,
      status,
      thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80', // Default fallback
      representative: rep,
      tokens,
      issuedYear: tokens?.[0]?.year,
      tokenCode: tokens?.[0]?.tokenCode,
      priceMin: tokens.length > 0 ? Math.min(...tokens.map(t => t.price || 0)) : 0,
      priceMax: tokens.length > 0 ? Math.max(...tokens.map(t => t.price || 0)) : 0,
    };
  }

  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        ORGANIZATIONS (
          *,
          WALLETS ( wallet_address )
        ),
        PROJECT_VINTAGES (
          *,
          LISTINGS ( * )
        )
      `);
    
    if (error) {
      console.error('Error fetching projects with details', error);
      return [];
    }

    return (data as any[]).map(this.mapToDTO);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        ORGANIZATIONS (
          *,
          WALLETS ( wallet_address )
        ),
        PROJECT_VINTAGES (
          *,
          LISTINGS ( * )
        )
      `)
      .eq('project_id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching project by id', error);
      return null;
    }

    return this.mapToDTO(data);
  }
}

export const projectRepository = new ProjectRepository();
