import { useRef, useEffect, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { uploadCertificateToIPFS, getCertificateIPFS } from '../services/ipfsService';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface IPFSAutoUploaderProps {
  retirementId: number;
  projectName: string;
  projectCode: string;
  certificateCode: string;
  quantity: number;
  date: string;
}

export default function IPFSAutoUploader({
  retirementId,
  projectName,
  projectCode,
  certificateCode,
  quantity,
  date
}: IPFSAutoUploaderProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processUpload = async () => {
      if (!certRef.current || !retirementId) return;
      
      try {
        // Check if already uploaded first
        const existingCid = await getCertificateIPFS(retirementId, certificateCode);
        if (existingCid) {
          setStatus('success');
          return;
        }

        setStatus('capturing');
        // Capture image
        const blob = await htmlToImage.toBlob(certRef.current, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });

        if (!blob) throw new Error('Capture failed');

        setStatus('uploading');
        const fileName = `Certificate-${certificateCode}.png`;
        const result = await uploadCertificateToIPFS(blob, fileName, retirementId);

        if (result.success) {
          setStatus('success');
        } else {
          setError(result.error || 'Upload failed');
          setStatus('error');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        setStatus('error');
      }
    };

    processUpload();
  }, [retirementId, certificateCode]);

  // Parse date
  let day = '...', month = '...', year = '...';
  if (date) {
    const parts = date.split('/');
    if (parts.length === 3) {
      day = parts[0].padStart(2, '0');
      month = parts[1].padStart(2, '0');
      year = parts[2];
    }
  }

  const certificateId = certificateCode;

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {status === 'capturing' || status === 'uploading' ? (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Chứng chỉ: {certificateId}</p>
          <p className="text-xs text-gray-500">
            {status === 'capturing' ? 'Đang tạo chứng chỉ...' : 
             status === 'uploading' ? 'Đang tải lên IPFS...' : 
             status === 'success' ? 'Đã lưu lên IPFS thành công' : 
             `Lỗi: ${error}`}
          </p>
        </div>
      </div>

      {/* Hidden Render Area for Capture */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        <div ref={certRef} className="cert-container-html">
          <style>{`
            .cert-container-html {
              font-family: Arial, Helvetica, sans-serif;
              background-color: #ffffff;
              width: 900px;
              height: 650px;
              border: 3px solid #000;
              position: relative;
              padding: 50px;
              box-sizing: border-box;
              color: black;
            }
            .cert-container-html .top-right-logo {
              position: absolute;
              top: 40px;
              right: 40px;
              border: 2px solid #000;
              padding: 2px 8px;
              display: flex;
              align-items: center;
            }
            .cert-container-html .top-right-logo .carbon { font-weight: 700; font-size: 20px; margin-right: 4px; }
            .cert-container-html .top-right-logo .x-mark { font-size: 32px; font-weight: 700; line-height: 1; }
            .cert-container-html .top-center-logo {
              display: flex; align-items: center; justify-content: center; margin-top: 50px; margin-bottom: 30px;
            }
            .cert-container-html .top-center-logo .big-x { font-size: 70px; font-weight: 900; line-height: 1; }
            .cert-container-html .top-center-logo .divider { font-size: 50px; font-weight: 300; margin: 0 15px; color: #000; }
            .cert-container-html .top-center-logo .standard-text { font-size: 22px; font-weight: 700; text-align: left; line-height: 1.1; }
            .cert-container-html .main-title { text-align: center; font-size: 26px; font-weight: 700; text-transform: uppercase; margin-bottom: 25px; }
            .cert-container-html .cert-text { text-align: center; font-size: 16px; line-height: 1.5; margin: 0 auto 30px auto; max-width: 700px; }
            .cert-container-html .sub-heading { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 30px; }
            .cert-container-html .details-section { margin-left: 60px; text-align: left; }
            .cert-container-html .detail-item { margin-bottom: 20px; }
            .cert-container-html .detail-label { font-weight: bold; font-size: 16px; margin-bottom: 8px; display: block; }
            .cert-container-html .detail-value { font-size: 16px; margin-left: 40px; display: block; }
          `}</style>
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
            <em>ngày {day} tháng {month} năm {year}, {quantity.toLocaleString()} Đơn vị Carbon</em>
            {' '}đã được Kiểm định (VCUs) đã được tiêu hủy thành công:
          </div>
          <div className="sub-heading">Thông tin như sau</div>
          <div className="details-section">
            <div className="detail-item">
              <span className="detail-label">Tên dự án:</span>
              <span className="detail-value">{projectName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mã dự án:</span>
              <span className="detail-value">{projectCode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mã chứng chỉ:</span>
              <span className="detail-value">{certificateId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
