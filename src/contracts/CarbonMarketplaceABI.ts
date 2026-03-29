/**
 * ABI cho contract CarbonMarketplace
 * Source: contracts/market.sol
 */
export const CarbonMarketplaceABI = [
  // ─── Constants ────────────────────────────────────────
  {
    inputs: [],
    name: 'FIXED_FEE_BPS',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_PURCHASE_LINES',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextListingId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'carbonToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdt',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'feeRecipient',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ─── Seller Functions ─────────────────────────────────
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'uint256', name: 'sellAmount', type: 'uint256' },
    ],
    name: 'createListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256[]', name: 'tokenIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'prices', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'sellAmounts', type: 'uint256[]' },
    ],
    name: 'createListingsBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'listingId', type: 'uint256' },
      { internalType: 'uint256', name: 'newPrice', type: 'uint256' },
      { internalType: 'uint256', name: 'newAmount', type: 'uint256' },
    ],
    name: 'updateListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'listingId', type: 'uint256' }],
    name: 'cancelListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── Buyer Functions ──────────────────────────────────
  {
    inputs: [
      { internalType: 'string', name: 'projectId', type: 'string' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
    ],
    name: 'buyByProject',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── Admin Functions ──────────────────────────────────
  {
    inputs: [{ internalType: 'address', name: '_new', type: 'address' }],
    name: 'updateFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── View Functions ───────────────────────────────────
  {
    inputs: [{ internalType: 'uint256', name: 'listingId', type: 'uint256' }],
    name: 'getListing',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'listingId', type: 'uint256' },
          { internalType: 'address', name: 'seller', type: 'address' },
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'string', name: 'projectId', type: 'string' },
          { internalType: 'uint16', name: 'vintageYear', type: 'uint16' },
          { internalType: 'uint256', name: 'pricePerUnit', type: 'uint256' },
          { internalType: 'uint256', name: 'availableAmount', type: 'uint256' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct CarbonMarketplace.Listing',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { internalType: 'uint256', name: 'listingId', type: 'uint256' },
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'string', name: 'projectId', type: 'string' },
      { internalType: 'uint16', name: 'vintageYear', type: 'uint16' },
      { internalType: 'uint256', name: 'pricePerUnit', type: 'uint256' },
      { internalType: 'uint256', name: 'availableAmount', type: 'uint256' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // ─── Events ───────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'listingId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'pricePerUnit', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'availableAmount', type: 'uint256' },
    ],
    name: 'ListingCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'listingId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'newPricePerUnit', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newAvailableAmount', type: 'uint256' },
    ],
    name: 'ListingUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'listingId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'seller', type: 'address' },
    ],
    name: 'ListingCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'buyer', type: 'address' },
      { indexed: true, internalType: 'bytes32', name: 'projectHash', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'totalLines', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalCost', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalFee', type: 'uint256' },
    ],
    name: 'TokenPurchasedByProject',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'newFeeRecipient', type: 'address' },
    ],
    name: 'FeeRecipientUpdated',
    type: 'event',
  },
] as const;
