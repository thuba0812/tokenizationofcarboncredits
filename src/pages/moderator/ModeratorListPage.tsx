import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import SearchBar from '../../components/SearchBar'
import Footer from '../../components/Footer'
import { useProjects } from '../../hooks/useProjects'
import BatchMintModal from '../../components/modals/BatchMintModal'

const PAGE_SIZE = 4

export default function ModeratorListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showMintModal, setShowMintModal] = useState(false)



  const { projects, loading } = useProjects()

  const filteredTokens = projects.flatMap(p => 
    (p.tokens || []).map(t => ({ project: p, token: t }))
  ).filter(item =>
    item.project.code.toLowerCase().includes(search.toLowerCase()) ||
    item.project.name.toLowerCase().includes(search.toLowerCase()) ||
    item.token.tokenCode.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredTokens.length / PAGE_SIZE)
  const paginated = filteredTokens.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>

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
          <button 
            onClick={() => setShowMintModal(true)}
            className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-5 py-2.5 flex items-center gap-2 rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> PHÁT HÀNH TOKEN
          </button>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ TÍN CHỈ</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TÊN DỰ ÁN</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">SỐ LƯỢNG TÍN CHỈ</th>
                <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">TRẠNG THÁI (LÔ)</th>
                <th className="text-center font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(item => (
                <tr key={`${item.project.id}-${item.token.year}`} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{item.project.code}</td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{item.token.tokenCode}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-sm text-gray-900">{item.project.name}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">NĂM (VINTAGE): {item.token.year}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700 font-bold">
                    {item.token.quantity.toLocaleString('en-US')} <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-sans">TÍN CHỈ</span>
                  </td>
                  <td className="px-5 py-4">
                    {item.token.status === 'MINTED' ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-sm font-bold tracking-wider">ĐÃ PHÁT HÀNH (MINTED)</span>
                    ) : item.token.status === 'MINTING' ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-sm font-bold tracking-wider">CHỜ PHÁT HÀNH (MINTING)</span>
                    ) : item.token.status === 'RETIRED' ? (
                      <span className="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-sm font-bold tracking-wider">ĐÃ XÓA SỔ (RETIRED)</span>
                    ) : (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-sm font-bold tracking-wider">{item.token.status || 'N/A'}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => navigate(`/moderator/${item.project.id}`)}
                      className="bg-green-700 hover:bg-green-800 text-white font-heading font-bold text-xs tracking-widest px-4 py-1.5 rounded-sm transition-colors cursor-pointer"
                    >
                      XEM DỰ ÁN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Hiển thị {paginated.length} trên {filteredTokens.length} lô tín chỉ</span>
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

      <BatchMintModal 
        isOpen={showMintModal}
        onClose={() => {
          setShowMintModal(false);
          window.location.reload();
        }}
      />
    </div>
  )
}
