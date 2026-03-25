import { useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '../Modal'
import type { Project, TokenYear } from '../../types'

interface SetPriceModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onSave: (prices: Record<number, number>) => void
}

export default function SetPriceModal({ isOpen, onClose, project, onSave }: SetPriceModalProps) {
  const [prices, setPrices] = useState<Record<number, number>>({})

  if (!project) return null

  const tokens: TokenYear[] = project.tokens ?? []

  const handleSubmit = () => {
    onSave(prices)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ĐĂNG BÁN TÍN CHỈ">
      <div className="mb-4">
        <div className="text-xs text-gray-400 font-heading tracking-widest font-bold mb-1">DỰ ÁN</div>
        <div className="font-semibold text-gray-900">{project.name}</div>
        <div className="text-sm text-gray-400">{project.code}</div>
      </div>

      <div className="border border-gray-200 rounded overflow-hidden mb-5">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-heading font-bold tracking-widest text-gray-400 px-4 py-2.5">NĂM</th>
              <th className="text-left text-xs font-heading font-bold tracking-widest text-gray-400 px-4 py-2.5">MÃ TÍN CHỈ</th>
              <th className="text-right text-xs font-heading font-bold tracking-widest text-gray-400 px-4 py-2.5">SỐ LƯỢNG</th>
              <th className="text-right text-xs font-heading font-bold tracking-widest text-gray-400 px-4 py-2.5">GIÁ (USDT)</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => (
              <tr key={t.year} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{t.year}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.tokenCode}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{t.quantity}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder={t.price?.toFixed(2) ?? '0.00'}
                    onChange={e => setPrices(prev => ({ ...prev, [t.year]: parseFloat(e.target.value) || 0 }))}
                    className="w-24 border border-gray-200 rounded text-right text-sm py-1 px-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-700 hover:bg-green-800 text-white font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        LƯU VÀ ĐĂNG BÁN
      </button>
    </Modal>
  )
}
