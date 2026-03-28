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
// TODO: Cập nhật sau khi deploy

/** Địa chỉ contract CarbonToken (ERC1155) */
export const CARBON_TOKEN_ADDRESS: string = '0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd';

/** Địa chỉ contract MockUSDT (ERC20) */
export const MOCK_USDT_ADDRESS: string = '0xFD2Cf3b56a73c75A7535fFe44EBABe7723c64719';

/** Địa chỉ contract CarbonMarketplace */
export const MARKETPLACE_ADDRESS: string = '0x666D0c3da3dBc946D5128D06115bb4eed4595580';

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
