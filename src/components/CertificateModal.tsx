import { useRef, useState, useEffect } from 'react';
import type { Certificate } from '../types';
import { X, Printer, CloudUpload, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { uploadCertificateToIPFS, getCertificateIPFS } from '../services/ipfsService';

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export default function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parse date from DD/MM/YYYY or similar
  let day = '...', month = '...', year = '...';
  if (certificate.date) {
    const parts = certificate.date.split('/');
    if (parts.length === 3) {
      day = parts[0].padStart(2, '0');
      month = parts[1].padStart(2, '0');
      year = parts[2];
    } else {
      const d = new Date(certificate.date);
      if (!isNaN(d.getTime())) {
        day = String(d.getDate()).padStart(2, '0');
        month = String(d.getMonth() + 1).padStart(2, '0');
        year = String(d.getFullYear());
      }
    }
  }

  // Check if already uploaded on mount
  useEffect(() => {
    if (certificate.retirementId) {
      getCertificateIPFS(certificate.retirementId, certificate.id).then(setIpfsCid);
    }
  }, [certificate.retirementId, certificate.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleUploadIPFS = async () => {
    if (!certRef.current || !certificate.retirementId) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      // 1. Capture DOM as Blob
      const blob = await htmlToImage.toBlob(certRef.current, {
        pixelRatio: 2, // High quality
        backgroundColor: '#ffffff',
      });

      if (!blob) throw new Error('Could not capture certificate image');

      // 2. Upload to Pinata via Service
      const fileName = `Certificate-${certificate.id}.png`;
      const result = await uploadCertificateToIPFS(blob, fileName, certificate.retirementId);

      if (result.success && result.cid) {
        setIpfsCid(result.cid);
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block overflow-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; display: flex; align-items: center; justify-content: center; transform: scale(0.9); transform-origin: top left; }
          .no-print { display: none !important; }
        }
        
        .cert-container-html {
          font-family: Arial, Helvetica, sans-serif;
          background-color: #ffffff;
          width: 900px;
          height: 650px;
          border: 3px solid #000;
          position: relative;
          padding: 50px;
          box-sizing: border-box;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transform-origin: center;
          color: black;
        }

        @media (max-height: 700px) {
          .cert-container-html { transform: scale(0.85); margin-top: -30px; }
        }
        @media (max-width: 950px) {
          .cert-container-html { transform: scale(0.8); }
        }
        @media (max-width: 768px) {
          .cert-container-html { transform: scale(0.6); }
        }
        @media (max-width: 550px) {
          .cert-container-html { transform: scale(0.4); }
        }

        .cert-container-html .top-right-logo {
          position: absolute;
          top: 40px;
          right: 40px;
          border: 2px solid #000;
          padding: 2px 8px;
          display: flex;
          align-items: center;
          font-family: "Space Grotesk", sans-serif;
        }
        .cert-container-html .top-right-logo .carbon {
          font-weight: 700;
          font-size: 20px;
          margin-right: 4px;
        }
        .cert-container-html .top-right-logo .x-mark {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .cert-container-html .top-center-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 50px;
          margin-bottom: 30px;
        }
        .cert-container-html .top-center-logo .big-x {
          font-size: 70px;
          font-weight: 900;
          line-height: 1;
        }
        .cert-container-html .top-center-logo .divider {
          font-size: 50px;
          font-weight: 300;
          margin: 0 15px;
          color: #000;
        }
        .cert-container-html .top-center-logo .standard-text {
          font-size: 22px;
          font-weight: 700;
          text-align: left;
          line-height: 1.1;
          font-family: "Space Grotesk", sans-serif;
        }

        .cert-container-html .main-title {
          text-align: center;
          font-size: 26px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 25px;
          font-family: "Space Grotesk", sans-serif;
        }

        .cert-container-html .cert-text {
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          margin: 0 auto 30px auto;
          max-width: 700px;
        }

        .cert-container-html .sub-heading {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 30px;
        }

        .cert-container-html .details-section {
          margin-left: 60px;
          text-align: left;
        }
        .cert-container-html .detail-item {
          margin-bottom: 20px;
        }
        .cert-container-html .detail-label {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          display: block;
        }
        .cert-container-html .detail-value {
          font-size: 16px;
          margin-left: 40px;
          display: block;
        }
      `}</style>

      {/* Hành động (No Print) */}
      <div className="fixed top-4 right-4 flex flex-wrap justify-end gap-2 no-print z-[110]">
        {ipfsCid ? (
          <a
            href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-heading text-sm font-bold tracking-widest text-white shadow-md transition-all hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            XEM TRÊN IPFS
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <button
            onClick={handleUploadIPFS}
            disabled={isUploading}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-heading text-sm font-bold tracking-widest text-white shadow-md transition-all hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            LƯU IPFS
          </button>
        )}

        <button
          onClick={handlePrint}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-4 py-2 font-heading text-sm font-bold tracking-widest text-black shadow-md transition-all hover:bg-gray-100"
        >
          <Printer className="w-4 h-4" />
          IN CHỨNG CHỈ
        </button>
        
        <button
          onClick={onClose}
          className="flex cursor-pointer items-center justify-center rounded-md bg-black px-4 py-2 text-white shadow-md transition-all hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {uploadError && (
          <div className="w-full text-right mt-2">
            <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded">
              Lỗi: {uploadError}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung chứng chỉ */}
      <div className="print-area flex justify-center items-center w-full min-h-[650px] my-10">
        <div ref={certRef} className="cert-container-html shadow-2xl">
          <div className="top-right-logo">
            <span className="carbon">CARBON</span>
            <span className="x-mark">X</span>
          </div>

          <div className="top-center-logo">
            <div className="big-x">X</div>
            <div className="divider">|</div>
            <div className="standard-text">VERIFIED CARBON<br />STANDARD</div>
          </div>

          <div className="main-title">GIẤY CHỨNG NHẬN BÙ TRỪ CACBON</div>

          <div className="cert-text">
            <strong>CACBON X</strong> với tư cách là đơn vị quản lý, xin chứng nhận
            rằng vào<br />
            <em>
              ngày {day} tháng {month} năm {year}, {certificate.quantity.toLocaleString()} Đơn
              vị Carbon
            </em>
            {' '}đã được Kiểm định (VCUs) đã được tiêu hủy thành công:
          </div>

          <div className="sub-heading">Thông tin như sau</div>

          <div className="details-section">
            <div className="detail-item">
              <span className="detail-label">Tên dự án:</span>
              <span className="detail-value">{certificate.projectName}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Mã dự án:</span>
              <span className="detail-value">{certificate.projectCode}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Mã chứng chỉ:</span>
              <span className="detail-value">{certificate.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
