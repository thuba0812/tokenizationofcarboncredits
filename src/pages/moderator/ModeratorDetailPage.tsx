import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useProjectVintage } from '../../hooks/useProjectVintages'

export default function ModeratorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { projectVintage, loading } = useProjectVintage(id || null)

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  if (!projectVintage) return <div className="p-10 text-center text-gray-400">Không tìm thấy mã tín chỉ.</div>

  const project = projectVintage.PROJECTS
  const org = project.ORGANIZATIONS
  const walletAddress = org?.WALLETS?.[0]?.wallet_address ?? 'N/A'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/moderator')}
              className="text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-heading font-bold text-base tracking-widest text-gray-900 uppercase">
                CHI TIẾT MÃ TÍN CHỈ
              </h1>
              <StatusBadge status={projectVintage.status} />
            </div>
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
        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-gray-200 rounded p-6">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-heading font-bold text-lg tracking-widest text-gray-700">THÔNG TIN MÃ TÍN CHỈ</h2>
              <StatusBadge status={projectVintage.status} />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="MÃ DỰ ÁN" value={project.project_code} />
              <Field label="TÊN DỰ ÁN" value={project.project_name} />
            </div>
            <hr className="my-5 border-gray-100" />
            <Field label="MÔ TẢ DỰ ÁN" value={project.project_description || 'Chưa có mô tả'} />
            <hr className="my-5 border-gray-100" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="LĨNH VỰC" value={project.sector || 'N/A'} />
              <Field label="VỊ TRÍ DỰ ÁN" value={[project.country, project.province_city].filter(Boolean).join(', ') || 'N/A'} />
            </div>
            <hr className="my-5 border-gray-100" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="THỜI GIAN BẮT ĐẦU" value={project.start_date || 'N/A'} />
              <Field label="THỜI GIAN KẾT THÚC" value={project.end_date || 'N/A'} />
            </div>
            <hr className="my-5 border-gray-100" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Field label="NĂM PHÁT HÀNH" value={String(projectVintage.vintage_year)} />
              <Field label="MÃ TÍN CHỈ" value={projectVintage.credit_code} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">LƯỢNG GIẢM PHÁT (TẤN CO2)</div>
                <div className="font-heading font-bold text-3xl text-gray-900">
                  {formatMetric(projectVintage.verified_co2_reduction)}
                  <span className="text-base font-medium text-gray-500 ml-1">tCO2</span>
                </div>
                <div className="h-1.5 bg-green-100 rounded mt-3">
                  <div className="h-1.5 bg-green-400 rounded w-3/5" />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">SỐ LƯỢNG TÍN CHỈ CARBON</div>
                <div className="font-heading font-bold text-3xl text-gray-900">
                  {formatMetric(projectVintage.issued_creadit_amount)}
                  <span className="text-base font-medium text-green-600 ml-1">tín chỉ</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">(1 tín chỉ = 1 tấn CO2)</div>
              </div>
            </div>

            {projectVintage.status === 'MINTED' ? (
              <>
                <hr className="my-5 border-gray-100" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <Field label="TOKEN ID" value={projectVintage.token_id ? String(projectVintage.token_id) : '-'} />
                  <Field label="MÃ GIAO DỊCH" value={projectVintage.mint_tx_hash || '-'} />
                </div>
              </>
            ) : null}

            <hr className="my-5 border-gray-100" />
            <div>
              <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">METADATA CID</div>
              <div className="text-sm text-green-700 italic break-all">{projectVintage.metadataCid || '-'}</div>
            </div>
          </div>

          <div>
            <div className="border border-gray-200 rounded p-6 sticky top-24">
              <h2 className="font-heading font-bold text-lg tracking-widest text-gray-700 mb-4">ĐƠN VỊ ĐẠI DIỆN</h2>
              <hr className="border-gray-100 mb-4" />
              <RepField label="TÊN ĐƠN VỊ" value={org?.organization_name || 'N/A'} bold />
              <RepField label="MÃ SỐ THUẾ" value={org?.tax_code || 'N/A'} />
              <RepField label="NGƯỜI ĐẠI DIỆN" value={org?.legal_representative || 'N/A'} bold />
              <RepField label="SỐ ĐIỆN THOẠI" value={org?.phone_number || 'N/A'} />
              <RepField label="EMAIL" value={org?.email || 'N/A'} link />
              <hr className="border-gray-100 my-4" />
              <div>
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-2">ĐỊA CHỈ VÍ PHÁP NHÂN</div>
                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 font-mono text-xs text-gray-600 break-all">
                  {walletAddress}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                <a href="#" className="text-xs text-green-700 font-heading font-bold tracking-wider hover:underline flex items-center gap-1 cursor-pointer">
                  VÍ ĐÃ XÁC MINH TRÊN CHUỖI <ExternalLink className="w-3 h-3" />
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
      <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">{label}</div>
      <div className="text-sm text-gray-800 break-all">{value}</div>
    </div>
  )
}

function RepField({ label, value, bold, link }: { label: string; value: string; bold?: boolean; link?: boolean }) {
  return (
    <div className="mb-3">
      <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-0.5">{label}</div>
      {link
        ? <a href={`mailto:${value}`} className="text-sm text-green-700 hover:underline cursor-pointer">{value}</a>
        : <div className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</div>
      }
    </div>
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    VERIFIED: 'ĐÃ KIỂM DUYỆT',
    MINTING: 'CHỜ PHÁT HÀNH',
    MINTED: 'ĐÃ PHÁT HÀNH',
    ERROR: 'LỖI',
  }

  return labels[status] ?? status
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    VERIFIED: 'border-blue-300 bg-blue-50 text-blue-700',
    MINTING: 'border-amber-300 bg-amber-50 text-amber-700',
    MINTED: 'border-green-300 bg-green-50 text-green-700',
    ERROR: 'border-red-300 bg-red-50 text-red-700',
  }

  const className = config[status] ?? 'border-gray-300 bg-gray-50 text-gray-700'

  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 border font-heading text-xs font-bold tracking-wider ${className}`}>
      {statusLabel(status)}
    </span>
  )
}

function formatMetric(value: number | string) {
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
