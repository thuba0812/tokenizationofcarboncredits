/**
 * Contract Configuration
 * 
 * Đọc từ environment variables (VITE_*), fallback về giá trị mặc định.
 * Cập nhật .env hoặc .env.local thay vì sửa file này.
 */

// ─── Contract Addresses ─────────────────────────────────

/** Địa chỉ contract CarbonToken (ERC1155) */
export const CARBON_TOKEN_ADDRESS: string =
  import.meta.env.VITE_CARBON_TOKEN_ADDRESS || '0x8167e713F00c01B73Bf17aD3a366C18250b0dFe9';

/** Địa chỉ contract MockUSDT (ERC20) */
export const MOCK_USDT_ADDRESS: string =
  import.meta.env.VITE_MOCK_USDT_ADDRESS || '0x58E74128f567367b717F63BD13BE8f3A79f79F21';

/** Địa chỉ contract CarbonMarketplace */
export const MARKETPLACE_ADDRESS: string =
  import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x17C73AFF2e6Ca33c75da4dCe85392375118Cd31e';

// ─── Network Config ─────────────────────────────────────

/**
 * Chain ID của mạng deploy
 * - Hardhat Local: 31337
 * - Sepolia Testnet: 11155111
 * - BSC Testnet: 97
 */
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 11155111;

/** Tên mạng hiển thị cho user */
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || 'Sepolia Testnet';

/** Block explorer URL (để link đến transaction) */
export const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io';

/** RPC URL fallback khi không có MetaMask */
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc2.sepolia.org';

// ─── USDT Config ────────────────────────────────────────

/** USDT có 6 decimals (giống real USDT) */
export const USDT_DECIMALS = 6;

// ─── Helper ─────────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Kiểm tra xem contract đã được config chưa */
export function isContractConfigured(): boolean {
  return (
    CARBON_TOKEN_ADDRESS !== ZERO_ADDRESS &&
    MOCK_USDT_ADDRESS !== ZERO_ADDRESS &&
    MARKETPLACE_ADDRESS !== ZERO_ADDRESS
  );
}

