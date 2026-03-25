import { useState } from 'react'
import { Flame } from 'lucide-react'
import Modal from '../Modal'
import type { Project } from '../../types'

interface BurnModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
}

export default function BurnModal({ isOpen, onClose, project }: BurnModalProps) {
  const [amount, setAmount] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (!project) return null

  const maxBurn = Math.floor(project.tokenCount * 0.1)
  const amountNum = parseInt(amount) || 0
  const isValid = amountNum > 0 && amountNum <= maxBurn && confirmed

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="XÁC NHẬN TIÊU HỦY TÍN CHỈ">
      {/* Project */}
      <div className="mb-5">
        <div className="text-xs text-gray-400 font-heading tracking-widest font-bold mb-1">TÊN DỰ ÁN</div>
        <div className="font-semibold text-gray-900">
          {project.name} <span className="text-gray-400 font-normal text-sm">({project.code})</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="border border-gray-200 rounded p-4">
          <div className="text-xs text-gray-400 font-heading tracking-widest mb-1">HẠN NGẠCH GỐC</div>
          <div className="font-heading font-bold text-2xl text-gray-900">{project.tokenCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">tCO2e</div>
        </div>
        <div className="border border-green-200 bg-green-50 rounded p-4">
          <div className="text-xs text-green-600 font-heading tracking-widest mb-1">MAX BURN (TỐI ĐA)</div>
          <div className="font-heading font-bold text-2xl text-green-700">{maxBurn.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-0.5">tCO2e</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5">* Max burn chỉ được 10% của hạn ngạch theo quy định của Nghị định 06/2022/NĐ-CP.</p>

      {/* Amount input */}
      <div className="mb-5">
        <div className="font-heading text-xs font-bold tracking-widest text-gray-700 mb-2">SỐ LƯỢNG MUỐN TIÊU HỦY</div>
        <div className="relative border border-green-500 rounded overflow-hidden">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full pl-4 pr-20 py-3 text-gray-900 font-medium focus:outline-none"
            placeholder="0"
            max={maxBurn}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-heading font-bold text-sm text-gray-500">TOKEN</div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-400">1 TOKEN = 1 TCO2E</span>
          {amountNum > 0 && (
            <span className="text-xs text-green-600 font-medium">Tương đương {amountNum.toLocaleString()} tCO2e</span>
          )}
        </div>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer mb-5 group">
        <div
          onClick={() => setConfirmed(p => !p)}
          className={`mt-0.5 w-5 h-5 flex-shrink-0 border-2 rounded-sm flex items-center justify-center transition-colors duration-150 cursor-pointer ${
            confirmed ? 'bg-green-700 border-green-700' : 'border-gray-400 hover:border-green-600'
          }`}
        >
          {confirmed && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-600 leading-snug">
          Tôi xác nhận số lượng tiêu hủy này nằm trong hạn mức cho phép và không thể hoàn tác trên blockchain.
        </span>
      </label>

      {/* Button */}
      <button
        disabled={!isValid}
        className={`w-full font-heading font-bold tracking-widest py-3 flex items-center justify-center gap-2 rounded-sm transition-colors duration-150 cursor-pointer ${
          isValid
            ? 'bg-green-700 hover:bg-green-800 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Flame className="w-4 h-4" />
        XÁC NHẬN ĐỐT TOKEN
      </button>
    </Modal>
  )
}
