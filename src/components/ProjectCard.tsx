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
    <div className="bg-white border border-gray-200 rounded overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group">
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
              : 'CHƯA SET GIÁ'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="font-heading text-xs font-bold tracking-widest text-gray-400 mb-1">MÃ DỰ ÁN</div>
        <div className="font-heading font-bold text-lg text-gray-900 tracking-wide mb-2">{project.code}</div>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{project.description}</p>
        <button
          onClick={() => onViewDetail(project.id)}
          className="w-full border border-gray-900 text-gray-900 font-heading font-bold text-xs tracking-widest py-2 hover:bg-gray-900 hover:text-white transition-colors duration-150 cursor-pointer rounded-sm"
        >
          XEM CHI TIẾT
        </button>
      </div>
    </div>
  )
}
