/**
 * Contract Service Layer
 * 
 * Service tương tác với 3 smart contracts thông qua ethers.js v6:
 * - CarbonToken (ERC1155): mint, burn, query
 * - MockUSDT (ERC20): approve, balance
 * - CarbonMarketplace: list, buy, cancel
 */

import { BrowserProvider, Contract, formatUnits, Interface, parseUnits } from 'ethers';
import { CarbonTokenABI } from '../contracts/CarbonTokenABI';
import { MockUSDTABI } from '../contracts/MockUSDTABI';
import { CarbonMarketplaceABI } from '../contracts/CarbonMarketplaceABI';
import {
  CARBON_TOKEN_ADDRESS,
  MOCK_USDT_ADDRESS,
  MARKETPLACE_ADDRESS,
  USDT_DECIMALS,
  isContractConfigured,
} from '../contracts/contractConfig';

// ─── Helpers ────────────────────────────────────────────

function getProvider(): BrowserProvider {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('MetaMask chưa được cài đặt');
  return new BrowserProvider(eth);
}

async function getSigner() {
  const provider = getProvider();
  return provider.getSigner();
}

function getCarbonTokenContract(signerOrProvider: any) {
  return new Contract(CARBON_TOKEN_ADDRESS, CarbonTokenABI, signerOrProvider);
}

function getMockUSDTContract(signerOrProvider: any) {
  return new Contract(MOCK_USDT_ADDRESS, MockUSDTABI, signerOrProvider);
}

function getMarketplaceContract(signerOrProvider: any) {
  return new Contract(MARKETPLACE_ADDRESS, CarbonMarketplaceABI, signerOrProvider);
}

// ─── Kiểm tra config ───────────────────────────────────

function assertConfigured() {
  if (!isContractConfigured()) {
    throw new Error(
      'Smart contract chưa được cấu hình. Vui lòng cập nhật địa chỉ contract trong src/contracts/contractConfig.ts'
    );
  }
}

export interface MintProjectVintageItem {
  to: string;
  tokenId: number;
  projectId: string;
  serialId: string;
  vintageYear: number;
  amount: number;
  cid: string;
}

export interface MintProjectVintageResult {
  txHash: string;
  mintedTokenIds: number[];
  skippedTokenIds: number[];
}

// ═══════════════════════════════════════════════════════
//  SELLER - Đăng bán token trên Marketplace
// ═══════════════════════════════════════════════════════

/**
 * Kiểm tra seller đã approve CarbonToken cho Marketplace chưa
 */
export async function isMarketplaceApproved(): Promise<boolean> {
  assertConfigured();
  const signer = await getSigner();
  const address = await signer.getAddress();
  const carbonToken = getCarbonTokenContract(signer);
  return carbonToken.isApprovedForAll(address, MARKETPLACE_ADDRESS);
}

/**
 * Seller approve CarbonToken (ERC1155) cho Marketplace
 * Cần gọi 1 lần trước khi createListing
 */
export async function approveMarketplace(): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const carbonToken = getCarbonTokenContract(signer);
  const tx = await carbonToken.setApprovalForAll(MARKETPLACE_ADDRESS, true);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Đăng bán 1 loại token trên marketplace
 * @param tokenId - ID token (= project_vintage_id)
 * @param pricePerUnit - Giá mỗi token (USDT, chưa nhân decimals)
 * @param amount - Số lượng token muốn bán
 */
export async function createListing(
  tokenId: number,
  pricePerUnit: number,
  amount: number
): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  // Convert giá sang USDT decimals (6)
  const priceInSmallestUnit = parseUnits(pricePerUnit.toString(), USDT_DECIMALS);

  const tx = await marketplace.createListing(tokenId, priceInSmallestUnit, amount);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Đăng bán nhiều loại token cùng lúc (1 transaction)
 * @param items - Array { tokenId, pricePerUnit (USDT), amount }
 */
export async function createListingsBatch(
  items: { tokenId: number; pricePerUnit: number; amount: number }[]
): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  const tokenIds = items.map((i) => i.tokenId);
  const prices = items.map((i) => parseUnits(i.pricePerUnit.toString(), USDT_DECIMALS));
  const amounts = items.map((i) => i.amount);

  const tx = await marketplace.createListingsBatch(tokenIds, prices, amounts);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Hủy listing
 */
export async function cancelListing(listingId: number): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  const tx = await marketplace.cancelListing(listingId);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ═══════════════════════════════════════════════════════
//  BUYER - Mua token từ Marketplace
// ═══════════════════════════════════════════════════════

/**
 * Lấy số dư USDT của user (đã format về USDT)
 */
export async function getUSDTBalance(): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const address = await signer.getAddress();
  const usdt = getMockUSDTContract(signer);
  const balance = await usdt.balanceOf(address);
  return formatUnits(balance, USDT_DECIMALS);
}

/**
 * Kiểm tra USDT allowance hiện tại cho Marketplace
 */
