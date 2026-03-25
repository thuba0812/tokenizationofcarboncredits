import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Footer from '../../components/Footer'
import BuyModal from '../../components/modals/BuyModal'
import { PROJECTS } from '../../database/mockData'
import { useWallet } from '../../contexts/WalletContext'

export default function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const [buyOpen, setBuyOpen] = useState(false)

  const project = PROJECTS.find(p => p.id === id)
  if (!project) return <div className="p-10 text-center text-gray-400">Không tìm thấy dự án.</div>

  const { representative: rep } = project

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/marketplace')}
              className="text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold text-base tracking-widest text-gray-900 uppercase">
              CHI TIẾT DỰ ÁN
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border border-gray-200 rounded-md bg-white px-3 py-1.5 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-heading tracking-widest text-gray-600">
                {wallet.address ? `${wallet.address.slice(0, 6)}...` : '0x742...'}
              </span>
              <span className="text-sm font-heading tracking-widest text-gray-600 border-l border-gray-300 pl-3">
                {wallet.balance || '1.25'} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 border border-gray-200 rounded p-6">
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

            {/* Buy button */}
            <button
              onClick={() => setBuyOpen(true)}
              className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-sm tracking-widest py-3 rounded-sm transition-colors cursor-pointer"
            >
              MUA TÍN CHỈ
            </button>
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
      <BuyModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} project={project} />
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
