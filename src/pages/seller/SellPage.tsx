import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, RotateCcw, Search, ShieldCheck, Tag } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useContractTransaction } from '../../hooks/useContractTransaction'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'
import * as contractService from '../../services/contractService'
import { isContractConfigured } from '../../contracts/contractConfig'

interface SellRow {
  projectId: string
  projectName: string
  projectCode: string
  vintageId: number
  year: number
  tokenId: number
  quantity: number
  listedAmount: number
  price: number | null
}

type RowErrors = {
  quantity?: string
  price?: string
}

export default function SellPage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { walletId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { credits, loading } = usePortfolio(walletId ?? 0)
  const [search, setSearch] = useState('')
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({})
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>({})
  const [showConfirmSell, setShowConfirmSell] = useState(false)
  const [showSuccessSell, setShowSuccessSell] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sellTxHash, setSellTxHash] = useState<string | null>(null)
  const txState = useContractTransaction()
  const submitLockRef = useRef(false)

  const rows = useMemo<SellRow[]>(
    () =>
      credits.flatMap((credit) =>
        (credit.project.tokens || [])
          .filter((token) => token.status === 'MINTED' && token.tokenId && token.vintageId)
          .map((token) => ({
            projectId: credit.project.id,
            projectName: credit.project.name,
            projectCode: credit.project.code,
            vintageId: token.vintageId as number,
            year: token.year,
            tokenId: token.tokenId as number,
            quantity: token.quantity,
            listedAmount: token.listedAmount || 0,
            price: token.price ?? null,
          }))
      ),
    [credits]
  )

  const filtered = rows.filter(
    (row) =>
      row.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      row.projectName.toLowerCase().includes(search.toLowerCase()) ||
      String(row.tokenId).includes(search)
  )

  const getQuantityInput = (row: SellRow) =>
    quantityInputs[row.tokenId] ?? (row.listedAmount > 0 ? String(row.listedAmount) : '')

  const getPriceInput = (row: SellRow) =>
    priceInputs[row.tokenId] ?? (typeof row.price === 'number' && row.price > 0 ? String(row.price) : '')

  const parseWholeNumber = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return { value: 0, invalid: false, empty: true }
    if (!/^-?\d+$/.test(trimmed)) return { value: 0, invalid: true, empty: false }
    return { value: Number(trimmed), invalid: false, empty: false }
  }

  const parseDecimal = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return { value: 0, invalid: false, empty: true }
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return { value: 0, invalid: true, empty: false }
    return { value: Number(trimmed), invalid: false, empty: false }
  }

  const rowErrors = useMemo<Record<number, RowErrors>>(() => {
    const next: Record<number, RowErrors> = {}

    for (const row of filtered) {
      const quantityParsed = parseWholeNumber(getQuantityInput(row))
      const priceParsed = parseDecimal(getPriceInput(row))
      const errors: RowErrors = {}
      const maxSellable = row.quantity + row.listedAmount

      if (quantityParsed.invalid) {
        errors.quantity = 'Vui lòng nhập số nguyên hợp lệ.'
      } else if (quantityParsed.value < 0) {
        errors.quantity = 'Số lượng bán không được nhỏ hơn 0.'
      } else if (quantityParsed.value > maxSellable) {
        errors.quantity = `Số lượng bán không được vượt quá ${maxSellable}.`
      }

      if (quantityParsed.value > 0) {
        if (priceParsed.invalid) {
          errors.price = 'Vui lòng nhập số hợp lệ.'
        } else if (priceParsed.value <= 0) {
          errors.price = 'Giá phải lớn hơn 0.'
        }
      }

      if (errors.quantity || errors.price) {
        next[row.tokenId] = errors
      }
    }

    return next
  }, [filtered, priceInputs, quantityInputs])

  const selectedRows = filtered.filter((row) => {
    const parsed = parseWholeNumber(getQuantityInput(row))
    return !parsed.invalid && parsed.value > 0
  })

  const hasValidationError = selectedRows.some((row) => rowErrors[row.tokenId]) || Object.keys(rowErrors).length > 0
  const totalTokens = selectedRows.reduce((sum, row) => sum + parseWholeNumber(getQuantityInput(row)).value, 0)
  const canSubmit = totalTokens > 0 && !hasValidationError && !isSubmitting && !txState.isLoading

  const handleQuantityChange = (tokenId: number, rawValue: string) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [tokenId]: rawValue,
    }))
  }

  const handlePriceChange = (tokenId: number, rawValue: string) => {
    setPriceInputs((prev) => ({
      ...prev,
      [tokenId]: rawValue,
    }))
  }

  const handleReset = (row: SellRow) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [row.tokenId]: row.listedAmount > 0 ? String(row.listedAmount) : '',
    }))
    setPriceInputs((prev) => ({
      ...prev,
      [row.tokenId]: typeof row.price === 'number' && row.price > 0 ? String(row.price) : '',
    }))
  }

  const submitListings = async () => {
    if (!wallet.address || !canSubmit || submitLockRef.current) return

    submitLockRef.current = true
    setIsSubmitting(true)
    try {
      const itemsToSell = selectedRows.map((row) => ({
        vintageId: row.vintageId,
        quantity: parseWholeNumber(getQuantityInput(row)).value,
        price: parseDecimal(getPriceInput(row)).value,
      }))

      const onChainItems = selectedRows.map((row) => ({
        tokenId: row.tokenId,
        pricePerUnit: parseDecimal(getPriceInput(row)).value,
        amount: parseWholeNumber(getQuantityInput(row)).value,
      }))

      let txHash: string | null = null

      if (isContractConfigured()) {
        const steps = []
        const isApproved = false // Luôn approve trước để không bị trình duyệt chặn MetaMask popup
        if (!isApproved) {
          steps.push({
            label: 'Cấp quyền cho Marketplace',
            run: () => contractService.approveMarketplace(),
          })
        }

        steps.push({
          label: 'Đăng bán token trên blockchain',
          run: () => contractService.createListingsBatch(onChainItems),
        })

        const result = await txState.execute(steps)
        if (!result.success) {
          // Giữ nguyên error state để hiển thị trong modal, KHÔNG reset
          setIsSubmitting(false)
          submitLockRef.current = false
          return
        }
        txHash = result.txHash
      }

      const { listingRepository } = await import('../../repositories/ListingRepository')
      const success = await listingRepository.createListings(wallet.address, itemsToSell, txHash || undefined)

      if (!success) {
        alert('Có lỗi xảy ra khi lưu lên cơ sở dữ liệu.')
        return
      }

      setSellTxHash(txHash)
      setShowConfirmSell(false)
      setShowSuccessSell(true)
    } catch (error) {
      console.error('Lỗi quá trình bán:', error)
      alert('Thao tác không thành công.')
    } finally {
      setIsSubmitting(false)
      submitLockRef.current = false
    }
  }

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {showConfirmSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-center backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex flex-col items-center p-10">
              <div className="mb-10 flex h-24 w-24 items-center justify-center bg-gray-100">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-black">
                  <Tag className="h-6 w-6 text-black" />
                </div>
              </div>

              <h2 className="mb-2 font-heading text-3xl font-bold uppercase tracking-tight text-gray-900">
                XÁC NHẬN ĐĂNG BÁN
              </h2>
              <div className="mb-10 h-1 w-32 bg-green-700" />

              <p className="mb-2 max-w-xs font-heading text-xl font-bold uppercase leading-tight text-gray-900">
                BẠN CÓ CHẮC CHẮN MUỐN ĐĂNG BÁN {totalTokens.toLocaleString()} TOKEN KHÔNG?
              </p>
              <p className="mb-12 text-sm text-gray-500">Giá niêm yết sẽ được hiển thị công khai trên thị trường.</p>

              <div className="mb-10 flex w-full gap-4">
                <button
                  onClick={() => {
                    if (isSubmitting || txState.isLoading) return
                    setShowConfirmSell(false)
                    submitLockRef.current = false
                    txState.reset()
                  }}
                  className="flex-1 cursor-pointer border-2 border-black py-5 font-heading text-base font-bold uppercase tracking-widest text-black transition-colors hover:bg-gray-50"
                >
                  HỦY
                </button>
                <button
                  disabled={!canSubmit}
                  onClick={() => void submitListings()}
                  className={`flex-1 py-5 font-heading text-base font-bold uppercase tracking-widest transition-colors ${
                    canSubmit ? 'cursor-pointer bg-black text-white hover:bg-gray-900' : 'cursor-not-allowed bg-gray-300 text-white'
                  }`}
                >
                  {txState.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {txState.statusText || 'ĐANG XỬ LÝ...'}
                    </span>
                  ) : isSubmitting ? (
                    'ĐANG LƯU DỮ LIỆU...'
                  ) : (
                    'XÁC NHẬN'
                  )}
                </button>
              </div>

              {hasValidationError ? (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
                  Vui lòng sửa các dòng đang có lỗi trước khi xác nhận bán.
                </p>
              ) : null}

              {txState.status === 'error' ? (
                <p className="mb-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">⚠ {txState.error}</p>
              ) : null}

              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                THAO TÁC NÀY SẼ GHI NHẬN TRỰC TIẾP VÀO BLOCKCHAIN VÀ DATABASE
              </p>
            </div>
          </div>
        </div>
      )}

      {showSuccessSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-center backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex flex-col items-center p-10">
              <div className="mb-10 flex h-24 w-24 items-center justify-center bg-green-200">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-800">
                  <Check className="h-8 w-8 stroke-[3px] text-white" />
                </div>
              </div>

              <h2 className="mb-2 font-heading text-3xl font-bold uppercase tracking-tight text-gray-900">
                ĐĂNG BÁN THÀNH CÔNG
              </h2>
              <div className="mb-10 h-1 w-32 bg-green-700" />

              <p className="mb-12 max-w-xs font-heading text-xl font-bold uppercase leading-tight text-gray-900">
                BẠN ĐÃ ĐĂNG BÁN THÀNH CÔNG {totalTokens.toLocaleString()} TOKEN.
              </p>

              <div className="relative mb-12 w-full overflow-hidden border-l-4 border-green-700 bg-gray-50/50 p-6 text-left">
                <div className="mb-6 flex items-start gap-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-400" />
                  <p className="text-sm leading-relaxed text-gray-600">
                    Giao dịch niêm yết đã được ghi nhận. Tài sản của bạn sẽ xuất hiện trên mục "Thị trường".
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                      {sellTxHash ? 'TX HASH (BLOCKCHAIN)' : 'MÃ GIAO DỊCH'}
                    </div>
                    <div className="break-all font-mono text-xs font-bold text-gray-900">
                      {sellTxHash ? `${sellTxHash.slice(0, 10)}...${sellTxHash.slice(-8)}` : 'DB-ONLY'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 text-[10px] font-bold uppercase text-gray-400">THỜI GIAN</div>
                    <div className="font-mono text-xs font-bold uppercase text-gray-900">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}{' '}
                      {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>
                </div>
              </div>

              <button
                  onClick={() => {
                    setShowSuccessSell(false)
                    navigate('/seller')
                    submitLockRef.current = false
                  }}
                  className="w-full cursor-pointer bg-black py-5 font-heading text-base font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-900"
                >
                ĐÓNG
              </button>
            </div>
            <div className="h-1.5 w-full bg-green-700" />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/seller')} className="cursor-pointer text-gray-900 transition-colors hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-base font-bold uppercase tracking-widest text-gray-900">HOẠT ĐỘNG BÁN</h1>
          </div>
          {wallet.isConnected ? (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-heading text-sm tracking-widest text-gray-600">
                {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '0x742...'}
              </span>
              <span className="border-l border-gray-300 pl-3 font-heading text-sm tracking-widest text-gray-600">
                {wallet.balance || '1.25'} ETH
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án, tên dự án hoặc token id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Nếu đây là lần đầu dùng ví này để đăng bán, MetaMask có thể yêu cầu xác nhận 2 giao dịch:
          cấp quyền cho Marketplace và tạo lệnh đăng bán.
        </div>

        <div className="mb-6 border-b border-gray-100 bg-white py-2">
          <div className="grid grid-cols-12 items-center gap-4 px-6">
            <div className="col-span-3">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-black">DỰ ÁN</span>
            </div>
            <div className="col-span-1">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-black">NĂM</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-black">TOKEN ID</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-black">HIỆN CÓ</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-green-700">ĐĂNG BÁN</span>
            </div>
            <div className="col-span-1 text-center">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-green-700">GIÁ</span>
            </div>
            <div className="col-span-1 text-right">
              <span className="font-heading text-base font-bold uppercase tracking-widest text-black">THAO TÁC</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((row) => {
              const quantityInput = getQuantityInput(row)
              const priceInput = getPriceInput(row)
              const errors = rowErrors[row.tokenId]

              return (
                <div key={row.vintageId} className="rounded-md border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div className="grid grid-cols-12 items-start gap-4">
                    <div className="col-span-3">
                      <div className="font-heading text-sm font-bold tracking-widest text-gray-900">{row.projectName}</div>
                      <div className="mt-1 text-xs text-gray-400">{row.projectCode}</div>
                    </div>

                    <div className="col-span-1 pt-2">
                      <span className="font-heading text-sm font-bold text-green-700">{row.year}</span>
                    </div>

                    <div className="col-span-2 pt-2 text-center font-mono text-sm text-gray-700">{row.tokenId}</div>

                    <div className="col-span-2 pt-2 text-center font-heading text-sm font-bold text-gray-900">{row.quantity}</div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={quantityInput}
                        onChange={(e) => handleQuantityChange(row.tokenId, e.target.value)}
                        className={`w-full rounded border px-3 py-2 text-sm outline-none transition-colors ${
                          errors?.quantity ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 focus:border-green-500'
                        }`}
                      />
                      {errors?.quantity ? <p className="mt-1 text-xs text-red-600">{errors.quantity}</p> : null}
                    </div>

                    <div className="col-span-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={priceInput}
                        onChange={(e) => handlePriceChange(row.tokenId, e.target.value)}
                        className={`w-full rounded border px-3 py-2 text-center text-sm outline-none transition-colors ${
                          errors?.price ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 focus:border-green-500'
                        }`}
                      />
                      {errors?.price ? <p className="mt-1 text-xs text-red-600">{errors.price}</p> : null}
                    </div>

                    <div className="col-span-1 flex justify-end pt-2">
                      <button
                        onClick={() => handleReset(row)}
                        className="cursor-pointer text-gray-400 transition-colors hover:text-green-700"
                        title="Làm mới"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-md border border-gray-200 bg-white py-20 text-center text-gray-400 shadow-sm">
              <p className="font-heading text-sm font-bold tracking-widest">Không có token đã mint để đăng bán.</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white py-6 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6">
          <div className="flex flex-1 items-center gap-10">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="font-heading text-sm font-bold uppercase tracking-widest text-gray-600">TỔNG BÁN</span>
                <span className="text-xs font-bold uppercase text-gray-400">({selectedRows.length} token id):</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-4xl font-bold leading-none text-green-700">{totalTokens}</span>
                  <span className="font-heading text-sm font-bold text-gray-500">Token</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              disabled={!canSubmit}
              onClick={() => {
                submitLockRef.current = false
                txState.reset()
                setShowConfirmSell(true)
              }}
              className={`rounded px-12 py-4 font-heading text-base font-bold uppercase tracking-widest shadow-md transition-all active:scale-95 ${
                canSubmit ? 'cursor-pointer bg-green-700 text-white hover:bg-green-800' : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              XÁC NHẬN BÁN
            </button>
            {hasValidationError ? (
              <p className="text-sm text-red-600">Vui lòng sửa các dòng đang có lỗi trước khi đăng bán.</p>
            ) : null}
            {showConfirmSell || isSubmitting || txState.isLoading ? (
              <p className="text-sm text-amber-700">Đang chờ MetaMask, vui lòng không bấm xác nhận lặp lại.</p>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
