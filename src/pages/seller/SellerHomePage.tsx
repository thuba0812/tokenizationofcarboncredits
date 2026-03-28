import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../../components/ProjectCard'
import SearchBar from '../../components/SearchBar'
import DataTable from '../../components/DataTable'
import { useWallet } from '../../contexts/WalletContext'
import { usePortfolio } from '../../hooks/usePortfolio'
import { useWalletIdentity } from '../../hooks/useWalletIdentity'

export default function SellerHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { wallet } = useWallet()
  const { walletId, loading: identityLoading } = useWalletIdentity(wallet.address)
  const { credits, transactions, loading: portfolioLoading } = usePortfolio(walletId ?? 0)

  const uniqueProjects = credits.reduce<typeof credits[number]['project'][]>((acc, item) => {
    const existing = acc.find((project) => project.id === item.project.id)
    if (!existing) {
      acc.push({
        ...item.project,
        tokens: [...(item.project.tokens || [])],
      })
      return acc
    }

    existing.tokenCount += item.project.tokenCount
    existing.co2Reduction += item.project.co2Reduction
    existing.tokens = [...(existing.tokens || []), ...(item.project.tokens || [])]

    const prices = (existing.tokens || [])
      .map((token) => token.price)
      .filter((price): price is number => typeof price === 'number')
    existing.priceMin = prices.length > 0 ? Math.min(...prices) : undefined
    existing.priceMax = prices.length > 0 ? Math.max(...prices) : undefined
    return acc
  }, [])

  const filtered = uniqueProjects.filter(
    (project) =>
      project.code.toLowerCase().includes(search.toLowerCase()) ||
      project.name.toLowerCase().includes(search.toLowerCase())
  )

  if (identityLoading || portfolioLoading) {
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="h-56 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          alt="Forest"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-wider text-gray-900">TÀI SẢN CỦA TÔI</h1>
            <p className="mt-1 text-sm text-gray-500">
              Danh mục dự án carbon đang nằm trong ví hiện tại được ánh xạ từ Supabase.
            </p>
          </div>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        <div className="mb-6 flex justify-end gap-3">
          <button
            onClick={() => navigate('/seller/sell/create')}
            className="cursor-pointer rounded-sm bg-green-700 px-5 py-2.5 font-heading text-xs font-bold tracking-widest text-white transition-colors duration-150 hover:bg-green-800"
          >
            ĐĂNG BÁN
          </button>
          <button
            onClick={() => navigate('/seller/burn/destroy')}
            className="cursor-pointer rounded-sm bg-gray-900 px-5 py-2.5 font-heading text-xs font-bold tracking-widest text-white transition-colors duration-150 hover:bg-black"
          >
            TIÊU HỦY
          </button>
        </div>

        <hr className="mb-8 border-gray-200" />

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetail={(id) => navigate(`/seller/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg">
              {walletId
                ? 'Không tìm thấy tài sản phù hợp trong ví này.'
                : 'Ví hiện tại chưa được ánh xạ với bản ghi WALLETS trên Supabase.'}
            </p>
          </div>
        )}

        {wallet.isConnected && (
          <>
            <hr className="my-12 border-gray-200" />
            <h2 className="mb-5 font-heading text-2xl font-bold tracking-widest text-gray-900">
              HOẠT ĐỘNG SỔ CÁI GẦN ĐÂY
            </h2>
            <DataTable transactions={transactions} />
          </>
        )}
      </div>
    </div>
  )
}
