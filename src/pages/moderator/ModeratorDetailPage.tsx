import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ExternalLink, Coins } from 'lucide-react'
import Footer from '../../components/Footer'
import StatusBadge from '../../components/StatusBadge'
import { PROJECTS } from '../../data/mockData'
import type { ProjectStatus } from '../../types'

export default function ModeratorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<ProjectStatus>(
    () => PROJECTS.find(p => p.id === id)?.status ?? 'pending'
  )

  const project = PROJECTS.find(p => p.id === id)
  if (!project) return <div className="p-10 text-center text-gray-400">Không tìm thấy dự án.</div>

  const rep = project.representative

  const handleVerify = () => setStatus('approved')
  const handleMintToken = () => setStatus('token-issued')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <button
            onClick={() => navigate('/moderator')}
            className="flex items-center gap-2 text-sm font-heading font-bold tracking-wide text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> XEM CHI TIẾT
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-4 mb-0.5">
          <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900">CHI TIẾT DỰ ÁN CDM</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs font-heading font-bold tracking-widest text-gray-400 mb-6">PHÂN TÍCH KỸ THUẬT & LƯU TRỮ SỐ CÁI</p>
        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded p-6">
              <h2 className="font-heading font-bold text-lg tracking-widest text-gray-700 mb-5">THÔNG TIN DỰ ÁN</h2>

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
                <Field label="THỜI GIAN BẮT ĐẦU" value={project.endDate} />
              </div>
              {status !== 'pending' && (
                <>
                  <hr className="my-5 border-gray-100" />
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <Field label="NĂM PHÁT HÀNH" value={String(project.issuedYear ?? 2024)} />
                    <Field label="MÃ TÍN CHỈ" value={project.tokenCode ?? 'kjadghijhuiau'} />
                  </div>
                </>
              )}
              <hr className="my-5 border-gray-100" />
              <div>
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">LINK METADATA</div>
                <div className="text-sm text-green-700 italic">{project.metadataLink}</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">LƯỢNG GIẢM PHÁT (TẤN CO2)</div>
                  <div className="font-heading font-bold text-3xl text-gray-900">
                    ₮{project.co2Reduction.toLocaleString('vi-VN')}.00
                    <span className="text-base font-medium text-gray-500 ml-1">tCO2</span>
                  </div>
                  <div className="h-1.5 bg-green-100 rounded mt-3">
                    <div className="h-1.5 bg-green-400 rounded w-3/5" />
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">SỐ LƯỢNG TÍN CHỈ CARBON</div>
                  <div className="font-heading font-bold text-3xl text-gray-900">
                    ₮{project.tokenCount.toLocaleString('vi-VN')}
                    <span className="text-base font-medium text-green-600 ml-1">tín chỉ</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">(1 tín chỉ = 1 tấn CO2)</div>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6">
                {status === 'pending' && (
                  <button
                    onClick={handleVerify}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-sm tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> XÁC THỰC
                  </button>
                )}
                {status === 'approved' && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded py-3 px-4 text-center">
                      <span className="font-heading font-bold text-sm tracking-widest text-green-700 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> ĐÃ PHÊ DUYỆT
                      </span>
                    </div>
                    <button
                      onClick={handleMintToken}
                      className="w-full bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-sm tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors cursor-pointer"
                    >
                      <Coins className="w-4 h-4" /> PHÁT HÀNH TOKEN
                    </button>
                  </div>
                )}
                {status === 'token-issued' && (
                  <div className="bg-gray-100 border border-gray-200 rounded py-3 px-4 text-center">
                    <span className="font-heading font-bold text-sm tracking-widest text-gray-500 flex items-center justify-center gap-2">
                      <Coins className="w-4 h-4" /> ĐÃ CẤP TOKEN
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Representative */}
          <div>
            <div className="border border-gray-200 rounded p-6 sticky top-24">
              <h2 className="font-heading font-bold text-lg tracking-widest text-gray-700 mb-4">ĐƠN VỊ ĐẠI DIỆN</h2>
              <hr className="border-gray-100 mb-4" />
              <RepField label="TÊN ĐƠN VỊ" value={rep.company} bold />
              <RepField label="MÃ SỐ THUẾ" value={rep.taxId} />
              <RepField label="NGƯỜI ĐẠI DIỆN" value={rep.contact} bold />
              <RepField label="SỐ ĐIỆN THOẠI" value={rep.phone} />
              <RepField label="EMAIL" value={rep.email} link />
              <hr className="border-gray-100 my-4" />
              <div>
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-2">ĐỊA CHỈ VÍ PHÁP NHÂN</div>
                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 font-mono text-xs text-gray-600 break-all">
                  {rep.walletAddress}
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
      <div className="text-sm text-gray-800">{value}</div>
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
