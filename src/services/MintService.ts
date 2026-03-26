import { supabase } from '../database/supabase';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES, CARBON_TOKEN_ABI } from '../config/contracts';

// Struct input defined in Solidity
export interface MintItem {
  to: string;
  tokenId: number; // BigInt or number depending on size
  projectId: string;
  serialId: string;
  vintageYear: number;
  amount: number;
  cid: string;
  // Extra fields for logic
  project_vintage_id: number;
}

export class MintService {
  /**
   * Lấy danh sách chứng chỉ đang chờ phát hành (status = 'MINTING')
   */
  static async getPendingMints(): Promise<MintItem[]> {
    // 1. Fetch Project Vintages -> Projects -> Organizations -> Wallets
    const { data, error } = await supabase
      .from('PROJECT_VINTAGES')
      .select(`
        *,
        PROJECTS (
          project_code,
          ORGANIZATIONS (
            WALLETS ( wallet_address )
          )
        )
      `)
      .eq('status', 'MINTING');

    if (error) {
      console.error('Lỗi khi fetch pending mints:', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // 2. Lấy danh sách IPs CID cho các vintage id này
    const vintageIds = data.map(v => v.project_vintage_id);
    const { data: ipfsData } = await supabase
      .from('IPFS_FILES')
      .select('*')
      .in('object_id', vintageIds)
      .eq('file_type', 'TOKEN_METADATA');

    const cidMap = new Map();
    if (ipfsData) {
      ipfsData.forEach(file => {
        cidMap.set(file.object_id, file.cid);
      });
    }

    // 3. Map thành MintItem
    const mintItems: MintItem[] = data.map((v: {
      project_vintage_id: number;
      credit_code: string;
      vintage_year: number;
      issued_creadit_amount: number;
      PROJECTS?: {
        project_code: string;
        ORGANIZATIONS?: {
          WALLETS?: { wallet_address: string }[];
        };
      };
    }) => {
      const project = v.PROJECTS;
      const org = project?.ORGANIZATIONS;
      const wallet = org?.WALLETS?.[0]?.wallet_address || '0x0000000000000000000000000000000000000000';
      
      const cid = cidMap.get(v.project_vintage_id) || 'bafybeig...defaultCID';

      return {
        to: wallet,
        tokenId: v.project_vintage_id, // Lấy luôn vintage_id làm tokenId cho duy nhất
        projectId: project?.project_code || '',
        serialId: v.credit_code || '',
        vintageYear: v.vintage_year,
        amount: Math.floor(Number(v.issued_creadit_amount || 0)),
        cid: cid,
        project_vintage_id: v.project_vintage_id,
      };
    });

    return mintItems;
  }

  /**
   * Gọi hàm Smart Contract để đúc token theo lô
   */
  static async executeMintBatch(items: MintItem[]): Promise<string> {
    if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask!");

    const provider = new BrowserProvider(window.ethereum as import('ethers').Eip1193Provider);
    const signer = await provider.getSigner();

    const contract = new Contract(CONTRACT_ADDRESSES.CARBON_TOKEN, CARBON_TOKEN_ABI, signer);

    // Chuẩn bị payload đúng format struct MintItem[]
    const payload = items.map(item => ({
      to: item.to,
      tokenId: item.tokenId,
      projectId: item.projectId,
      serialId: item.serialId,
      vintageYear: item.vintageYear,
      amount: item.amount,
      cid: item.cid
    }));

    // Gọi contract - mở popup metamask
    const tx = await contract.mintProjectYearBatchSoft(payload);
    
    // Đợi giao dịch đào xong
    const receipt = await tx.wait();
    return receipt.hash || tx.hash;
  }

  /**
   * Cập nhật trạng thái database sau khi phát hành thành công
   */
  static async updateMintsStatus(items: MintItem[], txHash: string) {
    const ids = items.map(i => i.project_vintage_id);
    
    const { error } = await supabase
      .from('PROJECT_VINTAGES')
      .update({
        status: 'MINTED',
        mint_tx_hash: txHash,
        token_id: items[0].tokenId, // Update theo tokenId thực tế
        minted_amount: items[0].amount, // Giả sử cùng update
        minted_at: new Date().toISOString()
      })
      .in('project_vintage_id', ids);

    if (error) {
      console.error('Lỗi khi update database:', error);
      throw error;
    }
  }
}
