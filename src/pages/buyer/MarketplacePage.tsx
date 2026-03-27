import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../../components/ProjectCard'
import SearchBar from '../../components/SearchBar'
import Footer from '../../components/Footer'
import { useListings } from '../../hooks/useListings'
import type { Project } from '../../types'

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { listings, loading } = useListings()

  const listedProjects = useMemo(() => {
    const grouped = new Map<string, Project>()

    for (const item of listings) {
      const project = item.project
      const existing = grouped.get(project.id)

      if (!existing) {
        grouped.set(project.id, {
          ...project,
          tokenCount: item.available,
          priceMin: item.pricePerToken,
          priceMax: item.pricePerToken,
        })
        continue
      }

      existing.tokenCount += item.available
      existing.priceMin = Math.min(existing.priceMin ?? item.pricePerToken, item.pricePerToken)
      existing.priceMax = Math.max(existing.priceMax ?? item.pricePerToken, item.pricePerToken)
    }

    return Array.from(grouped.values()).filter(
      (project) =>
        project.code.toLowerCase().includes(search.toLowerCase()) ||
        project.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [listings, search])

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="mb-10 border-l-4 border-green-700 pl-5">
          <h1 className="mb-2 font-heading text-5xl font-bold tracking-wider text-gray-900">
            THỊ TRƯỜNG TÍN CHỈ
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-gray-500">
            Sàn giao dịch phi tập trung minh bạch cho các chứng chỉ giảm phát thải carbon được
            thẩm định theo tiêu chuẩn quốc tế tại Việt Nam.
          </p>
        </div>

        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h2 className="font-heading text-2xl font-bold tracking-widest text-gray-900">TÀI SẢN NIÊM YẾT</h2>
          <SearchBar value={search} onChange={setSearch} onFilter={() => {}} />
        </div>

        <hr className="mb-8 border-gray-200" />

        {listedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetail={(id) => navigate(`/marketplace/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg">Không tìm thấy tài sản niêm yết.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
