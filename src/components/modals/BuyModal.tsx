import { useState, useEffect } from 'react'
import { Wallet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '../Modal'
import type { Project } from '../../types'
import { useContractTransaction } from '../../hooks/useContractTransaction'
import * as contractService from '../../services/contractService'
import { isContractConfigured } from '../../contracts/contractConfig'
import { useWallet } from '../../contexts/WalletContext'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

export default function BuyModal({ isOpen, onClose, project }: BuyModalProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null)
  const txState = useContractTransaction()
  const { wallet } = useWallet()
  const [buySuccess, setBuySuccess] = useState(false)
  const [buyTxHash, setBuyTxHash] = useState<string | null>(null)

  // Load USDT balance khi modal mở
  useEffect(() => {
    if (isOpen && wallet.isConnected && isContractConfigured()) {
      contractService.getUSDTBalance().then(setUsdtBalance).catch(() => setUsdtBalance(null));
    }
  }, [isOpen, wallet.isConnected]);

  if (!project) return null

  const tokens = project.tokens ?? []

  const handleQtyChange = (year: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0)
    setQuantities(prev => ({ ...prev, [year]: num }))
  }

  const subtotal = tokens.reduce((sum, t) => {
    const qty = quantities[t.year] ?? 0
    return sum + qty * (t.price ?? 0)
  }, 0)

  const networkFee = 0.005

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
                <td className="px-4 py-3 text-sm text-gray-600">{t.available} tCO2e</td>
                <td className="px-4 py-3 font-bold text-gray-900">{t.price?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    max={t.available}
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

      {/* USDT Balance */}
      {usdtBalance !== null && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded px-4 py-2 mb-4">
          <span className="text-xs text-blue-600 font-heading tracking-widest font-bold">SỐ DƯ USDT</span>
          <span className="font-heading font-bold text-sm text-blue-700">{Number(usdtBalance).toFixed(2)} USDT</span>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded px-4 py-3 mb-5">
        <span className="font-heading font-bold text-sm tracking-widest text-green-700">TỔNG CỘNG</span>
        <span className="font-heading font-bold text-xl text-green-700">{subtotal.toFixed(2)} USDT</span>
      </div>

      {/* Transaction status */}
      {txState.status === 'error' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600">{txState.error}</p>
        </div>
      )}

      {/* Buy success */}
      {buySuccess && (
        <div className="flex flex-col items-center bg-green-50 border border-green-200 rounded px-4 py-4 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
          <p className="font-heading font-bold text-sm text-green-700 tracking-widest mb-1">MUA THÀNH CÔNG!</p>
          {buyTxHash && (
            <p className="text-xs text-green-600 font-mono break-all">
              TX: {buyTxHash.slice(0, 14)}...{buyTxHash.slice(-8)}
            </p>
          )}
        </div>
      )}

      {/* Action button */}
      {!buySuccess ? (
        <button
          disabled={subtotal === 0 || txState.isLoading}
          onClick={async () => {
            if (subtotal === 0) return;

            if (isContractConfigured()) {
              // TODO: Cần mapping listing IDs từ DB cho buyByProject
              // Hiện tại flow demo: approve USDT rồi thông báo
              const steps = [
                {
                  label: 'Chấp thuận USDT',
                  run: () => contractService.approveUSDT(subtotal),
                },
              ];

              // Nếu có project code và listing IDs, thêm bước mua
              // steps.push({ label: 'Mua token', run: () => contractService.buyByProject(...) });

              const result = await txState.execute(steps);
              if (result.success) {
                setBuySuccess(true);
                setBuyTxHash(result.txHash);
                // Refresh balance
                contractService.getUSDTBalance().then(setUsdtBalance).catch(() => {});
              }
            } else {
              // Chưa config contract → chỉ alert
              alert('Smart contract chưa được cấu hình. Vui lòng cập nhật địa chỉ contract.');
            }
          }}
          className={`w-full font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 ${
            subtotal > 0 && !txState.isLoading
              ? 'bg-green-700 hover:bg-green-800 text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {txState.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {txState.statusText || 'ĐANG XỬ LÝ...'}
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              XÁC NHẬN THANH TOÁN QUA METAMASK
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => {
            setBuySuccess(false);
            setBuyTxHash(null);
            setQuantities({});
            txState.reset();
            onClose();
          }}
          className="w-full bg-black hover:bg-gray-900 text-white font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 cursor-pointer"
        >
          ĐÓNG
        </button>
      )}
      <p className="text-center text-xs text-gray-400 mt-2">Bảo mật bởi chuẩn mã hóa TECTONIC LEDGER</p>
    </Modal>
  )
}
