/**
 * Contract Service Layer
 * 
 * Service tương tác với 3 smart contracts thông qua ethers.js v6:
 * - CarbonToken (ERC1155): mint, burn, query
 * - MockUSDT (ERC20): approve, balance
 * - CarbonMarketplace: list, buy, cancel
 */

import { BrowserProvider, Contract, formatUnits, Interface, JsonRpcProvider, parseUnits } from 'ethers';
import type { ContractRunner } from 'ethers';
import type { EthereumProvider } from '../types/ethereum';
import { CarbonTokenABI } from '../contracts/CarbonTokenABI';
import { MockUSDTABI } from '../contracts/MockUSDTABI';
import { CarbonMarketplaceABI } from '../contracts/CarbonMarketplaceABI';
import {
  CARBON_TOKEN_ADDRESS,
  MOCK_USDT_ADDRESS,
  MARKETPLACE_ADDRESS,
  USDT_DECIMALS,
  RPC_URL,
  isContractConfigured,
} from '../contracts/contractConfig';

// ─── Helpers ────────────────────────────────────────────

function getEthereum(): EthereumProvider {
  const eth = window.ethereum;
  if (!eth) throw new Error('MetaMask chưa được cài đặt');
  return eth;
}

function getProvider(): BrowserProvider {
  return new BrowserProvider(getEthereum());
}

async function getSigner() {
  return getProvider().getSigner();
}

function getReadProvider(): JsonRpcProvider | BrowserProvider {
  const eth = window.ethereum;
  if (eth) return new BrowserProvider(eth);
  return new JsonRpcProvider(RPC_URL);
}

function getCarbonTokenContract(runner: ContractRunner) {
  return new Contract(CARBON_TOKEN_ADDRESS, CarbonTokenABI, runner);
}

function getMockUSDTContract(runner: ContractRunner) {
  return new Contract(MOCK_USDT_ADDRESS, MockUSDTABI, runner);
}

function getMarketplaceContract(runner: ContractRunner) {
  return new Contract(MARKETPLACE_ADDRESS, CarbonMarketplaceABI, runner);
}

async function assertSellerHasEnoughTokenBalance(
  signer: ContractRunner & { getAddress: () => Promise<string> },
  items: { tokenId: number; amount: number }[]
) {
  const seller = await signer.getAddress();
  const carbonToken = getCarbonTokenContract(signer);

  console.group('[contractService] Pre-check seller balances for listing');
  for (const item of items) {
    const onChainBalance = await carbonToken.balanceOf(seller, item.tokenId);
    const required = BigInt(item.amount);
    console.log(
      `tokenId=${item.tokenId} seller=${seller} balance=${onChainBalance.toString()} required=${required.toString()}`
    );
    if (onChainBalance < required) {
      console.groupEnd();
      throw new Error(
        `Không đủ số dư on-chain để đăng bán. tokenId=${item.tokenId}, ví=${seller}, current=${onChainBalance.toString()}, required=${required.toString()}`
      );
    }
  }
  console.groupEnd();
}

function parseMarketplaceReceipt(receipt: { logs: ReadonlyArray<{ topics: ReadonlyArray<string>; data: string }> }) {
  const iface = new Interface(CarbonMarketplaceABI);
  const createdListingIds: number[] = [];
  const updatedListingIds: number[] = [];
  const cancelledListingIds: number[] = [];

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      if (parsed.name === 'ListingCreated') {
        createdListingIds.push(Number(parsed.args.listingId));
      }

      if (parsed.name === 'ListingUpdated') {
        updatedListingIds.push(Number(parsed.args.listingId));
      }

      if (parsed.name === 'ListingCancelled') {
        cancelledListingIds.push(Number(parsed.args.listingId));
      }
    } catch {
      // Ignore logs from other contracts.
    }
  }

  return {
    createdListingIds,
    updatedListingIds,
    cancelledListingIds,
  };
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
): Promise<{ txHash: string; listingIds: number[] }> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);
  await assertSellerHasEnoughTokenBalance(
    signer,
    items.map((i) => ({ tokenId: i.tokenId, amount: i.amount }))
  );

  const tokenIds = items.map((i) => i.tokenId);
  const prices = items.map((i) => parseUnits(i.pricePerUnit.toString(), USDT_DECIMALS));
  const amounts = items.map((i) => i.amount);

  const tx = await marketplace.createListingsBatch(tokenIds, prices, amounts);
  const receipt = await tx.wait();
  const { createdListingIds } = parseMarketplaceReceipt(receipt);

  return {
    txHash: receipt.hash,
    listingIds: createdListingIds,
  };
}

/** @deprecated Use createListingsBatch() – returns same shape now */
export const createListingsBatchDetailed = createListingsBatch;

