import { RotateCw, Check, Hourglass } from 'lucide-react';

interface BatchInfo {
  id: number;
  range: string;
  status: 'SUCCESS' | 'PROCESSING' | 'PENDING' | 'ERROR';
  txHash?: string;
  message?: string;
}

interface BatchMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalProjects: number;
  batches: BatchInfo[];
}

export default function BatchMintModal({ isOpen, onClose, totalProjects, batches }: BatchMintModalProps) {
  if (!isOpen) return null;

  const isAllDone = batches.every(b => b.status === 'SUCCESS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="p-8 pt-10 flex flex-col items-center">
          <h2 className="font-heading font-bold text-3xl tracking-tight text-black mb-4 uppercase text-center">
            XÁC NHẬN PHÁT HÀNH TOKEN THEO LÔ
          </h2>
          <div className="text-center max-w-md">
            <p className="text-gray-600 text-sm leading-relaxed">
              Hệ thống đã chuẩn bị dữ liệu cho <span className="text-[#1b5e20] font-bold">156 dự án</span> đã được phê duyệt.
            </p>
            <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">
              Để đảm bảo an toàn, danh sách được chia thành 4 lô giao dịch (50 + 50 + 50 + {totalProjects - 150}).
            </p>
          </div>
        </div>

        {/* Batch List */}
        <div className="px-8 pb-8 space-y-3">
          {batches.map((batch) => (
            <div 
              key={batch.id}
              className={`relative flex items-center justify-between p-4 px-6 border rounded-lg transition-all duration-300 ${
                batch.status === 'SUCCESS' ? 'bg-[#f1f8f5] border-l-4 border-l-[#1b5e20] border-gray-100' :
                batch.status === 'PROCESSING' ? 'bg-white border-l-4 border-l-black border-gray-200 shadow-md scale-[1.02] z-10' :
                'bg-[#f8f9fa] border-l-4 border-l-gray-300 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Status Icon Wrapper */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  batch.status === 'SUCCESS' ? 'bg-[#1b5e20] text-white' :
                  batch.status === 'PROCESSING' ? 'bg-black text-white' :
                  'bg-[#e9ecef] text-gray-400'
                }`}>
                  {batch.status === 'SUCCESS' ? <Check className="w-5 h-5 stroke-[3px]" /> :
                   batch.status === 'PROCESSING' ? <RotateCw className="w-5 h-5 animate-spin" /> :
                   <Hourglass className="w-5 h-5" />}
                </div>

                <div className="text-left">
                  <div className={`font-heading font-bold text-base ${
                    batch.status === 'PENDING' ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    Lô {batch.id} (Dự án {batch.range})
                  </div>
                  {batch.status === 'SUCCESS' && batch.txHash && (
                    <div className="flex items-center gap-1 mt-0.5">
                       <span className="text-[10px] font-bold text-gray-400">TXHASH:</span>
                       <span className="text-[10px] font-mono text-green-700 bg-green-50 px-1 inline-block">{batch.txHash}</span>
                    </div>
                  )}
                  {batch.status === 'PROCESSING' && (
                    <div className="flex items-center gap-1 mt-0.5 text-[#1b5e20]">
                       <div className="w-3.5 h-3.5 border border-[#1b5e20] rounded flex items-center justify-center text-[10px] font-bold">Ξ</div>
                       <span className="text-[10px] font-bold">Vui lòng xác nhận trên ví Metamask của bạn</span>
                    </div>
                  )}
                  {batch.status === 'PENDING' && (
                    <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tighter">
                       Hệ thống đang chờ lệnh thực thi
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                 <span className={`font-heading font-bold text-[10px] tracking-widest uppercase ${
                    batch.status === 'SUCCESS' ? 'text-[#1b5e20]' :
                    batch.status === 'PROCESSING' ? 'text-black' :
                    'text-gray-400'
                 }`}>
                   {batch.status === 'SUCCESS' ? 'THÀNH CÔNG' :
                    batch.status === 'PROCESSING' ? 'ĐANG XỬ LÝ...' :
                    'ĐANG CHỜ'}
                 </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-[#f5f7f5] p-6 pt-10">
           <div className="flex gap-4 mb-4">
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b5e20] font-heading font-bold text-sm tracking-[0.2em] rounded border-none transition-colors cursor-pointer uppercase"
              >
                HỦY BỎ
              </button>
              <button 
                disabled={!isAllDone}
                className={`flex-1 py-4 font-heading font-bold text-sm tracking-[0.2em] rounded border-none transition-colors uppercase ${
                   isAllDone 
                   ? 'bg-black text-white hover:bg-gray-900 cursor-pointer shadow-md' 
                   : 'bg-gray-300 text-white cursor-not-allowed'
                }`}
              >
                HOÀN TẤT
              </button>
           </div>
           <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
             VUI LÒNG KHÔNG ĐÓNG CỬA SỔ NÀY CHO ĐẾN KHI TẤT CẢ CÁC LÔ ĐƯỢC XÁC NHẬN
           </p>
        </div>
      </div>
    </div>
  );
}
