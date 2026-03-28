import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import Footer from '../../components/Footer'
import BatchMintModal, { type MintBatchStatus } from '../../components/modals/BatchMintModal'
import { useProjectVintages } from '../../hooks/useProjectVintages'
import { mintProjectYearBatch, type MintProjectVintageItem } from '../../services/contractService'
import { projectVintageRepository, type ProjectVintageWithDetails } from '../../repositories/ProjectVintageRepository'

const PAGE_SIZE = 10
const MINT_BATCH_SIZE = 50

type BatchRow = ProjectVintageWithDetails & {
  ownerWalletAddress?: string
  ownerWalletId?: number
}

export default function ModeratorListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showMintModal, setShowMintModal] = useState(false)
  const [mintBatches, setMintBatches] = useState<MintBatchStatus[]>([])
  const [isMinting, setIsMinting] = useState(false)
  const [mintStatusText, setMintStatusText] = useState('')
  const [mintError, setMintError] = useState<string | null>(null)

  const { projectVintages, loading, reload } = useProjectVintages()

  const rows = useMemo<BatchRow[]>(
    () =>
      projectVintages.map((row) => {
        const wallet = row.PROJECTS?.ORGANIZATIONS?.WALLETS?.[0]
        return {
          ...row,
          ownerWalletAddress: wallet?.wallet_address,
          ownerWalletId: wallet?.wallet_id,
        }
      }),
    [projectVintages]
  )

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows

    return rows.filter((row) =>
      row.PROJECTS.project_code.toLowerCase().includes(keyword) ||
      row.credit_code.toLowerCase().includes(keyword) ||
      row.PROJECTS.project_name.toLowerCase().includes(keyword)
    )
  }, [rows, search])

  const mintableRows = useMemo(
    () => filtered.filter((row) => row.status === 'VERIFIED' && !row.token_id),
    [filtered]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const createPendingBatches = (items: BatchRow[]): MintBatchStatus[] => {
    const batchCount = Math.ceil(items.length / MINT_BATCH_SIZE)
    return Array.from({ length: batchCount }, (_, index) => {
      const start = index * MINT_BATCH_SIZE + 1
      const end = Math.min((index + 1) * MINT_BATCH_SIZE, items.length)
      return {
        id: index + 1,
        range: `${start} - ${end}`,
        status: 'PENDING',
        message: 'Đang chờ thực thi',
      }
    })
  }

  const updateBatch = (batchId: number, patch: Partial<MintBatchStatus>) => {
    setMintBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, ...patch } : batch))
    )
  }

  const buildMintItem = (row: BatchRow): MintProjectVintageItem => {
    const amount = Number(row.issued_creadit_amount)
    if (!row.ownerWalletAddress) {
      throw new Error(`Thiếu ví nhận token cho ${row.credit_code}`)
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      throw new Error(`issued_creadit_amount của ${row.credit_code} phải là số nguyên dương`)
    }

    const tokenId = Number(row.PROJECTS.project_id) * 10000 + Number(row.vintage_year)

    return {
      to: row.ownerWalletAddress,
      tokenId: tokenId,
      projectId: row.PROJECTS.project_code,
      serialId: row.credit_code,
      vintageYear: Number(row.vintage_year),
      amount,
      cid: row.metadataCid || row.credit_code,
    }
  }

  const handleMint = async () => {
    const batches = createPendingBatches(mintableRows)
    setMintError(null)
    setMintStatusText('')
    setMintBatches(batches)

    if (mintableRows.length === 0) {
      setMintError('Không có dòng VERIFIED nào cần phát hành token.')
      return
    }

    setIsMinting(true)

    try {
      for (let index = 0; index < batches.length; index++) {
        const batchId = index + 1
        const batchRows = mintableRows.slice(index * MINT_BATCH_SIZE, (index + 1) * MINT_BATCH_SIZE)
        updateBatch(batchId, {
          status: 'PROCESSING',
          message: 'Đang chờ ký giao dịch trên MetaMask',
        })
        setMintStatusText(`Đang xử lý lô ${batchId}/${batches.length}`)

        const validRows: BatchRow[] = []
        const preflightErrors: string[] = []

        for (const row of batchRows) {
          try {
            buildMintItem(row)
            validRows.push(row)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tạo mint item'
            preflightErrors.push(message)
            try {
              await projectVintageRepository.markMintError(row.project_vintage_id)
            } catch (dbError) {
              preflightErrors.push(`Không cập nhật được ERROR cho ${row.credit_code}: ${String(dbError)}`)
            }
          }
        }

        if (validRows.length === 0) {
          updateBatch(batchId, {
            status: 'ERROR',
            message: preflightErrors.join(' | '),
          })
          continue
        }

        const mintItems = validRows.map(buildMintItem)
        const result = await mintProjectYearBatch(mintItems)
        const skippedTokenIds = new Set(result.skippedTokenIds)
        const syncWarnings: string[] = []

        for (const row of validRows) {
          try {
            if (skippedTokenIds.has(row.project_vintage_id)) {
              await projectVintageRepository.markMintError(row.project_vintage_id)
              continue
            }

            const tokenId = Number(row.PROJECTS.project_id) * 10000 + Number(row.vintage_year)

            await projectVintageRepository.markMinted(
              row.project_vintage_id,
              result.txHash,
              Number(row.issued_creadit_amount),
              tokenId,
              row.ownerWalletId
            )
          } catch (dbError) {
            syncWarnings.push(`${row.credit_code}: ${String(dbError)}`)
          }
        }

        if (syncWarnings.length > 0) {
          updateBatch(batchId, {
            status: 'ERROR',
            txHash: result.txHash,
            message: `Mint on-chain thành công nhưng đồng bộ Supabase lỗi: ${syncWarnings.join(' | ')}`,
          })
        } else {
          updateBatch(batchId, {
            status: 'SUCCESS',
            txHash: result.txHash,
            message: `Đã mint ${validRows.length} mã tín chỉ`,
          })
        }
      }

      await reload()
      setMintStatusText('Đã xử lý xong các lô phát hành.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi không xác định khi phát hành token'
      setMintError(message)
      setMintStatusText('')
    } finally {
      setIsMinting(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900">PHÁT HÀNH TOKEN</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
              Dữ liệu đang đọc trực tiếp từ Supabase qua bảng PROJECT_VINTAGES. Mỗi dòng là 1 mã tín chỉ theo năm của dự án.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder="Tìm theo mã dự án, mã tín chỉ, tên dự án..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="text-sm text-gray-500">
            Tổng số dòng: <span className="font-semibold text-gray-800">{filtered.length}</span>
          </div>
          <button
            onClick={() => setShowMintModal(true)}
            className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-5 py-2.5 flex items-center gap-2 rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> PHÁT HÀNH TOKEN
          </button>
        </div>

        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ TÍN CHỈ</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TÊN DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">NĂM</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">SỐ LƯỢNG TÍN CHỈ</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TRẠNG THÁI</th>
                <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr
                  key={row.project_vintage_id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{row.PROJECTS.project_code}</td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{row.credit_code}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{row.PROJECTS.project_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{row.vintage_year}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{Number(row.issued_creadit_amount).toLocaleString('vi-VN')}</td>
                  <td className="px-5 py-4">
                    <VintageStatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => navigate(`/moderator/${row.project_vintage_id}`)}
                      className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-4 py-1.5 rounded-sm transition-colors cursor-pointer"
                    >
                      XEM CHI TIẾT
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">
                    Không tìm thấy dữ liệu PROJECT_VINTAGES từ Supabase.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {paginated.length} trên {filtered.length} dòng</span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((value) => value - 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
              <button
                key={value}
                onClick={() => setPage(value)}
                className={`w-8 h-8 font-heading font-bold text-sm rounded border transition-colors cursor-pointer ${value === currentPage
                    ? 'bg-green-700 text-white border-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {value}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Footer />

      <BatchMintModal
        isOpen={showMintModal}
        onClose={() => {
          if (!isMinting) {
            setShowMintModal(false)
            setMintError(null)
            setMintStatusText('')
          }
        }}
        totalRows={filtered.length}
        mintableRows={mintableRows.length}
        batches={mintBatches}
        onConfirm={handleMint}
        isRunning={isMinting}
        statusText={mintStatusText}
        error={mintError}
      />
    </div>
  )
}

function VintageStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    MINTING: {
      label: 'Chờ phát hành',
      className: 'border-amber-300 bg-amber-50 text-amber-700',
    },
    VERIFIED: {
      label: 'Đã kiểm duyệt',
      className: 'border-blue-300 bg-blue-50 text-blue-700',
    },
    MINTED: {
      label: 'Đã phát hành',
      className: 'border-green-300 bg-green-50 text-green-700',
    },
    ERROR: {
      label: 'Lỗi',
      className: 'border-red-300 bg-red-50 text-red-700',
    },
  }

  const item = config[status] ?? {
    label: status,
    className: 'border-gray-300 bg-gray-50 text-gray-700',
  }

  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-1 font-heading text-xs font-bold tracking-wider ${item.className}`}>
      {item.label}
    </span>
  )
}
