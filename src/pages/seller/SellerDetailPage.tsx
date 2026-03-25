import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, ExternalLink } from 'lucide-react'
import Footer from '../../components/Footer'
import BurnModal from '../../components/modals/BurnModal'
import SetPriceModal from '../../components/modals/SetPriceModal'
import { PROJECTS } from '../../data/mockData'

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [burnOpen, setBurnOpen] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)

  const project = PROJECTS.find(p => p.id === id)
  if (!project) return <div className="p-10 text-center text-gray-400">Không tìm thấy dự án.</div>

  const { status, representative: rep, tokens } = project

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <button
            onClick={() => navigate('/seller')}
            className="flex items-center gap-2 text-sm font-heading font-bold tracking-wide text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> XEM CHI TIẾT
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Page title */}
        <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900 mb-0.5">CHI TIẾT DỰ ÁN CDM</h1>
        <p className="text-xs font-heading font-bold tracking-widest text-gray-400 mb-6">PHÂN TÍCH KỸ THUẬT & LƯU TRỮ SỐ CÁI</p>
        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Project info */}
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
                <Field label="THỜI GIAN KẾT THÚC" value={project.endDate} />
              </div>
              <hr className="my-5 border-gray-100" />

              {project.issuedYear && (
                <>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <Field label="NĂM PHÁT HÀNH" value={String(project.issuedYear)} />
                    <Field label="MÃ TÍN CHỈ" value={project.tokenCode ?? '—'} />
                  </div>
                  <hr className="my-5 border-gray-100" />
                </>
              )}

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
            </div>

            {/* Token table (if issued) */}
            {status === 'token-issued' && tokens && tokens.length > 0 && (
              <div className="border border-gray-200 rounded mt-5 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">NĂM</th>
                      <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ TÍN CHỈ</th>
                      <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">SỐ LƯỢNG HIỆN CÓ</th>
                      <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">GIÁ</th>
                      <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map(t => (
                      <tr key={t.year} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-700">{t.year}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{t.tokenCode}</td>
                        <td className="px-5 py-3 font-bold text-center text-gray-900">{t.quantity}</td>
                        <td className="px-5 py-3 text-center font-bold text-green-700">
                          {t.price ?? <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button className="text-gray-400 hover:text-green-700 transition-colors cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              {status === 'pending' && (
                <button disabled className="flex-1 bg-gray-200 text-gray-400 font-heading font-bold text-sm tracking-widest py-3 rounded-sm cursor-not-allowed">
                  XÁC THỰC
                </button>
              )}
              {status === 'approved' && (
                <button disabled className="flex-1 bg-gray-200 text-gray-400 font-heading font-bold text-sm tracking-widest py-3 rounded-sm cursor-not-allowed">
                  ĐÃ PHÊ DUYỆT
                </button>
              )}
              {status === 'token-issued' && (
                <>
                  <button
                    onClick={() => setBurnOpen(true)}
                    className="flex-1 border-2 border-green-700 text-green-700 font-heading font-bold text-sm tracking-widest py-3 rounded-sm hover:bg-green-700 hover:text-white transition-colors cursor-pointer"
                  >
                    TIÊU HỦY TÍN CHỈ
                  </button>
                  <button
                    onClick={() => setSellOpen(true)}
                    className="flex-1 bg-green-700 text-white font-heading font-bold text-sm tracking-widest py-3 rounded-sm hover:bg-green-800 transition-colors cursor-pointer"
                  >
                    ĐĂNG BÁN TÍN CHỈ
                  </button>
                </>
              )}
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

      <BurnModal isOpen={burnOpen} onClose={() => setBurnOpen(false)} project={project} />
      <SetPriceModal isOpen={sellOpen} onClose={() => setSellOpen(false)} project={project} onSave={() => {}} />
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
