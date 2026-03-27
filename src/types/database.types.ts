export interface OrganizationDB {
  organization_id: number;
  organization_code: string;
  organization_name: string;
  organization_type: 'ENTERPRISE' | 'REGULATORY_AGENCY';
  business_registration_no?: string;
  tax_code?: string;
  headquarters_address?: string;
  phone_number?: string;
  email?: string;
  legal_representative?: string;
  operating_status: string;
}

export interface ProjectDB {
  project_id: number;
  project_code: string;
  project_name: string;
  project_description?: string;
  sector?: string;
  country?: string;
  province_city?: string;
  ward_commune?: string;
  owner_organization_id: number;
  start_date?: string;
  end_date?: string;
  project_status: string;
}

export interface ProjectVintageDB {
  project_vintage_id: number;
  project_id: number;
  vintage_year: number;
  credit_code: string;
  verified_co2_reduction: number;
  issued_creadit_amount: number;
  status: string;
  token_id?: number;
  mint_tx_hash?: string;
  minted_amount?: number;
  minted_at?: string;
}

export interface WalletDB {
  wallet_id: number;
  organization_id: number;
  wallet_address: string;
  blockchain_network?: string;
  public_key?: string;
  wallet_status: string;
}

export interface IPFSFileDB {
  ipfs_file_id: number;
  object_type: 'PROJECT' | 'PROJECT_VINTAGE' | 'RETIREMENT';
  object_id: number;
  file_type: 'PROJECT_DOCUMENT' | 'MRV_REPORT' | 'TOKEN_METADATA' | 'RETIREMENT_CERTIFICATE';
  cid: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  is_public: boolean;
}

export interface ListingDB {
  listing_id: number;
  project_vintage_id: number;
  seller_wallet_id: number;
  price_per_unit: number;
  listed_amount: number;
  available_amount: number;
  listing_status: string;
}

export interface TokenBalanceDB {
  balance_id: number;
  wallet_id: number;
  project_vintage_id: number;
  current_amount: number;
}

export interface TransactionDB {
  activity_id: number;
  wallet_id: number;
  project_vintage_id: number;
  activity_type: string;
  delta_amount: number;
  created_at: string;
  reference_id?: number;
  reference_type?: string;
}

export interface RetirementDB {
  retirement_id: number;
  organization_id: number;
  wallet_id: number;
  quota_id: number;
  retirement_status: string;
  retired_at: string;
  retirement_tx_hash: string;
  created_at: string;
}
