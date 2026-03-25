import type { ProjectStatus } from '../types'

interface StatusBadgeProps {
  status: ProjectStatus
  label?: string
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  'pending': {
    label: 'CHƯA XÁC THỰC',
    className: 'border border-red-600 text-red-700 bg-red-50',
  },
  'approved': {
    label: 'ĐÃ XÁC THỰC',
    className: 'border border-green-600 text-green-700 bg-green-50',
  },
  'token-issued': {
    label: 'ĐÃ CẤP TOKEN',
    className: 'border border-gray-400 text-gray-600 bg-gray-50',
  },
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-heading text-xs font-bold tracking-wider px-2.5 py-1 rounded ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'pending' ? 'bg-red-600' :
        status === 'approved' ? 'bg-green-600' :
        'bg-gray-400'
      }`} />
      {label ?? config.label}
    </span>
  )
}
