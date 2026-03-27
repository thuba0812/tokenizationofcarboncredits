import { useState } from 'react'
import SearchBar from '../../components/SearchBar'
import BurnModal from '../../components/modals/BurnModal'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useWallet } from '../../contexts/WalletContext'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'
import type { Project } from '../../types'
import { Download, Flame } from 'lucide-react'

export default function BuyerHomePage() {
  const [search, setSearch] = useState('')
  const [burnProject, setBurnProject] = useState<Project | null>(null)
  const { wallet } = useWallet()
  const { walletId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { credits, loading } = usePortfolio(walletId ?? 0)

  const purchasedProjects = credits.filter((item) =>
    item.project.name.toLowerCase().includes(search.toLowerCase())
  )

  if (identityLoading || loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-wider text-gray-900">
              TÀI SẢN CỦA TÔI
            </h1>
            <p className="mt-1 text-sm text-gray-500">Danh mục các dự án carbon đã mua theo ví hiện tại</p>
          </div>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        <hr className="mb-8 border-gray-200" />

        <div className="mb-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {purchasedProjects.map((item, i) => (
            <div
              key={i}
              className="overflow-hidden rounded border border-gray-200 bg-white transition-all duration-200 hover:shadow-md"
            >
              <div className="relative">
                <img src={item.project.thumbnail} alt={item.project.name} className="h-44 w-full object-cover" />
                <div className="absolute right-0 top-2.5 bg-green-700 px-3 py-1 font-heading text-xs font-bold tracking-wider text-white">
                  {item.pricePerToken.toFixed(2)} ETH/TOKEN
                </div>
              </div>

              <div className="p-4">
                <div className="mb-1 font-heading text-xs font-bold tracking-widest text-gray-400">MÃ DỰ ÁN</div>
                <div className="mb-1 font-heading text-lg font-bold text-gray-900">{item.project.code}</div>
                <p className="mb-4 line-clamp-2 text-sm text-gray-500">{item.project.description}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBurnProject(item.project)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-green-700 py-2 font-heading text-xs font-bold tracking-widest text-green-700 transition-colors duration-150 hover:bg-green-700 hover:text-white"
                  >
                    <Flame className="h-3.5 w-3.5" /> TIÊU HỦY TÍN CHỈ
                  </button>
                  <button className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-gray-300 py-2 font-heading text-xs font-bold tracking-widest text-gray-700 transition-colors duration-150 hover:bg-gray-50">
                    <Download className="h-3.5 w-3.5" /> TẢI CHỨNG CHỈ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {walletId === null && (
          <div className="py-10 text-center text-sm text-gray-400">
            Ví hiện tại chưa được ánh xạ với bản ghi WALLETS trên Supabase.
          </div>
        )}
      </div>

      <BurnModal isOpen={!!burnProject} onClose={() => setBurnProject(null)} project={burnProject} />
    </div>
  )
}
