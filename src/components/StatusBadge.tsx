import type { ProjectStatus } from '../types'

interface StatusBadgeProps {
  status: ProjectStatus
  label?: string
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  'pending': {
    label: 'CHƯA CẤP TOKEN',
    className: 'border border-gray-400 text-gray-600 bg-gray-50',
  },
  'approved': {
    label: 'ĐÃ CẤP TOKEN',
    className: 'border border-green-600 text-green-700 bg-green-50',
  },
  'token-issued': {
    label: 'ĐÃ CẤP TOKEN',
    className: 'border border-green-600 text-green-700 bg-green-50',
  },
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-heading text-xs font-bold tracking-wider px-2.5 py-1 rounded ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'pending' ? 'bg-gray-400' : 'bg-green-600'
      }`} />
      {label ?? config.label}
    </span>
  )
}
