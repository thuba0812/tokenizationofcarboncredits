import type { Project } from '../types'

interface ProjectCardProps {
  project: Project
  onViewDetail: (id: string) => void
  showPriceBadge?: boolean
}

export default function ProjectCard({ project, onViewDetail, showPriceBadge = true }: ProjectCardProps) {
  const hasPriceRange = project.priceMin !== undefined && project.priceMax !== undefined
  const isPriceSet = hasPriceRange

  return (
    <div 
      onClick={() => onViewDetail(project.id)}
      className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={project.thumbnail}
          alt={project.name}
          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        {/* Price badge */}
        {showPriceBadge && (
          <div className={`absolute top-2.5 right-0 font-heading font-bold text-xs tracking-wider px-3 py-1 ${
            isPriceSet
              ? 'bg-green-700 text-white'
              : 'bg-gray-800 text-white'
          }`}>
            {isPriceSet
              ? `${project.priceMin} - ${project.priceMax} USDT/TOKEN`
              : 'CHƯA ĐĂNG BÁN'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">MÃ DỰ ÁN</div>
        <div className="font-heading font-bold text-lg text-gray-900 tracking-wide mb-3">{project.code}</div>
        <div className="font-heading font-bold text-3xl text-green-700 mb-3">
          {project.tokenCount.toLocaleString('vi-VN')}
          <span className="text-3xl font-bold text-green-700 ml-2">TOKEN</span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{project.description}</p>
      </div>
    </div>
  )
}
