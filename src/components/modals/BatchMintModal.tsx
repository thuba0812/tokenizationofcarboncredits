import { useState, useEffect } from 'react';
import { RotateCw, Check, Hourglass } from 'lucide-react';
import { MintService } from '../../services/MintService';
import type { MintItem } from '../../services/MintService';

interface BatchInfo {
  id: number;
  items: MintItem[];
  range: string;
  status: 'SUCCESS' | 'PROCESSING' | 'PENDING' | 'ERROR';
  txHash?: string;
  message?: string;
}

interface BatchMintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchMintModal({ isOpen, onClose }: BatchMintModalProps) {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPendingMints();
    } else {
      setBatches([]);
      setTotalProjects(0);
      setIsMinting(false);
    }
  }, [isOpen]);

  const loadPendingMints = async () => {
    setLoading(true);
    try {
      const items = await MintService.getPendingMints();
      setTotalProjects(items.length);
      
      const BATCH_SIZE = 50;
      const newBatches: BatchInfo[] = [];
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batchItems = items.slice(i, i + BATCH_SIZE);
        newBatches.push({
          id: i / BATCH_SIZE + 1,
          items: batchItems,
          range: `${i + 1} - ${i + batchItems.length}`,
          status: 'PENDING',
          message: 'Hệ thống đang chờ lệnh thực thi'
        });
      }
      setBatches(newBatches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMinting = async () => {
    setIsMinting(true);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (batch.status === 'SUCCESS') continue;

      setBatches(prev => prev.map(b => b.id === batch.id ? { 
        ...b, status: 'PROCESSING', message: 'Vui lòng xác nhận trên ví Metamask của bạn' 
      } : b));

      try {
        const txHash = await MintService.executeMintBatch(batch.items);
        await MintService.updateMintsStatus(batch.items, txHash);

        setBatches(prev => prev.map(b => b.id === batch.id ? { 
          ...b, status: 'SUCCESS', txHash, message: undefined 
        } : b));
      } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'Lỗi giao dịch từ MetaMask';
        setBatches(prev => prev.map(b => b.id === batch.id ? { 
          ...b, status: 'ERROR', message: errorMessage 
        } : b));
        setIsMinting(false);
        return; 
      }
    }
    setIsMinting(false);
  };

  if (!isOpen) return null;

  const isAllDone = batches.length > 0 && batches.every(b => b.status === 'SUCCESS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="p-8 pt-10 flex flex-col items-center">
          <h2 className="font-heading font-bold text-3xl tracking-tight text-black mb-4 uppercase text-center">
            XÁC NHẬN PHÁT HÀNH TOKEN THEO LÔ
          </h2>
          <div className="text-center max-w-md">
            {loading ? (
              <p className="text-gray-600 text-sm leading-relaxed animate-pulse">Đang tìm kiếm dự án hợp lệ chờ phát hành...</p>
            ) : totalProjects === 0 ? (
              <p className="text-red-500 text-sm font-bold">Không có dự án nào đang chờ phát hành.</p>
            ) : (
              <>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Hệ thống đã chuẩn bị dữ liệu cho <span className="text-[#1b5e20] font-bold">{totalProjects} dự án</span> đã được phê duyệt.
                </p>
                <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-bold">
                  Để đảm bảo an toàn, danh sách được chia thành các lô giao dịch tối đa 50 token.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Batch List */}
        <div className="px-8 pb-8 space-y-3 max-h-[40vh] overflow-y-auto">
          {batches.map((batch) => (
            <div 
              key={batch.id}
              className={`relative flex items-center justify-between p-4 px-6 border rounded-lg transition-all duration-300 ${
                batch.status === 'SUCCESS' ? 'bg-[#f1f8f5] border-l-4 border-l-[#1b5e20] border-gray-100' :
                batch.status === 'PROCESSING' ? 'bg-white border-l-4 border-l-black border-gray-200 shadow-md scale-[1.02] z-10' :
                batch.status === 'ERROR' ? 'bg-red-50 border-l-4 border-l-red-500 border-gray-100' :
                'bg-[#f8f9fa] border-l-4 border-l-gray-300 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  batch.status === 'SUCCESS' ? 'bg-[#1b5e20] text-white' :
                  batch.status === 'PROCESSING' ? 'bg-black text-white' :
                  batch.status === 'ERROR' ? 'bg-red-500 text-white' :
                  'bg-[#e9ecef] text-gray-400'
                }`}>
                  {batch.status === 'SUCCESS' ? <Check className="w-5 h-5 stroke-[3px]" /> :
                   batch.status === 'PROCESSING' ? <RotateCw className="w-5 h-5 animate-spin" /> :
                   batch.status === 'ERROR' ? <span className="font-bold">!</span> :
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
                       <span className="text-[10px] font-mono text-green-700 bg-green-50 px-1 inline-block">{batch.txHash.slice(0, 15)}...</span>
                    </div>
                  )}
                  {batch.status === 'PROCESSING' && (
                    <div className="flex items-center gap-1 mt-0.5 text-[#1b5e20]">
                       <div className="w-3.5 h-3.5 border border-[#1b5e20] rounded flex items-center justify-center text-[10px] font-bold">Ξ</div>
                       <span className="text-[10px] font-bold">Vui lòng xác nhận trên ví Metamask của bạn</span>
                    </div>
                  )}
                  {batch.message && batch.status !== 'SUCCESS' && batch.status !== 'PROCESSING' && (
                    <div className={`text-[10px] uppercase font-bold tracking-tighter mt-0.5 ${
                      batch.status === 'ERROR' ? 'text-red-500' : 'text-gray-400'
                    }`}>
                       {batch.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                 <span className={`font-heading font-bold text-[10px] tracking-widest uppercase ${
                    batch.status === 'SUCCESS' ? 'text-[#1b5e20]' :
                    batch.status === 'PROCESSING' ? 'text-black' :
                    batch.status === 'ERROR' ? 'text-red-600' :
                    'text-gray-400'
                 }`}>
                   {batch.status === 'SUCCESS' ? 'THÀNH CÔNG' :
                    batch.status === 'PROCESSING' ? 'ĐANG XỬ LÝ...' :
                    batch.status === 'ERROR' ? 'THẤT BẠI' :
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
                disabled={isMinting}
                className="flex-1 py-4 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b5e20] font-heading font-bold text-sm tracking-[0.2em] rounded border-none transition-colors cursor-pointer uppercase disabled:opacity-50"
              >
                {isAllDone ? 'ĐÓNG' : 'HỦY BỎ'}
              </button>

              {!isAllDone && totalProjects > 0 ? (
                <button 
                  onClick={handleStartMinting}
                  disabled={isMinting || loading}
                  className="flex-1 py-4 font-heading font-bold text-sm tracking-[0.2em] rounded border-none transition-colors uppercase bg-black text-white hover:bg-gray-900 cursor-pointer shadow-md disabled:bg-gray-400"
                >
                  {isMinting ? 'ĐANG PHÁT HÀNH...' : 'BẮT ĐẦU PHÁT HÀNH'}
                </button>
              ) : (
                <button 
                  disabled
                  className="flex-1 py-4 font-heading font-bold text-sm tracking-[0.2em] rounded border-none transition-colors uppercase bg-gray-300 text-white cursor-not-allowed"
                >
                  HOÀN TẤT
                </button>
              )}
           </div>
           {!isAllDone && totalProjects > 0 && (
             <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
               VUI LÒNG KHÔNG ĐÓNG CỬA SỔ NÀY CHO ĐẾN KHI TẤT CẢ CÁC LÔ ĐƯỢC XÁC NHẬN
             </p>
           )}
        </div>
      </div>
    </div>
  );
}
