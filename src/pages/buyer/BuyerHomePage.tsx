import { useState } from 'react'
import SearchBar from '../../components/SearchBar'
import BurnModal from '../../components/modals/BurnModal'
import { PURCHASED_CREDITS } from '../../data/mockData'
import type { Project } from '../../types'
import { Download, Flame } from 'lucide-react'

export default function BuyerHomePage() {
  const [search, setSearch] = useState('')
  const [burnProject, setBurnProject] = useState<Project | null>(null)

  const purchasedProjects = PURCHASED_CREDITS

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900">TÀI SẢN CỦA TÔI</h1>
            <p className="text-gray-500 text-sm mt-1">Danh mục các dự án carbon đã mua</p>
          </div>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Purchased credits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
          {purchasedProjects.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-md transition-all duration-200">
              {/* Image */}
              <div className="relative">
                <img src={item.project.thumbnail} alt={item.project.name} className="w-full h-44 object-cover" />
                <div className="absolute top-2.5 right-0 bg-green-700 text-white font-heading font-bold text-xs tracking-wider px-3 py-1">
                  {item.pricePerToken.toFixed(2)} ETH/TOKEN
                </div>
              </div>
              {/* Content */}
              <div className="p-4">
                <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">MÃ DỰ ÁN</div>
                <div className="font-heading font-bold text-lg text-gray-900 mb-1">{item.project.code}</div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.project.description}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBurnProject(item.project)}
                    className="flex-1 border border-green-700 text-green-700 font-heading font-bold text-xs tracking-widest py-2 hover:bg-green-700 hover:text-white transition-colors duration-150 cursor-pointer rounded-sm flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" /> TIÊU HỦY TÍN CHỈ
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 font-heading font-bold text-xs tracking-widest py-2 hover:bg-gray-50 transition-colors duration-150 cursor-pointer rounded-sm flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> TẢI CHỨNG CHỈ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BurnModal
        isOpen={!!burnProject}
        onClose={() => setBurnProject(null)}
        project={burnProject}
      />
    </div>
  )
}
