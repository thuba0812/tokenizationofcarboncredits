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
export const CARBON_TOKEN_ADDRESS: string = '0x53fF7837667a7158AFCAf3e93e3BCd9eD5bd0c8F';

/** Địa chỉ contract MockUSDT (ERC20) */
export const MOCK_USDT_ADDRESS: string = '0xA20192c45deFB2FeB44a396c6Cef4a073cA296aB';

/** Địa chỉ contract CarbonMarketplace */
export const MARKETPLACE_ADDRESS: string = '0xF968995D66e80abf90C7F9c925cf0B78e49534dc';

// ─── Network Config ─────────────────────────────────────

/**
 * Chain ID của mạng deploy
 * - Hardhat Local: 31337
 * - Sepolia Testnet: 11155111
 * - BSC Testnet: 97
 * - Localhost Ganache: 1337
 */
export const CHAIN_ID = 11155111;

/** Tên mạng hiển thị cho user */
export const NETWORK_NAME = 'Sepolia Testnet';

/** Block explorer URL (để link đến transaction) */
export const BLOCK_EXPLORER_URL = 'https://sepolia.etherscan.io';

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