export async function getUSDTAllowance(): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const address = await signer.getAddress();
  const usdt = getMockUSDTContract(signer);
  const allowance = await usdt.allowance(address, MARKETPLACE_ADDRESS);
  return formatUnits(allowance, USDT_DECIMALS);
}

/**
 * Buyer approve USDT cho Marketplace
 * @param amount - Số USDT muốn approve (chưa nhân decimals)
 */
export async function approveUSDT(amount: number): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const usdt = getMockUSDTContract(signer);

  const amountInSmallestUnit = parseUnits(amount.toString(), USDT_DECIMALS);
  const tx = await usdt.approve(MARKETPLACE_ADDRESS, amountInSmallestUnit);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Mua token theo project
 * @param projectId - Mã project (string)
 * @param listingIds - Array listing IDs trên marketplace contract
 * @param amounts - Array số lượng tương ứng
 */
export async function buyByProject(
  projectId: string,
  listingIds: number[],
  amounts: number[]
): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  const tx = await marketplace.buyByProject(projectId, listingIds, amounts);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ═══════════════════════════════════════════════════════
//  BURN - Tiêu hủy token
// ═══════════════════════════════════════════════════════

/**
 * Burn token carbon theo batch
 * @param tokenIds - Array token IDs (= project_vintage_id)
 * @param amounts - Array số lượng tương ứng
 * @param allowedQuota - Hạn ngạch cho phép (backend truyền vào)
 */
export async function burnCarbonBatch(
  tokenIds: number[],
  amounts: number[],
  allowedQuota: number
): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const carbonToken = getCarbonTokenContract(signer);

  const tx = await carbonToken.burnCarbonBatch(tokenIds, amounts, allowedQuota);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ═════════════════════════════════════════════════════════════════════════════
//  REGULATORY AGENCY - Mint token
// ═════════════════════════════════════════════════════════════════════════════

export async function mintProjectYearBatch(
  items: MintProjectVintageItem[]
): Promise<MintProjectVintageResult> {
  assertConfigured();
  const signer = await getSigner();
  const carbonToken = getCarbonTokenContract(signer);

  const tx = await carbonToken.mintProjectYearBatchSoft(items);
  const receipt = await tx.wait();
  const iface = new Interface(CarbonTokenABI);
  const mintedTokenIds: number[] = [];
  const skippedTokenIds: number[] = [];

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;
      if (parsed.name === 'CarbonMinted') {
        mintedTokenIds.push(Number(parsed.args.tokenId));
      }
      if (parsed.name === 'CarbonMintSkipped') {
        skippedTokenIds.push(Number(parsed.args.tokenId));
      }
    } catch {
      // Ignore logs from other contracts.
    }
  }

  return {
    txHash: receipt.hash,
    mintedTokenIds,
    skippedTokenIds,
  };
}

// ═══════════════════════════════════════════════════════
//  VIEW - Đọc dữ liệu từ contract
// ═══════════════════════════════════════════════════════

/**
 * Lấy thông tin token từ contract
 */
export async function getTokenInfo(tokenId: number) {
  assertConfigured();
  const provider = getProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const info = await carbonToken.getTokenInfo(tokenId);
  return {
    projectId: info[0] as string,
    serialId: info[1] as string,
    vintageYear: Number(info[2]),
    cid: info[3] as string,
    totalMinted: Number(info[4]),
    currentSupply: Number(info[5]),
    totalBurned: Number(info[6]),
    exists: info[7] as boolean,
  };
}

/**
 * Lấy balance ERC1155 của address cho tokenId
 */
export async function getTokenBalance(address: string, tokenId: number): Promise<number> {
  assertConfigured();
  const provider = getProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const balance = await carbonToken.balanceOf(address, tokenId);
  return Number(balance);
}

/**
 * Lấy thông tin listing từ marketplace contract
 */
export async function getListingOnChain(listingId: number) {
  assertConfigured();
  const provider = getProvider();
  const marketplace = getMarketplaceContract(provider);
  const listing = await marketplace.getListing(listingId);
  return {
    listingId: Number(listing.listingId),
    seller: listing.seller as string,
    tokenId: Number(listing.tokenId),
    projectId: listing.projectId as string,
    vintageYear: Number(listing.vintageYear),
    pricePerUnit: formatUnits(listing.pricePerUnit, USDT_DECIMALS),
    availableAmount: Number(listing.availableAmount),
    active: listing.active as boolean,
  };
}

/**
 * Lấy tổng số token đã burn của enterprise
 */
export async function getTotalEnterpriseBurned(address: string): Promise<number> {
  assertConfigured();
  const provider = getProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const burned = await carbonToken.totalEnterpriseBurned(address);
  return Number(burned);
}

/**
 * Kiểm tra token có tồn tại trên chain không
 */
export async function tokenExistsOnChain(tokenId: number): Promise<boolean> {
  assertConfigured();
  const provider = getProvider();
  const carbonToken = getCarbonTokenContract(provider);
  return carbonToken.tokenExists(tokenId);
}
