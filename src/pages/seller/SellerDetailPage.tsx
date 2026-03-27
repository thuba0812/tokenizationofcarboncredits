import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2, Pencil, RotateCcw, Save, X } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useContractTransaction } from '../../hooks/useContractTransaction'
import * as contractService from '../../services/contractService'
import { isContractConfigured } from '../../contracts/contractConfig'
import { listingRepository } from '../../repositories/ListingRepository'

type EditDraft = {
  quantity: string
  price: string
}

type RowErrors = {
  quantity?: string
  price?: string
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { walletId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { credits, loading, refetch } = usePortfolio(walletId ?? 0)
  const txState = useContractTransaction()
  const [editingVintageId, setEditingVintageId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, EditDraft>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingVintageId, setSavingVintageId] = useState<number | null>(null)

  const matchedCredits = credits.filter((credit) => credit.project.id === id)
  const baseProject = matchedCredits[0]?.project ?? null

  const project = useMemo(() => {
    if (!baseProject) return null

    return matchedCredits.reduce(
      (acc, credit, index) => {
        if (index === 0) {
          return {
            ...credit.project,
            tokens: [...(credit.project.tokens || [])],
          }
        }

        return {
          ...acc,
          tokenCount: acc.tokenCount + credit.project.tokenCount,
          co2Reduction: acc.co2Reduction + credit.project.co2Reduction,
          tokens: [...(acc.tokens || []), ...(credit.project.tokens || [])],
        }
      },
      baseProject
    )
  }, [baseProject, matchedCredits])

  const mintedTokens = useMemo(
    () =>
      (project?.tokens || [])
        .filter((token) => token.status === 'MINTED' && token.tokenId && token.vintageId)
        .sort((a, b) => a.year - b.year),
    [project]
  )

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  if (!project) {
    return <div className="p-10 text-center text-gray-400">Không tìm thấy tài sản của dự án này trong ví hiện tại.</div>
  }

  const representative = project.representative

  const getDraft = (vintageId: number, listedAmount: number, price: number | null) =>
    drafts[vintageId] ?? {
      quantity: listedAmount > 0 ? String(listedAmount) : '',
      price: typeof price === 'number' && price > 0 ? String(price) : '',
    }

  const parseWholeNumber = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return { value: 0, invalid: false }
    if (!/^-?\d+$/.test(trimmed)) return { value: 0, invalid: true }
    return { value: Number(trimmed), invalid: false }
  }

  const parseDecimal = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return { value: 0, invalid: false }
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return { value: 0, invalid: true }
    return { value: Number(trimmed), invalid: false }
  }

  const getRowErrors = (token: (typeof mintedTokens)[number]): RowErrors => {
    const draft = getDraft(token.vintageId as number, token.listedAmount || 0, token.price ?? null)
    const quantityParsed = parseWholeNumber(draft.quantity)
    const priceParsed = parseDecimal(draft.price)
    const errors: RowErrors = {}
    const maxSellable = token.available + (token.listedAmount || 0)
    const hasExistingListing = Boolean(token.currentListingId || token.onchainListingId || token.listedAmount)

    if (quantityParsed.invalid) {
      errors.quantity = 'Vui lòng nhập số nguyên hợp lệ.'
    } else if (hasExistingListing && !token.onchainListingId) {
      errors.quantity = 'Listing hiện tại chưa có onchain_listing_id, cần đồng bộ dữ liệu trước khi sửa.'
    } else if (quantityParsed.value < 0) {
      errors.quantity = 'Số lượng đang bán không được nhỏ hơn 0.'
    } else if (quantityParsed.value === 0 && !hasExistingListing) {
      errors.quantity = 'Lần đăng bán đầu tiên cần số lượng lớn hơn 0.'
    } else if (quantityParsed.value > maxSellable) {
      errors.quantity = `Số lượng đang bán không được vượt quá ${maxSellable}.`
    }

    if (quantityParsed.value > 0) {
      if (priceParsed.invalid) {
        errors.price = 'Vui lòng nhập số hợp lệ.'
      } else if (priceParsed.value <= 0) {
        errors.price = 'Giá phải lớn hơn 0.'
      }
    }

    return errors
  }

  const formatPrice = (price: number | null | undefined) =>
    typeof price === 'number' ? price.toLocaleString('vi-VN') : '-'

  const startEditing = (vintageId: number, listedAmount: number, price: number | null) => {
    setSaveError(null)
    txState.reset()
    setEditingVintageId(vintageId)
    setDrafts((prev) => ({
      ...prev,
      [vintageId]: {
        quantity: listedAmount > 0 ? String(listedAmount) : '',
        price: typeof price === 'number' && price > 0 ? String(price) : '',
      },
    }))
  }

  const cancelEditing = () => {
    setEditingVintageId(null)
    setSavingVintageId(null)
    setSaveError(null)
    txState.reset()
  }

  const updateDraft = (vintageId: number, key: keyof EditDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [vintageId]: {
        ...getDraft(vintageId, 0, null),
        ...(prev[vintageId] || {}),
        [key]: value,
      },
    }))
  }

  const handleReset = (vintageId: number, listedAmount: number, price: number | null) => {
    setDrafts((prev) => ({
      ...prev,
      [vintageId]: {
        quantity: listedAmount > 0 ? String(listedAmount) : '',
        price: typeof price === 'number' && price > 0 ? String(price) : '',
      },
    }))
    setSaveError(null)
    txState.reset()
  }

  const saveRow = async (token: (typeof mintedTokens)[number]) => {
    if (!wallet.address || !token.vintageId || !token.tokenId) return

    const errors = getRowErrors(token)
    if (errors.quantity || errors.price) return

    const draft = getDraft(token.vintageId, token.listedAmount || 0, token.price ?? null)
    const quantity = parseWholeNumber(draft.quantity).value
    const price = parseDecimal(draft.price).value

    setSaveError(null)
    setSavingVintageId(token.vintageId)

    try {
      let txHash: string | null = null
      let onchainListingId: number | null = token.onchainListingId ?? null
      let walletBalanceAfter: number | null = null
      let listedAmountAfter: number | null = null
      let isActiveOnChain: boolean | null = null

      if (isContractConfigured()) {
        const steps = []
        const isApproved = await contractService.isMarketplaceApproved()
        const needsApproval = quantity > (token.listedAmount || 0)

        if (!isApproved && needsApproval) {
          steps.push({
            label: 'Cấp quyền cho Marketplace',
            run: () => contractService.approveMarketplace(),
          })
        }

        if (quantity === 0 && token.onchainListingId) {
          steps.push({
            label: 'Hủy lệnh đăng bán trên blockchain',
            run: async () => {
              const result = await contractService.cancelListingDetailed(token.onchainListingId as number)
              const listingSnapshot = await contractService.getListingOnChain(result.listingId)
              walletBalanceAfter = await contractService.getCarbonTokenBalance(
                listingSnapshot.tokenId,
                listingSnapshot.seller
              )
              txHash = result.txHash
              onchainListingId = result.listingId
              listedAmountAfter = listingSnapshot.availableAmount
              isActiveOnChain = listingSnapshot.active
              return result.txHash
            },
          })
        } else if (token.onchainListingId) {
          steps.push({
            label: 'Cập nhật lệnh đăng bán trên blockchain',
            run: async () => {
              const result = await contractService.updateListingDetailed(token.onchainListingId as number, price, quantity)
              const listingSnapshot = await contractService.getListingOnChain(result.listingId)
              walletBalanceAfter = await contractService.getCarbonTokenBalance(
                listingSnapshot.tokenId,
                listingSnapshot.seller
              )
              txHash = result.txHash
              onchainListingId = result.listingId
              listedAmountAfter = listingSnapshot.availableAmount
              isActiveOnChain = listingSnapshot.active
              return result.txHash
            },
          })
        } else {
          steps.push({
            label: 'Tạo lệnh đăng bán trên blockchain',
            run: async () => {
              const result = await contractService.createListingsBatchDetailed([
                {
                  tokenId: token.vintageId as number,
                  pricePerUnit: price,
                  amount: quantity,
                },
              ])
              const listingSnapshot = await contractService.getListingOnChain(result.listingIds[0] as number)
              walletBalanceAfter = await contractService.getCarbonTokenBalance(
                listingSnapshot.tokenId,
                listingSnapshot.seller
              )
              txHash = result.txHash
              onchainListingId = result.listingIds[0] ?? null
              listedAmountAfter = listingSnapshot.availableAmount
              isActiveOnChain = listingSnapshot.active
              return result.txHash
            },
          })
        }

        const result = await txState.execute(steps)
        if (!result.success) {
          setSaveError(txState.error || 'Không thể cập nhật lệnh đăng bán trên blockchain.')
          return
        }
        txHash = result.txHash ?? txHash
      }

      const success = await listingRepository.createListings(
        wallet.address,
        [
          {
            vintageId: token.vintageId,
            quantity,
            price,
          },
        ],
        {
          [token.vintageId]: {
            txHash,
            onchainListingId,
            walletBalanceAfter,
            listedAmountAfter,
            isActiveOnChain,
          },
        }
      )

      if (!success) {
        setSaveError(txHash ? 'Blockchain đã cập nhật, nhưng lưu Supabase thất bại.' : 'Không thể lưu thay đổi vào Supabase.')
        return
      }

      await refetch()
      setEditingVintageId(null)
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[token.vintageId as number]
        return next
      })
      txState.reset()
    } catch (error) {
      console.error('Lỗi cập nhật đăng bán:', error)
      setSaveError(error instanceof Error ? error.message : 'Cập nhật đăng bán thất bại.')
    } finally {
      setSavingVintageId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller')}
              className="cursor-pointer text-gray-900 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-base font-bold uppercase tracking-widest text-gray-900">
              CHI TIET DU AN
            </h1>
          </div>
          {wallet.isConnected && (
            <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-heading text-sm tracking-widest text-gray-600">
                {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '0x742...'}
              </span>
              <span className="border-l border-gray-300 pl-3 font-heading text-sm tracking-widest text-gray-600">
                {wallet.balance || '1.25'} ETH
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <hr className="mb-8 border-gray-200" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded border border-gray-200 p-6">
              <h2 className="mb-5 font-heading text-lg font-bold tracking-widest text-gray-700">THÔNG TIN DỰ ÁN</h2>

              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="MÃ DỰ ÁN" value={project.code} />
                <Field label="TÊN DỰ ÁN" value={project.name} />
              </div>
              <hr className="my-5 border-gray-100" />

              <Field label="MÔ TẢ DỰ ÁN" value={project.description} />
              <hr className="my-5 border-gray-100" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="LĨNH VỰC" value={project.domain} />
                <Field label="VỊ TRÍ DỰ ÁN" value={project.location} />
              </div>
              <hr className="my-5 border-gray-100" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="THỜI GIAN BẮT ĐẦU" value={project.startDate} />
                <Field label="THỜI GIAN KẾT THÚC" value={project.endDate} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 font-heading text-xs font-bold tracking-widest text-gray-400">
                    LƯỢNG GIẢM PHÁT (TẤN CO2)
                  </div>
                  <div className="font-heading text-3xl font-bold text-gray-900">
                    {project.co2Reduction.toLocaleString('vi-VN')}
                    <span className="ml-1 text-base font-medium text-gray-500">tCO2</span>
                  </div>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-1 font-heading text-xs font-bold tracking-widest text-gray-400">
                    SỐ LƯỢNG TÍN CHỈ CARBON
                  </div>
                  <div className="font-heading text-3xl font-bold text-gray-900">
                    {project.tokenCount.toLocaleString('vi-VN')}
                    <span className="ml-1 text-base font-medium text-green-600">tin chi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-3 text-left font-heading text-xs font-bold tracking-widest text-gray-400">NĂM</th>
                    <th className="px-5 py-3 text-left font-heading text-xs font-bold tracking-widest text-gray-400">TOKEN ID</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">HIỆN CÓ</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">ĐANG BÁN</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">ĐÃ BÁN</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">GIÁ</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {mintedTokens.map((token) => {
                    const isEditing = editingVintageId === token.vintageId
                    const isSaving = savingVintageId === token.vintageId
                    const draft = getDraft(token.vintageId as number, token.listedAmount || 0, token.price ?? null)
                    const errors = getRowErrors(token)

                    return (
                      <tr key={token.vintageId} className="border-b border-gray-50 align-top last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-4 text-sm text-gray-700">{token.year}</td>
                        <td className="px-5 py-4 font-mono text-xs text-gray-600">{token.tokenId}</td>
                        <td className="px-5 py-4 text-center font-bold text-gray-900">{token.available}</td>
                        <td className="px-5 py-4 text-center">
                          {isEditing ? (
                            <div className="mx-auto max-w-[220px]">
                              <div className="mb-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                <span>Đang bán hiện tại</span>
                                <span>Nhập mới</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700">
                                  {token.listedAmount || 0}
                                </div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={draft.quantity}
                                  onChange={(event) => updateDraft(token.vintageId as number, 'quantity', event.target.value)}
                                  className={`w-full rounded border px-3 py-2 text-center text-sm outline-none transition-colors ${
                                    errors.quantity ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 focus:border-green-500'
                                  }`}
                                />
                              </div>
                              {errors.quantity ? <p className="mt-1 text-left text-xs text-red-600">{errors.quantity}</p> : null}
                            </div>
                          ) : (
                            <span className="font-bold text-gray-900">{token.listedAmount || 0}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-gray-900">{token.soldAmount || 0}</td>
                        <td className="px-5 py-4 text-center">
                          {isEditing ? (
                            <div className="mx-auto max-w-[250px]">
                              <div className="mb-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                                <span>Giá hiện tại</span>
                                <span>Nhập mới</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-semibold text-gray-700">
                                  {formatPrice(token.price)}
                                </div>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={draft.price}
                                  onChange={(event) => updateDraft(token.vintageId as number, 'price', event.target.value)}
                                  className={`w-full rounded border px-3 py-2 text-center text-sm outline-none transition-colors ${
                                    errors.price ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 focus:border-green-500'
                                  }`}
                                />
                              </div>
                              {errors.price ? <p className="mt-1 text-left text-xs text-red-600">{errors.price}</p> : null}
                            </div>
                          ) : (
                            <span className="font-bold text-green-700">{formatPrice(token.price)}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => void saveRow(token)}
                                  disabled={Boolean(errors.quantity || errors.price) || isSaving || txState.isLoading}
                                  className={`rounded p-2 transition-colors ${
                                    Boolean(errors.quantity || errors.price) || isSaving || txState.isLoading
                                      ? 'cursor-not-allowed text-gray-300'
                                      : 'cursor-pointer text-green-700 hover:bg-green-50'
                                  }`}
                                  title="Luu"
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  disabled={isSaving || txState.isLoading}
                                  className="cursor-pointer rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-300"
                                  title="Huy"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReset(token.vintageId as number, token.listedAmount || 0, token.price ?? null)}
                                  disabled={isSaving || txState.isLoading}
                                  className="cursor-pointer rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:text-gray-300"
                                  title="Lam moi"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(token.vintageId as number, token.listedAmount || 0, token.price ?? null)}
                                className="cursor-pointer rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-700"
                                title="Chinh sua"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {mintedTokens.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                        Chi cac dong da mint thanh cong moi hien thi trong phan tai san.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editingVintageId ? (
              <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Nếu đây là lần đầu dùng ví này để đăng bán, MetaMask có thể yêu cầu xác nhận 2 giao dịch: cấp quyền cho Marketplace và cập nhật lệnh đăng bán.
              </div>
            ) : null}

            {txState.status === 'error' ? (
              <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{txState.error}</div>
            ) : null}

            {saveError ? (
              <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>
            ) : null}
          </div>

          <div>
            <div className="sticky top-24 rounded border border-gray-200 p-6">
              <h2 className="mb-4 font-heading text-lg font-bold tracking-widest text-gray-700">DON VI DAI DIEN</h2>
              <hr className="mb-4 border-gray-100" />
              <RepField label="TEN DON VI" value={representative.company} bold />
              <RepField label="MA SO THUE" value={representative.taxId} />
              <RepField label="NGUOI DAI DIEN" value={representative.contact} bold />
              <RepField label="SO DIEN THOAI" value={representative.phone} />
              <RepField label="EMAIL" value={representative.email} link />
              <hr className="my-4 border-gray-100" />
              <div>
                <div className="mb-2 font-heading text-xs font-bold tracking-widest text-gray-400">DIA CHI VI PHAP NHAN</div>
                <div className="break-all rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
                  {representative.walletAddress}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <a href="#" className="flex cursor-pointer items-center gap-1 text-xs font-heading font-bold tracking-wider text-green-700 hover:underline">
                  VI DA XAC MINH TREN CHUOI <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 font-heading text-xs font-bold tracking-widest text-gray-400">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}

function RepField({ label, value, bold, link }: { label: string; value: string; bold?: boolean; link?: boolean }) {
  return (
    <div className="mb-3">
      <div className="mb-0.5 font-heading text-xs font-bold tracking-widest text-gray-400">{label}</div>
      {link ? (
        <a href={`mailto:${value}`} className="cursor-pointer text-sm text-green-700 hover:underline">
          {value}
        </a>
      ) : (
        <div className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</div>
      )}
    </div>
  )
}
