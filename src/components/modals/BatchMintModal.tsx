import { Check, Hourglass, RotateCw, ScanQrCode, TriangleAlert } from 'lucide-react'
import Modal from '../Modal'

export interface MintBatchStatus {
  id: number
  range: string
  status: 'SUCCESS' | 'PROCESSING' | 'PENDING' | 'ERROR'
  txHash?: string
  message?: string
}

interface BatchMintModalProps {
  isOpen: boolean
  onClose: () => void
  totalRows: number
  mintableRows: number
  batches: MintBatchStatus[]
  onConfirm: () => Promise<void> | void
  isRunning: boolean
  statusText?: string
  error?: string | null
}

export default function BatchMintModal({
  isOpen,
  onClose,
  totalRows,
  mintableRows,
  batches,
  onConfirm,
  isRunning,
  statusText,
  error,
}: BatchMintModalProps) {
  if (!isOpen) return null

  const canConfirm = mintableRows > 0 && !isRunning
  const isAllDone = batches.length > 0 && batches.every((batch) => batch.status === 'SUCCESS')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-5xl">
      <div className="-mx-6 -mt-4">
        <div className="px-10 pt-10 pb-8 text-center">
          <h2 className="font-heading text-5xl font-bold tracking-tight text-slate-800">
            XÁC NHẬN PHÁT HÀNH TOKEN THEO LÔ
          </h2>

          <div className="mx-auto mt-10 max-w-4xl text-left">
            <p className="text-2xl leading-relaxed text-slate-600">
              Hệ thống đã chuẩn bị dữ liệu cho{' '}
              <span className="font-bold text-green-700">{mintableRows} mã tín chỉ</span> đã được
              phê duyệt.
            </p>
            <p className="mt-2 text-2xl leading-relaxed text-slate-500">
              Để đảm bảo an toàn, danh sách được chia thành {batches.length || 1} lô giao dịch.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-10 pb-10">
          {batches.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-10 text-center text-lg text-slate-500">
              Chưa có lô nào sẵn sàng để phát hành.
            </div>
          ) : null}

          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}

          {statusText ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 text-base text-blue-900">
              {statusText}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-base text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="bg-[#eef5f0] px-10 py-8">
          <div className="flex gap-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-3xl bg-[#dff7e1] px-6 py-5 font-heading text-2xl font-bold tracking-wider text-slate-500 transition-colors hover:bg-[#d2f0d5]"
            >
              HỦY BỎ
            </button>
            <button
              onClick={() => void onConfirm()}
              disabled={!canConfirm}
              className={`flex-1 rounded-3xl px-6 py-5 font-heading text-2xl font-bold tracking-wider text-white transition-colors ${
                canConfirm ? 'bg-slate-900 hover:bg-slate-800' : 'cursor-not-allowed bg-[#c9cae0] text-white/90'
              }`}
            >
              {isRunning ? 'ĐANG XỬ LÝ' : isAllDone ? 'HOÀN TẤT' : 'BẮT ĐẦU'}
            </button>
          </div>

          <p className="mt-8 text-center font-heading text-sm uppercase tracking-[0.32em] text-slate-400">
            Vui lòng không đóng cửa sổ này cho đến khi tất cả các lô được xác nhận
          </p>
          <p className="mt-3 text-center text-sm text-slate-400">
            Tổng số dòng hiện có trong bảng: {totalRows}
          </p>
        </div>
      </div>
    </Modal>
  )
}

function BatchCard({ batch }: { batch: MintBatchStatus }) {
  const styles = getBatchStyles(batch.status)

  return (
    <div className={`rounded-[24px] border-l-[6px] ${styles.wrapper}`}>
      <div className="flex items-center justify-between gap-6 px-10 py-8">
        <div className="flex items-center gap-8">
          <div className={`flex h-20 w-20 items-center justify-center rounded-[22px] ${styles.iconBox}`}>
            {batch.status === 'SUCCESS' ? (
              <Check className="h-10 w-10 stroke-[3px]" />
            ) : batch.status === 'PROCESSING' ? (
              <RotateCw className="h-10 w-10 animate-spin" />
            ) : batch.status === 'ERROR' ? (
              <TriangleAlert className="h-10 w-10" />
            ) : (
              <Hourglass className="h-10 w-10" />
            )}
          </div>

          <div>
            <div className={`font-heading text-3xl font-bold ${styles.title}`}>
              Lô {batch.id} (Dòng {batch.range})
            </div>

            {batch.status === 'SUCCESS' && batch.txHash ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="font-heading text-sm font-bold uppercase tracking-[0.28em] text-[#63a88d]">
                  Txhash:
                </span>
                <span className="rounded-lg bg-[#bcf0db] px-3 py-1 font-mono text-xl text-[#0f766e]">
                  {shortHash(batch.txHash)}
                </span>
              </div>
            ) : null}

            {batch.status === 'PROCESSING' ? (
              <div className="mt-3 flex items-center gap-2 text-[#2f8a3b]">
                <ScanQrCode className="h-5 w-5" />
                <span className="text-xl">
                  {batch.message || 'Vui lòng xác nhận trên ví MetaMask của bạn'}
                </span>
              </div>
            ) : null}

            {batch.status === 'PENDING' ? (
              <div className="mt-2 text-xl text-slate-500">
                {batch.message || 'Hệ thống đang chờ lệnh thực thi'}
              </div>
            ) : null}

            {batch.status === 'ERROR' && batch.message ? (
              <div className="mt-2 text-lg text-red-700">{batch.message}</div>
            ) : null}
          </div>
        </div>

        <div className={`font-heading text-2xl font-bold uppercase ${styles.statusText}`}>
          {statusLabel(batch.status)}
        </div>
      </div>
    </div>
  )
}

function getBatchStyles(status: MintBatchStatus['status']) {
  if (status === 'SUCCESS') {
    return {
      wrapper: 'border-[#0b7a53] bg-[#e6f7f2]',
      iconBox: 'bg-[#6ae7b3] text-[#0b7a53]',
      title: 'text-slate-800',
      statusText: 'text-[#0b7a53]',
    }
  }

  if (status === 'PROCESSING') {
    return {
      wrapper: 'border-[#1d4ed8] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]',
      iconBox: 'bg-[#2f8a3b] text-white',
      title: 'text-slate-800',
      statusText: 'text-[#2f8a3b]',
    }
  }

  if (status === 'ERROR') {
    return {
      wrapper: 'border-red-500 bg-red-50',
      iconBox: 'bg-red-100 text-red-700',
      title: 'text-slate-800',
      statusText: 'text-red-700',
    }
  }

  return {
    wrapper: 'border-transparent bg-[#f4f6fb] opacity-90',
    iconBox: 'bg-[#e6ebf8] text-slate-500',
    title: 'text-slate-500',
    statusText: 'text-slate-500',
  }
}

function statusLabel(status: MintBatchStatus['status']) {
  const labels: Record<MintBatchStatus['status'], string> = {
    SUCCESS: 'THÀNH CÔNG',
    PROCESSING: 'ĐANG XỬ LÝ...',
    PENDING: 'ĐANG CHỜ',
    ERROR: 'LỖI',
  }

  return labels[status]
}

function shortHash(hash: string) {
  if (hash.length <= 14) return hash
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}
