import type { Transaction } from '../types'

interface DataTableProps {
  transactions: Transaction[]
}

export default function DataTable({ transactions }: DataTableProps) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">NGÀY THÁNG</th>
            <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">MÃ GIAO DỊCH</th>
            <th className="text-left font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">HOẠT ĐỘNG</th>
            <th className="text-right font-heading text-xs font-bold tracking-widest text-gray-400 px-5 py-3">SỐ LƯỢNG</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={tx.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-white'}`}>
              <td className="px-5 py-4 text-sm text-gray-600">{tx.date}</td>
              <td className="px-5 py-4 font-mono text-sm text-gray-600">{tx.txHash}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    tx.type === 'mint' ? 'bg-green-500' :
                    tx.type === 'sell' ? 'bg-gray-500' :
                    'bg-gray-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    tx.type === 'mint' ? 'text-green-700' :
                    tx.type === 'sell' ? 'text-gray-700' :
                    'text-gray-600'
                  }`}>{tx.activity}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                {tx.amount !== undefined ? (
                  <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} tCO2e
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">---</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
