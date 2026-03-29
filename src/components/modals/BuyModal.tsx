import { useState, useMemo } from 'react'
import { Wallet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '../Modal'
import type { Project } from '../../types'
import { useContractTransaction } from '../../hooks/useContractTransaction'
import * as contractService from '../../services/contractService'
import { isContractConfigured } from '../../contracts/contractConfig'
import { useWallet } from '../../contexts/WalletContext'
import type { MarketplaceItem } from '../../repositories/ListingRepository'
import { purchaseRepository } from '../../repositories/PurchaseRepository'

interface BuyModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  listings: MarketplaceItem[]
}

export default function BuyModal({ isOpen, onClose, project, listings }: BuyModalProps) {
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const txState = useContractTransaction()
  const { wallet } = useWallet()
  const [buySuccess, setBuySuccess] = useState(false)
  const [buyTxHash, setBuyTxHash] = useState<string | null>(null)

  const handleClose = () => {
    if (buySuccess) {
      window.location.reload();
      return;
    }
    setBuySuccess(false);
    setBuyTxHash(null);
    setQuantities({});
    txState.reset();
    onClose();
  }

  // Sử dụng danh sách listing thực tế truyền từ page cha
  const tokenListings = useMemo(() => listings || [], [listings])

  if (!project) return null

  const handleQtyChange = (listingId: number, val: string) => {
    // Chỉ cho phép nhập số (loại bỏ toàn bộ ký tự không phải số)
    const cleanVal = val.replace(/\D/g, '')
    if (val !== '' && cleanVal !== val) return; // Nếu có ký tự lạ thì bỏ qua không nhận
    
    setQuantities(prev => ({ ...prev, [listingId]: cleanVal }))
  }

  const isAnyInvalid = tokenListings.some(t => {
    const qtyRaw = quantities[t.listingId] || ''
    const qty = qtyRaw === '' ? 0 : parseInt(qtyRaw, 10)
    return qty > t.available
  })

  const subtotal = tokenListings.reduce((sum, t) => {
    const qtyRaw = quantities[t.listingId] || ''
    const qty = qtyRaw === '' ? 0 : parseInt(qtyRaw, 10)
    return sum + qty * (t.pricePerToken ?? 0)
  }, 0)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="XÁC NHẬN MUA TOKEN" maxWidth="max-w-2xl">
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
            {tokenListings.map(t => {
              const qtyRaw = quantities[t.listingId] || ''
              const qtyNum = qtyRaw === '' ? 0 : parseInt(qtyRaw, 10)
              const isInvalid = qtyNum > t.available
              return (
                <tr key={t.listingId} className={`border-b border-gray-50 last:border-0 ${isInvalid ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-bold text-gray-900">{t.vintageYear}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.available} token</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{t.pricePerToken?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        value={qtyRaw}
                        onChange={e => handleQtyChange(t.listingId, e.target.value)}
                        className={`w-24 rounded text-center text-sm font-bold py-1.5 transition-all duration-200 focus:outline-none focus:ring-2 ${
                          isInvalid 
                            ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-200' 
                            : 'border-gray-200 bg-green-50 text-gray-900 focus:ring-green-100'
                        }`}
                      />
                      {isInvalid && (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter animate-pulse">
                          Vượt quá giới hạn!
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t border-dashed border-gray-200 pt-3 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính</span>
          <span className="font-medium">{subtotal.toFixed(2)} USDT</span>
        </div>
      </div>


      {/* Total */}
      <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded px-4 py-3 mb-5">
        <span className="font-heading font-bold text-sm tracking-widest text-green-700">TỔNG CỘNG</span>
        <span className="font-heading font-bold text-xl text-green-700">{subtotal.toFixed(2)} USDT</span>
      </div>

      {/* General Error Message */}
      {isAnyInvalid && (
        <div className="flex items-center gap-2 bg-red-100 border border-red-200 rounded px-4 py-2.5 mb-4 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Vui lòng điều chỉnh số lượng hợp lệ (tối đa tồn kho)
          </span>
        </div>
      )}

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
          disabled={subtotal === 0 || txState.isLoading || isAnyInvalid}
          onClick={async () => {
            console.log('[BuyModal] onClick triggered. subtotal:', subtotal, 'isAnyInvalid:', isAnyInvalid);
            if (subtotal === 0 || isAnyInvalid) return;

            if (isContractConfigured()) {
              const buyItems = tokenListings
                .filter(t => {
                  const q = quantities[t.listingId] || ''
                  return q !== '' && parseInt(q, 10) > 0
                })
                .map(t => ({
                  listingId: t.listingId,
                  onchainListingId: t.onchainListingId,
                  amount: parseInt(quantities[t.listingId], 10),
                  price: t.pricePerToken,
                  vintageId: t.vintageId
                }));

              console.log('[BuyModal] buyItems prepared:', buyItems);

              if (buyItems.length === 0) {
                console.log('[BuyModal] buyItems is empty, returning.');
                return;
              }

              let needsMint = false;
              try {
                const balanceStr = await contractService.getUSDTBalance();
                const balance = parseFloat(balanceStr);
                
                console.log('[BuyModal] Current USDT balance:', balance, 'Required:', subtotal);
                if (balance < subtotal) {
                  const wantToMint = window.confirm(
                    `Số dư USDT của bạn không đủ!\nHiện tại: ${balance} USDT\nCần: ${subtotal} USDT\n\nBạn có muốn nhận miễn phí 10,000 Mock USDT (Testnet) để tiếp tục không?`
                  );
                  if (!wantToMint) return;
                  needsMint = true;
                }
              } catch (err) {
                console.error('[BuyModal] Error checking USDT balance:', err);
              }

              const steps = [];
              
              if (needsMint) {
                steps.push({
                  label: 'Nhận 10,000 Mock USDT',
                  run: () => {
                    console.log('[BuyModal] Step 0: Nhận Mock USDT');
                    return contractService.mintMockUSDT(10000);
                  }
                });
              }

              try {
                const allowanceStr = await contractService.getUSDTAllowance();
                const allowance = parseFloat(allowanceStr);
                console.log('[BuyModal] Current USDT allowance:', allowance, 'Required:', subtotal);
                
                // B2B Security: Always require explicit approval if current allowance is insufficient
                if (allowance < subtotal || needsMint) {
                  steps.push({
                    label: 'Chấp thuận giao dịch USDT', 
                    run: () => {
                      console.log(`[BuyModal] Step 1: Chấp thuận USDT (Exact Amount: ${subtotal})`);
                      const res = contractService.approveUSDT(subtotal);
                      console.log('[BuyModal] Step 1 result:', res);
                      return res;
                    },
                  });
                }
              } catch (err) {
                console.error('[BuyModal] Error checking USDT allowance:', err);
              }

              steps.push({
                label: 'Mua Carbon Credit',
                run: () => {
                  console.log('[BuyModal] Step 2: Mua Carbon Credit', { 
                    projectCode: project.code, 
                    onchainListingIds: buyItems.map(i => i.onchainListingId), 
                    amounts: buyItems.map(i => i.amount) 
                  });
                  const res = contractService.buyByProject(
                    project.code,
                    buyItems.map(i => i.onchainListingId),
                    buyItems.map(i => i.amount)
                  );
                  console.log('[BuyModal] Step 2 result:', res);
                  return res;
                }
              });

              try {
                console.log('[BuyModal] Executing txState with steps...', steps);
                const result = await txState.execute(steps);
                console.log('[BuyModal] txState.execute completed, result:', result);

                if (result.success) {
                  console.log('[BuyModal] Transaction success! Recording to DB...');
                  // Record to DB
                  await purchaseRepository.recordPurchase(
                    wallet.address || '',
                    project.code,
                    buyItems,
                    result.txHash || ''
                  );
                  console.log('[BuyModal] DB recording successful.');

                  setBuySuccess(true);
                  setBuyTxHash(result.txHash);

                } else {
                  console.log('[BuyModal] Transaction did not succeed:', result);
                }
              } catch (error) {
                console.error('[BuyModal] Exception during tx execution or db recording:', error);
              }
            } else {
              console.warn('[BuyModal] Contract is not configured.');
              // Chưa config contract → chỉ alert
              alert('Smart contract chưa được cấu hình. Vui lòng cập nhật địa chỉ contract.');
            }
          }}
          className={`w-full font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 ${subtotal > 0 && !txState.isLoading && !isAnyInvalid
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
          onClick={handleClose}
          className="w-full bg-black hover:bg-gray-900 text-white font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 cursor-pointer"
        >
          ĐÓNG
        </button>
      )}
      <p className="text-center text-xs text-gray-400 mt-2">Bảo mật bởi chuẩn mã hóa TECTONIC LEDGER</p>
    </Modal>
  )
}

