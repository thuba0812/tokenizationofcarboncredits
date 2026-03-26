import { useState } from 'react'
import { Wallet } from 'lucide-react'
import Modal from '../Modal'
import type { Project } from '../../types'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, MOCK_USDT_ABI, MARKETPLACE_ABI } from '../../config/contracts'
import { useWallet } from '../../contexts/WalletContext'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

export default function BuyModal({ isOpen, onClose, project }: BuyModalProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [isBuying, setIsBuying] = useState(false)
  const { wallet } = useWallet()

  if (!project) return null

  // Only tokens that have something listed on the market
  const tokens = (project.tokens ?? []).filter(t => (t.marketAvailable ?? 0) > 0)

  const handleQtyChange = (year: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0)
    setQuantities(prev => ({ ...prev, [year]: num }))
  }

  const subtotal = tokens.reduce((sum, t) => {
    const qty = quantities[t.year] ?? 0
    return sum + qty * (t.price ?? 0)
  }, 0)

  const networkFee = 0.005

  const handleConfirmBuy = async () => {
    if (!wallet.address) {
      alert('Vui lòng kết nối ví để mua!');
      return;
    }
    const buyItems = tokens.filter(t => (quantities[t.year] ?? 0) > 0);
    if (buyItems.length === 0) return;

    try {
      setIsBuying(true);
      if (!window.ethereum) throw new Error("Vui lòng cài MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum as import('ethers').Eip1193Provider);
      const signer = await provider.getSigner();

      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.MOCK_USDT, MOCK_USDT_ABI, signer);
      const marketContract = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signer);

      const totalCostRaw = ethers.parseUnits(subtotal.toString(), 6); // MockUSDT has 6 decimals?

      // 1. Approve USDT
      // Thường thì chỉ approve số lượng mình cần mua
      const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.MARKETPLACE, totalCostRaw);
      await approveTx.wait();

      // 2. Buy on marketplace using the new batched method
      const listingIds = buyItems.map(item => {
        if (!item.onchainListingId) throw new Error("Lỗi: Không tìm thấy listing ID gốc của Blockchain");
        return item.onchainListingId;
      });
      const amounts = buyItems.map(item => quantities[item.year]);

      const tx = await marketContract.buyByProject(project.id, listingIds, amounts);
      const receipt = await tx.wait();
        
      // 3. Update Supabase
      const projectIdNum = parseInt(project.id);
      const { listingRepository } = await import('../../repositories/ListingRepository');
      
      for (let i = 0; i < buyItems.length; i++) {
        const item = buyItems[i];
        const qtyToBuy = amounts[i];
        
        await listingRepository.recordPurchase(
           wallet.address,
           projectIdNum,
           item.listingId!,
           qtyToBuy,
           item.price!,
           receipt.hash // Using the grouped batch transaction hash
        );
      }

      alert("Mua thành công!");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi giao dịch');
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="XÁC NHẬN MUA TOKEN" maxWidth="max-w-2xl">
      {/* Project name */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 font-heading tracking-widest font-bold mb-1">TÊN DỰ ÁN</div>
        <div className="font-semibold text-gray-900">
          {project.name} <span className="text-gray-400 font-normal text-sm">({project.code})</span>
        </div>
      </div>

      {/* Price table */}
      <div className="border border-gray-200 rounded overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <span className="font-heading text-xs font-bold tracking-widest text-gray-500">BẢNG GIÁ NIÊM YẾT</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-heading font-bold text-gray-400 tracking-widest px-4 py-2.5">NĂM</th>
              <th className="text-left text-xs font-heading font-bold text-gray-400 tracking-widest px-4 py-2.5">CÒN LẠI</th>
              <th className="text-left text-xs font-heading font-bold text-gray-400 tracking-widest px-4 py-2.5">GIÁ (USDT)</th>
              <th className="text-right text-xs font-heading font-bold text-gray-400 tracking-widest px-4 py-2.5">SỐ LƯỢNG</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.year} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-bold text-gray-900">{t.year}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.marketAvailable} tCO2e</td>
                <td className="px-4 py-3 font-bold text-gray-900">{t.price?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    max={t.marketAvailable}
                    value={quantities[t.year] ?? 0}
                    onChange={e => handleQtyChange(t.year, e.target.value)}
                    className="w-20 border border-gray-200 rounded bg-green-50 text-center text-sm font-medium text-gray-900 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính</span>
          <span className="font-medium">{subtotal.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Phí giao dịch (Network)</span>
          <span className="font-medium">{networkFee} ETH</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded px-4 py-3 mb-5">
        <span className="font-heading font-bold text-sm tracking-widest text-green-700">TỔNG CỘNG</span>
        <span className="font-heading font-bold text-xl text-green-700">{subtotal.toFixed(2)} USDT</span>
      </div>

      {/* Action button */}
      <button 
        onClick={handleConfirmBuy}
        disabled={isBuying || subtotal === 0}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 cursor-pointer"
      >
        <Wallet className="w-4 h-4" />
        {isBuying ? "ĐANG XỬ LÝ GIAO DỊCH..." : "XÁC NHẬN THANH TOÁN QUA METAMASK"}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">Bảo mật bởi chuẩn mã hóa TECTONIC LEDGER</p>
    </Modal>
  )
}
