// src/admin/pages/SurveyShare.tsx
import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { SurveyOutletContext } from './SurveyOverview';
import { QRCodeCanvas } from 'qrcode.react';
import { publishSurvey, closeSurvey } from '@/lib/firebase/surveys';
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Share2, 
  QrCode, 
  Lock, 
  PlayCircle, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export const SurveyShare: React.FC = () => {
  const { project, survey, refreshSurvey } = useOutletContext<SurveyOutletContext>();
  const { success, error, info } = useToast();

  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate public link
  const origin = window.location.origin;
  const publicUrl = `${origin}/s/${survey.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    success('Đã sao chép đường link khảo sát vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_KhaoSat_${survey.id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    info('Đã tải xuống mã QR (PNG).');
  };

  const handleToggleStatus = async () => {
    try {
      setActionLoading(true);
      if (survey.status === 'open') {
        if (!window.confirm('Bạn có chắc muốn đóng khảo sát? Người truy cập link sẽ không thể nộp thêm bài.')) return;
        await closeSurvey(project.id, survey.id);
        info('Đã đóng khảo sát.');
      } else {
        await publishSurvey(project.id, survey.id);
        success('Đã mở khảo sát trực tuyến thành công!');
      }
      await refreshSurvey();
    } catch (err: any) {
      error('Lỗi khi đổi trạng thái khảo sát: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Status Alert Banner */}
      {survey.status === 'draft' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Khảo sát hiện đang ở trạng thái Bản nháp</h4>
            <p className="mt-0.5 text-xs text-amber-800">
              Người ngoài chưa thể truy cập link này. Hãy bấm nút <strong>"Xuất bản công khai"</strong> để bắt đầu nhận phản hồi nghiên cứu.
            </p>
          </div>
        </div>
      )}

      {survey.status === 'closed' && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 shadow-sm">
          <Lock className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Khảo sát đã đóng</h4>
            <p className="mt-0.5 text-xs text-rose-800">
              Link khảo sát hiện đang tạm khóa. Người truy cập sẽ nhận được thông báo kết thúc khảo sát.
            </p>
          </div>
        </div>
      )}

      {survey.status === 'open' && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Khảo sát đang mở công khai</h4>
            <p className="mt-0.5 text-xs text-emerald-800">
              Khảo sát đang sẵn sàng thu thập dữ liệu trực tuyến. Bạn có thể sao chép link hoặc gửi mã QR cho đối tượng nghiên cứu.
            </p>
          </div>
        </div>
      )}

      {/* Main Link & QR Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            Đường link truy cập khảo sát
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gửi đường dẫn này qua email, Zalo, mạng xã hội hoặc in mã QR lên phiếu khảo sát thực địa.
          </p>
        </div>

        {/* Copy Link Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 select-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-white" />
                Đã sao chép!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép link
              </>
            )}
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex-shrink-0"
            title="Mở tab mới"
          >
            <ExternalLink className="w-4 h-4 mr-1.5 text-slate-500" />
            Mở xem
          </a>
        </div>

        {/* QR Code Section */}
        <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center gap-8">
          <div 
            ref={qrRef}
            className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center flex-shrink-0"
          >
            <QRCodeCanvas
              value={publicUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-3 text-center md:text-left flex-1">
            <h3 className="font-bold text-slate-900 text-base flex items-center justify-center md:justify-start gap-2">
              <QrCode className="w-5 h-5 text-primary-600" />
              Mã QR khảo sát chất lượng cao
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mã QR tự động dẫn thẳng đến mẫu khảo sát trên mọi điện thoại thông minh (hỗ trợ cả camera quét mã mặc định và Zalo scanner). Tải ảnh về để dán vào poster hoặc slide thuyết trình.
            </p>

            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải ảnh QR Code (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics & Switch Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Số bài nộp hiện tại
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {survey.responseCount || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {survey.responseCount > 0 ? 'Dữ liệu đã sẵn sàng để phân tích' : 'Chưa có ai nộp câu trả lời'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Trạng thái tiếp nhận phản hồi
            </span>
            <div className="text-base font-bold text-slate-900 mt-1">
              {survey.status === 'open' ? 'Đang mở trực tuyến' : 'Đang tạm dừng'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {survey.status === 'open' ? 'Cho phép người dùng gửi bài' : 'Khóa link không nhận bài mới'}
            </p>
          </div>

          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`inline-flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-sm ${
              survey.status === 'open'
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : survey.status === 'open' ? (
              <Lock className="w-4 h-4 mr-1.5" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-1.5" />
            )}
            {survey.status === 'open' ? 'Đóng khảo sát' : 'Mở khảo sát ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};
