/**
 * ABI cho contract CarbonToken (ERC1155)
 * Source: contracts/token.sol
 */
export const CarbonTokenABI = [
  // ─── Mint ─────────────────────────────────────────────
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'string', name: 'projectId', type: 'string' },
          { internalType: 'string', name: 'serialId', type: 'string' },
          { internalType: 'uint16', name: 'vintageYear', type: 'uint16' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'string', name: 'cid', type: 'string' },
        ],
        internalType: 'struct CarbonToken.MintItem[]',
        name: 'items',
        type: 'tuple[]',
      },
    ],
    name: 'mintProjectYearBatchSoft',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── Burn ─────────────────────────────────────────────
  {
    inputs: [
      { internalType: 'uint256[]', name: 'tokenIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
    ],
    name: 'burnCarbonBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'enterprise', type: 'address' }],
    name: 'enterpriseQuotas',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'enterprise', type: 'address' },
      { internalType: 'uint256', name: 'quota', type: 'uint256' },
    ],
    name: 'setEnterpriseQuota',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── View Functions ───────────────────────────────────
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenExists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTokenInfo',
    outputs: [
      { internalType: 'string', name: 'projectId', type: 'string' },
      { internalType: 'string', name: 'serialId', type: 'string' },
      { internalType: 'uint16', name: 'vintageYear', type: 'uint16' },
      { internalType: 'string', name: 'cid', type: 'string' },
      { internalType: 'uint256', name: 'totalMinted', type: 'uint256' },
      { internalType: 'uint256', name: 'currentSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBurned', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getProjectId',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getVintageYear',
    outputs: [{ internalType: 'uint16', name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTotalMinted',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getCurrentSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getTotalBurned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'totalEnterpriseBurned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ─── ERC1155 Standard ─────────────────────────────────
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ─── Events ───────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'projectId', type: 'string' },
      { indexed: false, internalType: 'string', name: 'serialId', type: 'string' },
      { indexed: false, internalType: 'uint16', name: 'vintageYear', type: 'uint16' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'cid', type: 'string' },
    ],
    name: 'CarbonMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'enterprise', type: 'address' },
      { indexed: false, internalType: 'uint256[]', name: 'tokenIds', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256', name: 'totalBurnedNow', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'quotaRemaining', type: 'uint256' },
    ],
    name: 'CarbonBurnedBatch',
    type: 'event',
  },
] as const;
