import type { Transaction } from '../types'
import { ExternalLink, Hash, Box, User, ArrowRight, Activity, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { BLOCK_EXPLORER_URL } from '../contracts/contractConfig'

interface DataTableProps {
  transactions: Transaction[]
}

export default function DataTable({ transactions }: DataTableProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const buildTxUrl = (hash: string) => `${BLOCK_EXPLORER_URL}/tx/${hash}`

  if (transactions.length === 0) {
    return (
      <div className="py-12 border border-dashed border-gray-200 rounded-lg text-center">
        <Activity className="mx-auto h-8 w-8 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">Chưa có hoạt động giao dịch nào được ghi lại.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => {
        const tokenDelta = Number(tx.amount || 0)
        const tokenAmount = Math.abs(tokenDelta)
        const tokenDirection = tokenDelta > 0 ? 1 : tokenDelta < 0 ? -1 : 0
        const tokenSign = tokenDirection > 0 ? '+' : tokenDirection < 0 ? '-' : ''
        const tokenColor =
          tokenDirection > 0 ? 'text-green-600' : tokenDirection < 0 ? 'text-red-600' : 'text-gray-600'

        const hasUsdtAmount = typeof tx.usdtAmount === 'number' && !Number.isNaN(tx.usdtAmount)
        const usdtRawAmount = hasUsdtAmount ? Number(tx.usdtAmount) : 0
        const usdtAmount = hasUsdtAmount ? Math.abs(usdtRawAmount) : null
        const usdtDirection = usdtRawAmount > 0 ? 1 : usdtRawAmount < 0 ? -1 : 0
        const usdtSign = usdtDirection > 0 ? '+' : usdtDirection < 0 ? '-' : ''
        const usdtColor =
          usdtDirection > 0 ? 'text-green-600' : usdtDirection < 0 ? 'text-red-600' : 'text-gray-600'

        return (
        <div 
          key={tx.id} 
          className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1"
        >
          {/* Header Status & Type */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                tx.type === 'mint' ? 'bg-green-50' : 
                tx.type === 'sell' ? 'bg-blue-50' : 
                tx.type === 'retire' ? 'bg-orange-50' : 'bg-gray-50'
              }`}>
                {tx.type === 'mint' && <Zap className="h-5 w-5 text-green-600" />}
                {tx.type === 'sell' && <ArrowRight className="h-5 w-5 text-blue-600" />}
                {tx.type === 'retire' && <Activity className="h-5 w-5 text-orange-600" />}
                {tx.type === 'request' && <Clock className="h-5 w-5 text-gray-600" />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{tx.date}</div>
                <div className="font-heading text-lg font-bold text-gray-900">{tx.activity}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1.5">
              <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                tx.status === 'Success' ? 'bg-green-100 text-green-700' :
                tx.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {tx.status === 'Success' ? <CheckCircle2 className="h-3 w-3" /> :
                 tx.status === 'Failed' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {tx.status || 'Success'}
              </div>
              <div className={`text-sm font-black ${tokenColor}`}>
                {tokenSign} {tokenAmount.toLocaleString()} TOKEN
              </div>
              {hasUsdtAmount && usdtAmount !== null && (
                <div className={`text-sm font-black ${usdtColor}`}>
                  {usdtSign} {formatCurrency(usdtAmount)} USDT
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tx Hash */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                <Hash className="h-3 w-3" /> Tx Hash
              </div>
              {tx.txHash?.startsWith('0x') ? (
                <a
                  href={buildTxUrl(tx.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 group/hash cursor-pointer"
                >
                  <div className="font-mono text-xs text-gray-600 truncate max-w-[140px] transition-colors group-hover/hash:text-green-600">
                    {tx.txHash}
                  </div>
                  <ExternalLink className="h-3 w-3 text-gray-300 transition-colors group-hover/hash:text-green-400" />
                </a>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs text-gray-400 truncate max-w-[140px]">
                    {tx.txHash || '---'}
                  </div>
                </div>
              )}
            </div>

            {/* Block Number */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                <Box className="h-3 w-3" /> Block
              </div>
              <div className="text-xs font-bold text-gray-700">
                #{tx.blockNumber || '---'}
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                <User className="h-3 w-3" /> Route
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm truncate max-w-[100px]">
                  {tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : 'UNKNOWN'}
                </span>
                <ArrowRight className="h-3 w-3 text-gray-300" />
                <span className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-sm truncate max-w-[100px]">
                  {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'CONTRACT'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-3">
            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-medium">
               <div className="flex items-center gap-1">
                 <span className="font-bold uppercase tracking-wider">Gas Fee:</span>
                 <span className="text-gray-600 font-mono">{tx.gasFee ? `${(Number(tx.gasFee)).toFixed(6)} ETH` : '0.000000 ETH'}</span>
               </div>
               {tx.value && (
                 <div className="flex items-center gap-1">
                   <span className="font-bold uppercase tracking-wider">Detail:</span>
                   <span className="text-gray-600 font-mono">{tx.value}</span>
                 </div>
               )}
            </div>
            
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          </div>
        </div>
        )
      })}
    </div>
  )
}
