import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../../components/ProjectCard'
import SearchBar from '../../components/SearchBar'
import DataTable from '../../components/DataTable'
import { PROJECTS, TRANSACTIONS } from '../../database/mockData'
import { useWallet } from '../../contexts/WalletContext'

export default function SellerHomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { wallet } = useWallet()

  const filtered = PROJECTS.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image */}
      <div className="w-full h-56 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          alt="Forest"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900">TÀI SẢN CỦA TÔI</h1>
            <p className="text-gray-500 text-sm mt-1">Danh mục các dự án carbon đã xác thực và đang triển khai.</p>
          </div>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button 
            onClick={() => navigate('/seller/sell/create')}
            className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-5 py-2.5 rounded-sm transition-colors duration-150 cursor-pointer"
          >
            ĐĂNG BÁN
          </button>
          <button 
            onClick={() => navigate('/seller/burn/destroy')}
            className="bg-gray-900 hover:bg-black text-white font-heading font-bold text-xs tracking-widest px-5 py-2.5 rounded-sm transition-colors duration-150 cursor-pointer"
          >
            TIÊU HỦY
          </button>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Project grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetail={id => navigate(`/seller/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Không tìm thấy dự án phù hợp.</p>
          </div>
        )}

        {/* Wallet Activity Section - Only show when connected */}
        {wallet.isConnected && (
          <>
            <hr className="border-gray-200 my-12" />
            <h2 className="font-heading font-bold text-2xl tracking-widest text-gray-900 mb-5">HOẠT ĐỘNG SỔ CÁI GẦN ĐÂY</h2>
            <DataTable transactions={TRANSACTIONS} />
          </>
        )}
      </div>
    </div>
  )
}
