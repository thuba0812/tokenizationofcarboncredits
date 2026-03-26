import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, RotateCcw, Tag, Check, ShieldCheck } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useProjects } from '../../hooks/useProjects'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, CARBON_TOKEN_ABI, MARKETPLACE_ABI } from '../../config/contracts'

export default function SellPage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const [search, setSearch] = useState('')
  const [selectedTokens, setSelectedTokens] = useState<Record<string, number>>({})
  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>({})
  const [showConfirmSell, setShowConfirmSell] = useState(false)
  const [showSuccessSell, setShowSuccessSell] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { projects, loading } = useProjects()

  const filtered = projects.filter(p =>
    p.representative.walletAddress.toLowerCase() === wallet.address?.toLowerCase() &&
    (p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()))
  ).map(p => ({
    ...p,
    tableTokens: p.tokens?.filter(t => t.status === 'MINTED') || []
  })).filter(p => p.tableTokens.length > 0)

  const allTokensList = filtered.flatMap(p => p.tableTokens.map(t => ({ 
    projectId: p.id, 
    year: t.year, 
    max: t.available || t.quantity,
    defaultPrice: t.price || p.priceMin || 100
  })));
  
  const isGlobalAllSelected = allTokensList.length > 0 && allTokensList.every(t => (selectedTokens[`${t.projectId}-${t.year}`] || 0) > 0);
  const isGlobalPartiallySelected = !isGlobalAllSelected && allTokensList.some(t => (selectedTokens[`${t.projectId}-${t.year}`] || 0) > 0);

  const handleSelectAllGlobal = (checked: boolean) => {
    if (checked) {
      const newSelections = { ...selectedTokens }
      const newPrices = { ...selectedPrices }
      allTokensList.forEach(t => {
        const key = `${t.projectId}-${t.year}`
        newSelections[key] = t.max
        if (!newPrices[key]) newPrices[key] = t.defaultPrice
      })
      setSelectedTokens(newSelections)
      setSelectedPrices(newPrices)
    } else {
      setSelectedTokens({})
    }
  }

  const handleQuantityChange = (projectId: string, year: number, quantity: number, max: number, defaultPrice: number) => {
    const key = `${projectId}-${year}`
    if (quantity <= 0) {
      const newSelections = { ...selectedTokens }
      delete newSelections[key]
      setSelectedTokens(newSelections)
    } else {
      setSelectedTokens(prev => ({
        ...prev,
        [key]: Math.min(quantity, max)
      }))
      if (!selectedPrices[key]) {
        setSelectedPrices(prev => ({ ...prev, [key]: defaultPrice }))
      }
    }
  }

  const handlePriceChange = (projectId: string, year: number, price: number) => {
    const key = `${projectId}-${year}`
    setSelectedPrices(prev => ({
      ...prev,
      [key]: Math.max(0, price)
    }))
  }

  const handleSelectAllProject = (project: typeof filtered[0], checked: boolean) => {
    const newSelections = { ...selectedTokens }
    const newPrices = { ...selectedPrices }
    if (checked) {
      project.tableTokens.forEach(t => {
        const key = `${project.id}-${t.year}`
        newSelections[key] = t.available || t.quantity
        if (!newPrices[key]) newPrices[key] = t.price || project.priceMin || 100
      })
      setSelectedTokens(newSelections)
      setSelectedPrices(newPrices)
    } else {
      project.tableTokens.forEach(t => {
        delete newSelections[`${project.id}-${t.year}`]
      })
      setSelectedTokens(newSelections)
    }
  }

  const handleTokenCheckbox = (projectId: string, year: number, checked: boolean, max: number, defaultPrice: number) => {
    if (checked) {
      handleQuantityChange(projectId, year, max, max, defaultPrice)
    } else {
      handleQuantityChange(projectId, year, 0, max, defaultPrice)
    }
  }

  const totalTokens = Object.values(selectedTokens).reduce((sum, q) => sum + q, 0)

  const distinctProjectsCount = new Set(Object.keys(selectedTokens).map(k => k.split('-')[0])).size

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative">
      {/* Confirmation Modal */}
      {showConfirmSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mb-10">
                <div className="w-12 h-12 border-2 border-black flex items-center justify-center">
                   <Tag className="w-6 h-6 text-black" />
                </div>
              </div>

              <h2 className="font-heading font-bold text-3xl tracking-tight text-gray-900 mb-2 uppercase">XÁC NHẬN ĐĂNG BÁN</h2>
              <div className="w-32 h-1 bg-green-700 mb-10"></div>

              <p className="font-heading font-bold text-xl text-gray-900 uppercase tracking-tight mb-2 max-w-xs leading-tight">
                BẠN CÓ CHẮC CHẮN MUỐN ĐĂNG BÁN {totalTokens.toLocaleString()} TOKEN KHÔNG?
              </p>
              <p className="text-sm text-gray-500 mb-12">
                Giá niêm yết sẽ được hiển thị công khai trên thị trường.
              </p>

              <div className="flex gap-4 w-full mb-10">
                <button
                  onClick={() => setShowConfirmSell(false)}
                  className="flex-1 py-5 border-2 border-black font-heading font-bold text-base tracking-widest text-black uppercase hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!wallet.address) return;
                    setIsSubmitting(true);
                    try {
                      const itemsToSell = [];
                      for (const [key, quantity] of Object.entries(selectedTokens)) {
                        if (quantity > 0) {
                          const [projectId, yearStr] = key.split('-');
                          const price = selectedPrices[key];
                          
                          const proj = filtered.find(p => p.id === projectId);
                          const token = proj?.tableTokens.find(t => t.year === Number(yearStr));
                          
                          if (token?.vintageId) {
                            itemsToSell.push({
                              vintageId: token.vintageId,
                              quantity,
                              price,
                              txHash: '',
                              onchainListingId: ''
                            });
                          }
                        }
                      }

                      if (itemsToSell.length === 0) {
                         setIsSubmitting(false);
                         return;
                      }

                      // Web3 logic
                      if (!window.ethereum) throw new Error("Vui lòng cài đặt MetaMask!");
                      const provider = new ethers.BrowserProvider(window.ethereum as import('ethers').Eip1193Provider);
                      const signer = await provider.getSigner();

                      const carbonContract = new ethers.Contract(CONTRACT_ADDRESSES.CARBON_TOKEN, CARBON_TOKEN_ABI, signer);
                      const marketContract = new ethers.Contract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signer);

                      // Check approval
                      const isApproved = await carbonContract.isApprovedForAll(wallet.address, CONTRACT_ADDRESSES.MARKETPLACE);
                      if (!isApproved) {
                        const approveTx = await carbonContract.setApprovalForAll(CONTRACT_ADDRESSES.MARKETPLACE, true);
                        await approveTx.wait();
                      }

                      // Call createListing for each item
                      for (const item of itemsToSell) {
                         const tx = await marketContract.createListing(item.vintageId, item.price, item.quantity);
                         const receipt = await tx.wait(); // Wait for confirmation
                         
                         let onchainListingId = null;
                         for (const log of receipt.logs) {
                            try {
                               const parsed = marketContract.interface.parseLog(log);
                               if (parsed && parsed.name === 'ListingCreated') {
                                   onchainListingId = parsed.args.listingId.toString();
                               }
                            } catch (e) {}
                         }
                         
                         item.txHash = receipt.hash;
                         item.onchainListingId = onchainListingId || '';
                      }
                      
                      const { listingRepository } = await import('../../repositories/ListingRepository');
                      const success = await listingRepository.createListings(wallet.address, itemsToSell);
                      
                      if (success) {
                        setShowConfirmSell(false);
                        setShowSuccessSell(true);
                      } else {
                         alert('Có lỗi xảy ra khi lưu lên cơ sở dữ liệu.');
                      }
                    } catch (err) {
                      console.error('Lỗi quá trình bán:', err);
                      alert('Thao tác không thành công.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className={`flex-1 py-5 font-heading font-bold text-base tracking-widest uppercase transition-colors cursor-pointer ${
                    isSubmitting ? 'bg-gray-400 text-white cursor-wait' : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
                </button>
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                THAO TÁC NÀY SẼ GHI NHẬN TRỰC TIẾP VÀO LEDGER
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-green-200 flex items-center justify-center mb-10">
                <div className="w-14 h-14 bg-green-800 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-white stroke-[3px]" />
                </div>
              </div>

              <h2 className="font-heading font-bold text-3xl tracking-tight text-gray-900 mb-2 uppercase">ĐĂNG BÁN THÀNH CÔNG</h2>
              <div className="w-32 h-1 bg-green-700 mb-10"></div>

              <p className="font-heading font-bold text-xl text-gray-900 uppercase tracking-tight mb-12 max-w-xs leading-tight">
                BẠN ĐÃ ĐĂNG BÁN THÀNH CÔNG {totalTokens.toLocaleString()} TOKEN.
              </p>

              <div className="w-full bg-gray-50/50 border-l-4 border-green-700 p-6 mb-12 text-left relative overflow-hidden">
                <div className="flex items-start gap-4 mb-6">
                  <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Giao dịch niêm yết đã được ghi nhận. Tài sản của bạn sẽ xuất hiện trên mục "Thị trường".
                  </p>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">MÃ GIAO DỊCH</div>
                      <div className="font-mono text-xs font-bold text-gray-900">TXN-9941-A2X8-VN</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">THỜI GIAN</div>
                      <div className="font-mono text-xs font-bold text-gray-900 uppercase">
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                   </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessSell(false)
                  setSelectedTokens({})
                  navigate('/seller')
                }}
                className="w-full py-5 bg-black font-heading font-bold text-base tracking-widest text-white uppercase hover:bg-gray-900 transition-colors cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>
            <div className="h-1.5 w-full bg-green-700"></div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller')}
              className="text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold text-base tracking-widest text-gray-900 uppercase">
              HOẠT ĐỘNG BÁN
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {wallet.isConnected && (
              <div className="flex items-center gap-3 border border-gray-200 rounded-md bg-white px-3 py-1.5 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-heading tracking-widest text-gray-600">
                  {wallet.address ? `${wallet.address.slice(0, 6)}...` : '0x742...'}
                </span>
                <span className="text-sm font-heading tracking-widest text-gray-600 border-l border-gray-300 pl-3">
                  {wallet.balance || '1.25'} ETH
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Search & Filter */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-4 py-2.5 bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <button className="px-5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center bg-white shadow-sm">
             <span className="text-xl leading-none">Ξ</span>
          </button>
        </div>

        {/* Global Select All and Column Headers */}
        <div className="bg-white border-b border-gray-100 mb-6 py-2">
            {/* Select all checkbox row */}
            <div className="flex items-center gap-3 mb-6 px-2">
                <input 
                  type="checkbox" 
                  checked={isGlobalAllSelected}
                  ref={input => { if (input) input.indeterminate = isGlobalPartiallySelected }}
                  onChange={e => handleSelectAllGlobal(e.target.checked)}
                  className="w-5 h-5 cursor-pointer accent-green-700 focus:ring-green-500 rounded border-gray-300" 
                />
                <span className="font-heading font-bold text-sm tracking-widest text-gray-700 uppercase">CHỌN TẤT CẢ DỰ ÁN</span>
            </div>

            {/* Column Titles Row - Aligned with token rows */}
            <div className="grid grid-cols-12 gap-4 px-6 items-center">
                <div className="col-span-3">
                    <span className="font-heading font-bold text-base tracking-widest text-black uppercase">TÊN DỰ ÁN</span>
                </div>
                <div className="col-span-1">
                    <span className="font-heading font-bold text-base tracking-widest text-black uppercase">NĂM</span>
                </div>
                <div className="col-span-2 text-center">
                    <span className="font-heading font-bold text-base tracking-widest text-black uppercase">TOKEN HIỆN CÓ</span>
                </div>
                <div className="col-span-3 text-center">
                    <span className="font-heading font-bold text-base tracking-widest text-green-700 uppercase">SL TOKEN BÁN</span>
                </div>
                <div className="col-span-2 text-center">
                    <span className="font-heading font-bold text-base tracking-widest text-green-700 uppercase">GIÁ (USD/TOKEN)</span>
                </div>
                <div className="col-span-1 text-right">
                    <span className="font-heading font-bold text-base tracking-widest text-black uppercase">THAO TÁC</span>
                </div>
            </div>
        </div>

        {/* Project Cards List */}
        <div className="space-y-12">
          {filtered.length > 0 ? (
            filtered.map((project) => {
              const isAllSelected = project.tableTokens.length > 0 && project.tableTokens.every(t => (selectedTokens[`${project.id}-${t.year}`] || 0) > 0);
              const isPartiallySelected = !isAllSelected && project.tableTokens.some(t => (selectedTokens[`${project.id}-${t.year}`] || 0) > 0);

              return (
                <div key={project.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Project Header - Aligned horizontally with columns */}
                  <div className="flex items-center gap-3 mb-5 px-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => { if (input) input.indeterminate = isPartiallySelected }}
                      onChange={e => handleSelectAllProject(project, e.target.checked)}
                      className="w-5 h-5 cursor-pointer accent-green-700 focus:ring-green-500 rounded border-gray-300"
                    />
                    <h3 className="font-heading font-bold text-sm text-gray-900 uppercase tracking-widest">
                      {project.name} ({project.code})
                    </h3>
                  </div>

                  {/* Tokens Card Box */}
                  <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                    {project.tableTokens.map((token, idx) => {
                      const tKey = `${project.id}-${token.year}`;
                      const maxQty = token.available || token.quantity;
                      const selectedQty = selectedTokens[tKey] || 0;
                      const selectedPrice = selectedPrices[tKey] || token.price || project.priceMin || 100;
                      const defaultPrice = token.price || project.priceMin || 100;

                      return (
                        <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50/50 items-center transition-colors border-t border-gray-100 first:border-t-0">
                          {/* Col 1: Project Code + Checkbox (Matched to Col 1-3) */}
                          <div className="col-span-3 flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedQty > 0}
                              onChange={e => handleTokenCheckbox(project.id, token.year, e.target.checked, maxQty, defaultPrice)}
                              className="w-4 h-4 cursor-pointer accent-green-700 focus:ring-green-500"
                            />
                            <div className="font-heading font-bold text-sm text-gray-900 truncate tracking-tight">{project.code}</div>
                          </div>

                          {/* Col 2: Year (Matched to Col 4) */}
                          <div className="col-span-1">
                            <span className="font-heading font-bold text-sm text-green-700">{token.year}</span>
                          </div>

                          {/* Col 3: Existing Qty (Matched to Col 5-6) */}
                          <div className="col-span-2 text-center">
                            <span className="font-heading font-bold text-sm text-gray-900">{maxQty}</span>
                          </div>

                          {/* Col 4: Sell Qty Controls (Matched to Col 7-9) */}
                          <div className="col-span-3 flex justify-center">
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden bg-white shadow-sm w-full max-w-[110px]">
                              <button
                                onClick={() => handleQuantityChange(project.id, token.year, selectedQty - 1, maxQty, defaultPrice)}
                                className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-r border-gray-200 w-1/3"
                              >
                                −
                              </button>
                              <div className="w-1/3 text-center text-sm font-bold text-green-700">
                                {selectedQty}
                              </div>
                              <button
                                onClick={() => handleQuantityChange(project.id, token.year, selectedQty + 1, maxQty, defaultPrice)}
                                className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-l border-gray-200 w-1/3"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Col 5: Price Controls (Matched to Col 10-11) */}
                          <div className="col-span-2 flex flex-col items-center">
                              <div className="flex items-center border border-gray-200 rounded overflow-hidden bg-white shadow-sm w-full max-w-[100px]">
                                <button
                                  onClick={() => handlePriceChange(project.id, token.year, selectedPrice - 1)}
                                  className="px-2 py-1.5 text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-r border-gray-200 w-1/3"
                                >
                                  −
                                </button>
                                <div className="w-1/3 text-center text-sm font-bold text-black group">
                                  {selectedPrice}
                                </div>
                                <button
                                  onClick={() => handlePriceChange(project.id, token.year, selectedPrice + 1)}
                                  className="px-2 py-1.5 text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer font-bold border-l border-gray-200 w-1/3"
                                >
                                  +
                                </button>
                              </div>
                          </div>

                          {/* Col 6: Delete action (Matched to Col 12) */}
                          <div className="col-span-1 text-right flex justify-end">
                             <button 
                               onClick={() => handleQuantityChange(project.id, token.year, 0, maxQty, defaultPrice)}
                               className="text-gray-400 hover:text-green-700 transition-colors cursor-pointer"
                               title="Làm mới"
                             >
                               <RotateCcw className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-gray-400 bg-white border border-gray-200 rounded-md shadow-sm">
              <p className="font-heading font-bold text-sm tracking-widest">KHÔNG TÌM THẤY NỘI DUNG PHÙ HỢP</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer sticky bar */}
      <div className="border-t border-gray-200 bg-white py-6 sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
            <div className="flex items-center gap-10 flex-1">
                {/* Spacer or additional info if needed */}
                <div className="flex-1"></div>
                
                {/* Summary Info */}
                <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col items-end">
                        <span className="font-heading font-bold text-sm tracking-widest text-gray-600 uppercase">TỔNG BÁN</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">({distinctProjectsCount} MÃ TOKEN):</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="font-heading font-bold text-4xl text-green-700 leading-none">{totalTokens}</span>
                            <span className="text-sm font-heading font-bold text-gray-500">Token</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                disabled={totalTokens === 0}
                onClick={() => {
                  setShowConfirmSell(true)
                }}
                className={`px-12 py-4 rounded font-heading font-bold text-base tracking-widest uppercase transition-all shadow-md active:scale-95
                  ${totalTokens > 0 
                  ? 'bg-green-700 hover:bg-green-800 text-white cursor-pointer' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
            >
                XÁC NHẬN BÁN
            </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
