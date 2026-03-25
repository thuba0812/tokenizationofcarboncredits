import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../../components/ProjectCard'
import SearchBar from '../../components/SearchBar'
import Footer from '../../components/Footer'
import { PROJECTS } from '../../database/mockData'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Only show listed (token-issued with price) projects
  const listed = PROJECTS.filter(p =>
    p.status === 'token-issued' &&
    p.priceMin !== undefined &&
    (
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Hero section with left border */}
        <div className="border-l-4 border-green-700 pl-5 mb-10">
          <h1 className="font-heading font-bold text-5xl tracking-wider text-gray-900 mb-2">THỊ TRƯỜNG TÍN CHỈ</h1>
          <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
            Sàn giao dịch phi tập trung minh bạch cho các chứng chỉ giảm phát thải carbon được thẩm định theo tiêu chuẩn quốc tế tại Việt Nam.
          </p>
        </div>

        {/* Listed assets header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="font-heading font-bold text-2xl tracking-widest text-gray-900">TÀI SẢN NIÊM YẾT</h2>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Grid */}
        {listed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listed.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetail={id => navigate(`/marketplace/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Không tìm thấy tài sản niêm yết.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
