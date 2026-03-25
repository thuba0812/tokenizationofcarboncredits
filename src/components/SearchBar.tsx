import { Search, SlidersHorizontal } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  onFilter?: () => void
}

export default function SearchBar({ value, onChange, placeholder = 'Tìm kiếm mã dự án...', onFilter }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-64 pl-4 pr-10 py-2 border border-gray-300 rounded text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors duration-150"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {onFilter && (
        <button
          onClick={onFilter}
          className="border border-gray-300 rounded p-2 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150 cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  )
}
