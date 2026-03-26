// ─── Project Status & Role Types ────────────────────────────────────────────
export type ProjectStatus = 'pending' | 'approved' | 'token-issued'
export type UserRole = 'ENTERPRISE' | 'REGULATORY_AGENCY' | 'GUEST'

// ─── Representative / Company ───────────────────────────────────────────────
export interface Representative {
  company: string
  taxId: string
  contact: string
  phone: string
  email: string
  walletAddress: string
}

// ─── Token by Year ──────────────────────────────────────────────────────────
export interface TokenYear {
  vintageId?: number
  year: number
  tokenCode: string
  quantity: number
  available: number
  price?: number // USDT per token
  status?: string // 'MINTING' | 'MINTED' | 'RETIRED'
  marketAvailable?: number
  listingId?: number
  onchainListingId?: number
}

// ─── CDM Project ────────────────────────────────────────────────────────────
export interface Project {
  id: string
  code: string           // VN-CDM-2024-001
  name: string
  description: string
  domain: string         // Lĩnh vực
  location: string       // Vị trí
  startDate: string
  endDate: string
  metadataLink: string
  co2Reduction: number   // tCO2
  tokenCount: number
  status: ProjectStatus
  priceMin?: number
  priceMax?: number
  thumbnail: string
  representative: Representative
  tokens?: TokenYear[]
  issuedYear?: number
  tokenCode?: string
}

// ─── Wallet ──────────────────────────────────────────────────────────────────
export interface WalletState {
  address: string | null
  balance: string
  isConnected: boolean
  role: UserRole
}

// ─── Transaction ────────────────────────────────────────────────────────────
export type TransactionType = 'mint' | 'request' | 'sell'
export interface Transaction {
  id: string
  date: string
  txHash: string
  activity: string
  projectCode: string
  amount?: number
  type: TransactionType
}

// ─── Purchased Carbon Credit ────────────────────────────────────────────────
export interface PurchasedCredit {
  project: Project
  quantity: number
  pricePerToken: number
  purchaseDate: string
}
// ─── Certificate ────────────────────────────────────────────────────────────
export interface Certificate {
  id: string
  projectId: string
  projectName: string
  projectCode: string
  date: string      // Format: DD/MM/YYYY
  quantity: number
}
