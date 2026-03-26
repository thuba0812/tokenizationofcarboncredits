import { BaseRepository } from './BaseRepository';
import type { ProjectVintageDB } from '../types/database.types';

export interface ProjectVintageWithDetails extends ProjectVintageDB {
  PROJECTS: {
    project_id: number;
    project_code: string;
    project_name: string;
    sector?: string;
    owner_organization_id: number;
    ORGANIZATIONS?: {
      organization_name: string;
      WALLETS?: { wallet_address: string }[];
    };
  };
}

export class ProjectVintageRepository extends BaseRepository<ProjectVintageDB> {
  constructor() {
    super('PROJECT_VINTAGES');
  }

  async getAllWithDetails(): Promise<ProjectVintageWithDetails[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        PROJECTS (
          project_id,
          project_code,
          project_name,
          sector,
          owner_organization_id,
          ORGANIZATIONS (
            organization_name,
            WALLETS ( wallet_address )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project vintages:', error);
      return [];
    }

    return (data || []) as ProjectVintageWithDetails[];
  }

  async markMinted(projectVintageId: number, txHash: string, amount: number, tokenId: number) {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'MINTED',
        token_id: tokenId,
        mint_tx_hash: txHash,
        minted_amount: amount,
        minted_at: new Date().toISOString(),
      })
      .eq('project_vintage_id', projectVintageId);

    if (error) {
      throw error;
    }
  }

  async markMintError(projectVintageId: number) {
    const { error } = await this.client
      .from(this.tableName)
      .update({
        status: 'ERROR',
      })
      .eq('project_vintage_id', projectVintageId);

    if (error) {
      throw error;
    }
  }
}

export const projectVintageRepository = new ProjectVintageRepository();
