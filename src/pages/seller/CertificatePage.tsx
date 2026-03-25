import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import Footer from '../../components/Footer'
import { CERTIFICATES } from '../../data/mockData'
import { useWallet } from '../../contexts/WalletContext'

export default function CertificatePage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const [search, setSearch] = useState('')

  const filteredCertificates = CERTIFICATES.filter(cert =>
    cert.projectName.toLowerCase().includes(search.toLowerCase()) ||
    cert.projectCode.toLowerCase().includes(search.toLowerCase()) ||
    cert.id.toLowerCase().includes(search.toLowerCase())
  )

  // Group by project
  const grouped = filteredCertificates.reduce((acc, cert) => {
    const key = cert.projectId
    if (!acc[key]) {
      acc[key] = {
        name: cert.projectName,
        code: cert.projectCode,
        certs: []
      }
    }
    acc[key].certs.push(cert)
    return acc
  }, {} as Record<string, { name: string, code: string, certs: typeof CERTIFICATES }>)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller/burn/destroy')}
              className="text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-heading font-bold text-base tracking-widest text-gray-900 uppercase">
              CHỨNG NHẬN TIÊU HỦY
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
        {/* Search & Filter */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-4 py-2 bg-white focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
            />
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <button className="px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center bg-white">
            <span className="text-xl leading-none">Ξ</span>
          </button>
        </div>

        {/* Content Table */}
        <div className="bg-gray-50/50 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 bg-white border-b border-gray-200 px-6 py-8 font-heading font-bold text-xs tracking-widest text-black uppercase">
            <div className="col-span-4">TÊN DỰ ÁN</div>
            <div className="col-span-3 text-center">THỜI GIAN</div>
            <div className="col-span-2 text-center text-green-700">TOKEN TIÊU HỦY</div>
            <div className="col-span-3 text-right">THAO TÁC</div>
          </div>

          <div className="divide-y divide-gray-200">
            {Object.entries(grouped).length > 0 ? (
              Object.entries(grouped).map(([projectId, group]) => (
                <div key={projectId} className="bg-white">
                  {/* Project Title Bar */}
                  <div className="px-6 py-5 bg-white border-b border-gray-100">
                    <span className="font-heading font-bold text-base text-gray-800 uppercase">
                      {group.name} ({group.code})
                    </span>
                  </div>
                  
                  {/* Project Certificates Box */}
                  <div className="p-6">
                    <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                      {group.certs.map((cert) => (
                        <div key={cert.id} className="grid grid-cols-12 gap-4 px-8 py-8 items-center border-b border-gray-100 last:border-b-0 translate-x-1">
                          <div className="col-span-4 flex items-center">
                            <span className="font-heading font-bold text-sm text-gray-900 uppercase">MÃ TIÊU HỦY</span>
                          </div>
                          <div className="col-span-3 flex justify-center pr-4">
                            <span className="font-heading font-bold text-sm text-green-700">{cert.date}</span>
                          </div>
                          <div className="col-span-2 flex justify-center pr-2">
                             <span className="font-heading font-bold text-sm text-green-700 tracking-wider text-base">{cert.quantity}</span>
                          </div>
                          <div className="col-span-3 flex justify-end pr-2">
                            <button className="bg-[#1b5e20] hover:bg-[#144f19] text-white font-heading font-bold text-[10px] tracking-widest px-6 py-3 rounded-sm uppercase transition-colors cursor-pointer shadow-sm">
                              XEM CHỨNG CHỈ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400 bg-white">
                <p>Không tìm thấy chứng nhận nào.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
