/**
 * Contract Configuration
 * 
 * ⚠️ QUAN TRỌNG: Sau khi deploy contract, hãy cập nhật các địa chỉ bên dưới.
 * 
 * Các bước:
 * 1. Deploy MockUSDT → lấy address → điền vào MOCK_USDT_ADDRESS
 * 2. Deploy CarbonToken → lấy address → điền vào CARBON_TOKEN_ADDRESS  
 * 3. Deploy CarbonMarketplace (truyền CarbonToken address + MockUSDT address) → điền vào MARKETPLACE_ADDRESS
 * 4. Cập nhật CHAIN_ID phù hợp với mạng deploy
 */

// ─── Contract Addresses ─────────────────────────────────

/** Địa chỉ contract CarbonToken (ERC1155) */
export const CARBON_TOKEN_ADDRESS: string = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

/** Địa chỉ contract MockUSDT (ERC20) */
export const MOCK_USDT_ADDRESS: string = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/** Địa chỉ contract CarbonMarketplace */
export const MARKETPLACE_ADDRESS: string = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

// ─── Network Config ─────────────────────────────────────

/**
 * Chain ID của mạng deploy
 * - Hardhat Local: 31337
 * - Sepolia Testnet: 11155111
 * - BSC Testnet: 97
 * - Localhost Ganache: 1337
 */
export const CHAIN_ID = 31337;

/** Tên mạng hiển thị cho user */
export const NETWORK_NAME = 'Hardhat Local';

/** Block explorer URL (để link đến transaction) */
export const BLOCK_EXPLORER_URL = '';

// ─── USDT Config ────────────────────────────────────────

/** USDT có 6 decimals (giống real USDT) */
export const USDT_DECIMALS = 6;

// ─── Helper ─────────────────────────────────────────────

/** Kiểm tra xem contract đã được config chưa */
export function isContractConfigured(): boolean {
  return (
    CARBON_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
    MOCK_USDT_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
    MARKETPLACE_ADDRESS !== '0x0000000000000000000000000000000000000000'
  );
}
