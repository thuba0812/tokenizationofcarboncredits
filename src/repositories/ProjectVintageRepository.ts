import { BaseRepository } from './BaseRepository';
import type { IPFSFileDB, ProjectVintageDB, WalletDB } from '../types/database.types';

export interface ProjectVintageWithDetails extends ProjectVintageDB {
  PROJECTS: {
    project_id: number;
    project_code: string;
    project_name: string;
    project_description?: string;
    sector?: string;
    country?: string;
    province_city?: string;
    start_date?: string;
    end_date?: string;
    owner_organization_id: number;
    ORGANIZATIONS?: {
      organization_name: string;
      tax_code?: string;
      legal_representative?: string;
      phone_number?: string;
      email?: string;
      WALLETS?: Pick<WalletDB, 'wallet_id' | 'wallet_address'>[];
    };
  };
  metadataCid?: string | null;
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
            WALLETS ( wallet_id, wallet_address )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project vintages:', error);
      return [];
    }

    const rows = (data || []) as ProjectVintageWithDetails[];
    const vintageIds = rows.map((row) => row.project_vintage_id);

    if (vintageIds.length === 0) {
      return rows;
    }

    const { data: metadataRows, error: metadataError } = await this.client
      .from('IPFS_FILES')
      .select('object_id, cid')
      .eq('object_type', 'PROJECT_VINTAGE')
      .eq('file_type', 'TOKEN_METADATA')
      .in('object_id', vintageIds);

    if (metadataError) {
      console.error('Error fetching token metadata CID:', metadataError);
      return rows;
    }

    const metadataByVintageId = new Map<number, string>();
    (metadataRows as Pick<IPFSFileDB, 'object_id' | 'cid'>[] | null)?.forEach((row) => {
      metadataByVintageId.set(Number(row.object_id), row.cid);
    });

    return rows.map((row) => ({
      ...row,
      metadataCid: metadataByVintageId.get(row.project_vintage_id) ?? null,
    }));
  }

  async getByIdWithDetails(projectVintageId: string | number): Promise<ProjectVintageWithDetails | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        PROJECTS (
          project_id,
          project_code,
          project_name,
          project_description,
          sector,
          country,
          province_city,
          start_date,
          end_date,
          owner_organization_id,
          ORGANIZATIONS (
            organization_name,
            tax_code,
            legal_representative,
            phone_number,
            email,
            WALLETS ( wallet_id, wallet_address )
          )
        )
      `)
      .eq('project_vintage_id', projectVintageId)
      .single();

    if (error) {
      console.error('Error fetching project vintage by id:', error);
      return null;
    }

    const row = data as ProjectVintageWithDetails;

    const { data: metadataRows, error: metadataError } = await this.client
      .from('IPFS_FILES')
      .select('object_id, cid')
      .eq('object_type', 'PROJECT_VINTAGE')
      .eq('file_type', 'TOKEN_METADATA')
      .eq('object_id', row.project_vintage_id)
      .limit(1);

    if (metadataError) {
      console.error('Error fetching single token metadata CID:', metadataError);
      return row;
    }

    return {
      ...row,
      metadataCid: (metadataRows as Pick<IPFSFileDB, 'cid'>[] | null)?.[0]?.cid ?? null,
    };
  }

  async markMinted(
    projectVintageId: number,
    txHash: string,
    amount: number,
    tokenId: number,
    walletId?: number
  ) {
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

    if (walletId) {
      const { error: balanceError } = await this.client
        .from('TOKEN_BALANCES')
        .upsert(
          {
            wallet_id: walletId,
            project_vintage_id: projectVintageId,
            current_amount: amount,
          },
          {
            onConflict: 'wallet_id,project_vintage_id',
          }
        );

      if (balanceError) {
        throw balanceError;
      }

      const { error: activityError } = await this.client
        .from('TOKEN_ACTIVITY_LOGS')
        .insert({
          wallet_id: walletId,
          project_vintage_id: projectVintageId,
          activity_type: 'MINT',
          delta_amount: amount,
          reference_type: 'MINT',
        });

      if (activityError) {
        throw activityError;
      }
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
