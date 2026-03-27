import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useCertificates } from '../../hooks/usePortfolio'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'
import type { Certificate } from '../../types'

export default function CertificatePage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const [search, setSearch] = useState('')
  const { organizationId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { certificates, loading } = useCertificates(organizationId ?? 0)

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.projectName.toLowerCase().includes(search.toLowerCase()) ||
      cert.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      cert.id.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filteredCertificates.reduce(
    (acc, cert) => {
      const key = cert.projectId
      if (!acc[key]) {
        acc[key] = {
          name: cert.projectName,
          code: cert.projectCode,
          certs: [],
        }
      }
      acc[key].certs.push(cert)
      return acc
    },
    {} as Record<string, { name: string; code: string; certs: Certificate[] }>
  )

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller/burn/destroy')}
              className="cursor-pointer text-gray-900 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-base font-bold tracking-widest text-gray-900 uppercase">
              CHỨNG NHẬN TIÊU HỦY
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {wallet.isConnected && (
              <div className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-1.5 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-heading text-sm tracking-widest text-gray-600">
                  {wallet.address ? `${wallet.address.slice(0, 6)}...` : '0x742...'}
                </span>
                <span className="border-l border-gray-300 pl-3 font-heading text-sm tracking-widest text-gray-600">
                  {wallet.balance || '1.25'} ETH
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-4 py-2 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
            <input
              type="text"
              placeholder="Tìm kiếm mã dự án..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <button className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 transition-colors hover:bg-gray-50">
            <span className="text-xl leading-none">Ξ</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50/50 shadow-sm">
          <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-white px-6 py-8 font-heading text-xs font-bold uppercase tracking-widest text-black">
            <div className="col-span-4">TÊN DỰ ÁN</div>
            <div className="col-span-3 text-center">THỜI GIAN</div>
            <div className="col-span-2 text-center text-green-700">TOKEN TIÊU HỦY</div>
            <div className="col-span-3 text-right">THAO TÁC</div>
          </div>

          <div className="divide-y divide-gray-200">
            {Object.entries(grouped).length > 0 ? (
              Object.entries(grouped).map(([projectId, group]) => (
                <div key={projectId} className="bg-white">
                  <div className="border-b border-gray-100 bg-white px-6 py-5">
                    <span className="font-heading text-base font-bold uppercase text-gray-800">
                      {group.name} ({group.code})
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                      {group.certs.map((cert) => (
                        <div
                          key={cert.id}
                          className="grid grid-cols-12 items-center gap-4 border-b border-gray-100 px-8 py-8 last:border-b-0"
                        >
                          <div className="col-span-4 flex items-center">
                            <span className="font-heading text-sm font-bold uppercase text-gray-900">
                              MÃ TIÊU HỦY
                            </span>
                          </div>
                          <div className="col-span-3 flex justify-center pr-4">
                            <span className="font-heading text-sm font-bold text-green-700">{cert.date}</span>
                          </div>
                          <div className="col-span-2 flex justify-center pr-2">
                            <span className="font-heading text-base font-bold tracking-wider text-green-700">
                              {cert.quantity}
                            </span>
                          </div>
                          <div className="col-span-3 flex justify-end pr-2">
                            <button className="cursor-pointer rounded-sm bg-[#1b5e20] px-6 py-3 font-heading text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#144f19]">
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
              <div className="bg-white py-20 text-center text-gray-400">
                <p>
                  {organizationId
                    ? 'Không tìm thấy chứng nhận nào.'
                    : 'Ví hiện tại chưa được ánh xạ với tổ chức trên Supabase.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