export async function getCarbonTokenBalance(tokenId: number, walletAddress?: string): Promise<number> {
  assertConfigured();
  const provider = getReadProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const targetWallet = walletAddress || await (await getSigner()).getAddress();
  const balance = await carbonToken.balanceOf(targetWallet, tokenId);
  return Number(balance);
}

export async function updateListingDetailed(
  listingId: number,
  newPrice: number,
  newAmount: number
): Promise<{ txHash: string; listingId: number }> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  const tx = await marketplace.updateListing(listingId, parseUnits(newPrice.toString(), USDT_DECIMALS), newAmount);
  const receipt = await tx.wait();
  const { updatedListingIds } = parseMarketplaceReceipt(receipt);

  return {
    txHash: receipt.hash,
    listingId: updatedListingIds[0] ?? listingId,
  };
}

/**
 * Hủy listing – trả về txHash + listingId đã hủy
 */
export async function cancelListing(listingId: number): Promise<{ txHash: string; listingId: number }> {
  assertConfigured();
  const signer = await getSigner();
  const marketplace = getMarketplaceContract(signer);

  const tx = await marketplace.cancelListing(listingId);
  const receipt = await tx.wait();
  const { cancelledListingIds } = parseMarketplaceReceipt(receipt);

  return {
    txHash: receipt.hash,
    listingId: cancelledListingIds[0] ?? listingId,
  };
}

/** @deprecated Use cancelListing() – returns same shape now */
export const cancelListingDetailed = cancelListing;

// ═══════════════════════════════════════════════════════
//  BUYER - Mua token từ Marketplace
// ═══════════════════════════════════════════════════════

/**
 * Uớc tính phí gas (Network fee) khi mua token
 */
export async function estimateBuyGas(itemCount: number): Promise<string> {
  if (itemCount === 0) return '0.0000';
  try {
    assertConfigured();
    const provider = getReadProvider();
    const feeData = await provider.getFeeData();
    // Use maxFeePerGas if available (EIP-1559), else gasPrice
    const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 2000000000n; // fallback 2 gwei
    
    // Base transaction gas ~150k + ~50k per item
    const estimatedGasLimit = 150000n + (50000n * BigInt(itemCount));
    const estimatedCost = estimatedGasLimit * gasPrice;
    
    // Format to ETH with 4 decimals max for UI
    const ethValue = parseFloat(formatUnits(estimatedCost, 18));
    return ethValue.toFixed(5);
  } catch (error) {
    console.warn('Cannot estimate gas:', error);
    return '0.0050'; // Safe fallback
  }
}

/**
 * Mint Mock USDT (chỉ dùng cho testnet)
 * @param amount - Số USDT muốn mint (đã format, ví dụ 1000)
 */
export async function mintMockUSDT(amount: number): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const address = await signer.getAddress();
  const usdt = getMockUSDTContract(signer);
  const amountInSmallestUnit = parseUnits(amount.toString(), USDT_DECIMALS);
  const tx = await usdt.mint(address, amountInSmallestUnit);
  const receipt = await tx.wait();
  return receipt.hash;
}

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
 * Buyer approve USDT cho Marketplace (Exact Amount - B2B Security Standard)
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
  amounts: number[]
): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const carbonToken = getCarbonTokenContract(signer);

  const tx = await carbonToken.burnCarbonBatch(tokenIds, amounts);
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
  const provider = getReadProvider();
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
  const provider = getReadProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const balance = await carbonToken.balanceOf(address, tokenId);
  return Number(balance);
}

/**
 * Lấy thông tin listing từ marketplace contract
 */
export async function getListingOnChain(listingId: number) {
  assertConfigured();
  const provider = getReadProvider();
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
  const provider = getReadProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const burned = await carbonToken.totalEnterpriseBurned(address);
  return Number(burned);
}

/**
 * Lấy hạn ngạch của enterprise từ chain
 */
export async function getEnterpriseQuota(address: string): Promise<number> {
  assertConfigured();
  const provider = getProvider();
  const carbonToken = getCarbonTokenContract(provider);
  const quota = await carbonToken.enterpriseQuotas(address);
  return Number(quota);
}

/**
 * Admin thiết lập hạn ngạch cho enterprise trên chain
 */
export async function setEnterpriseQuota(address: string, quota: number): Promise<string> {
  assertConfigured();
  const signer = await getSigner();
  const carbonToken = getCarbonTokenContract(signer);
  const tx = await carbonToken.setEnterpriseQuota(address, quota);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Kiểm tra token có tồn tại trên chain không
 */
export async function tokenExistsOnChain(tokenId: number): Promise<boolean> {
  assertConfigured();
  const provider = getReadProvider();
  const carbonToken = getCarbonTokenContract(provider);
  return carbonToken.tokenExists(tokenId);
}
