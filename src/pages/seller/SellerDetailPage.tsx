import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Footer from '../../components/Footer'
import { useWallet } from '../../contexts/WalletContext'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'
import { usePortfolio } from '../../hooks/usePortfolio'

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { walletId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { credits, loading } = usePortfolio(walletId ?? 0)

  const matchedCredits = credits.filter((credit) => credit.project.id === id)
  const baseProject = matchedCredits[0]?.project ?? null

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  if (!baseProject) {
    return <div className="p-10 text-center text-gray-400">Không tìm thấy tài sản của dự án này trong ví hiện tại.</div>
  }

  const project = matchedCredits.reduce(
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

  const representative = project.representative
  const mintedTokens = (project.tokens || [])
    .filter((token) => token.status === 'MINTED' && token.tokenId)
    .sort((a, b) => a.year - b.year)

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
              CHI TIẾT DỰ ÁN
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
                    <span className="ml-1 text-base font-medium text-green-600">tín chỉ</span>
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
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">SỐ LƯỢNG TOKEN HIỆN CÓ</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">SỐ LƯỢNG TOKEN ĐĂNG BÁN</th>
                    <th className="px-5 py-3 text-center font-heading text-xs font-bold tracking-widest text-gray-400">GIÁ</th>
                  </tr>
                </thead>
                <tbody>
                  {mintedTokens.map((token) => (
                    <tr key={token.vintageId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-700">{token.year}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">{token.tokenId}</td>
                      <td className="px-5 py-3 text-center font-bold text-gray-900">{token.quantity}</td>
                      <td className="px-5 py-3 text-center font-bold text-gray-900">{token.listedAmount || 0}</td>
                      <td className="px-5 py-3 text-center font-bold text-green-700">
                        {typeof token.price === 'number' ? token.price : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                  {mintedTokens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                        Chỉ các dòng đã mint thành công mới hiển thị trong phần tài sản.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded border border-gray-200 p-6">
              <h2 className="mb-4 font-heading text-lg font-bold tracking-widest text-gray-700">ĐƠN VỊ ĐẠI DIỆN</h2>
              <hr className="mb-4 border-gray-100" />
              <RepField label="TÊN ĐƠN VỊ" value={representative.company} bold />
              <RepField label="MÃ SỐ THUẾ" value={representative.taxId} />
              <RepField label="NGƯỜI ĐẠI DIỆN" value={representative.contact} bold />
              <RepField label="SỐ ĐIỆN THOẠI" value={representative.phone} />
              <RepField label="EMAIL" value={representative.email} link />
              <hr className="my-4 border-gray-100" />
              <div>
                <div className="mb-2 font-heading text-xs font-bold tracking-widest text-gray-400">ĐỊA CHỈ VÍ PHÁP NHÂN</div>
                <div className="break-all rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
                  {representative.walletAddress}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <a href="#" className="flex cursor-pointer items-center gap-1 text-xs font-heading font-bold tracking-wider text-green-700 hover:underline">
                  VÍ ĐÃ XÁC MINH TRÊN CHUỖI <ExternalLink className="h-3 w-3" />
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
