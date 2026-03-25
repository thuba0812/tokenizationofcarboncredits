import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/StatusBadge'
import Footer from '../../components/Footer'
import { PROJECTS } from '../../data/mockData'

const PAGE_SIZE = 4

export default function ModeratorListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = PROJECTS.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-bold text-4xl tracking-wider text-gray-900">DANH SÁCH DỰ ÁN</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-lg">
              Dữ liệu thực thi chuỗi khối cho các dự án giảm phát thải carbon đã qua quy trình kiểm soát của kiểm toán và bộ ngành.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} onFilter={() => {}} />
          </div>
        </div>

        {/* Mint button */}
        <div className="flex justify-end mb-5">
          <button className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-5 py-2.5 flex items-center gap-2 rounded-sm transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> PHÁT HÀNH TOKEN
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TÊN DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TRẠNG THÁI</th>
                <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{p.code}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-sm text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{p.domain}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => navigate(`/moderator/${p.id}`)}
                      className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-4 py-1.5 rounded-sm transition-colors cursor-pointer"
                    >
                      XEM CHI TIẾT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {paginated.length} trên {filtered.length} dự án</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 font-heading font-bold text-sm rounded border transition-colors cursor-pointer ${
                  n === page
                    ? 'bg-green-700 text-white border-green-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
