// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Tablet, 
  Settings, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Sparkles,
  Award
} from 'lucide-react';

export default function HomePage() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
              EV
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">NCKH Giao thông Xanh TP.HCM</h1>
              <p className="text-xs text-slate-500">Mô hình Lựa chọn Rời rạc BWS – DCE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-medium text-slate-600 hover:text-sky-600 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Quản trị</span>
            </Link>
            <Link
              href="/analysis"
              className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-md border border-sky-200 transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Phân tích</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-8 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-medium mx-auto mb-4">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Hệ thống Khảo sát & Phân tích Độc lập NCKH</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug sm:leading-tight mb-4">
          Nghiên cứu sự sẵn sàng chuyển đổi sang xe máy điện của người trẻ tại TP.HCM
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Góc nhìn từ sự hoài nghi môi trường, rào cản chi phí và các đánh đổi thực nghiệm 
          theo phương pháp <strong>Best-Worst Scaling (BWS)</strong> và <strong>Discrete Choice Experiment (DCE)</strong>.
        </p>

        {/* Survey Entry CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full mb-8">
          <Link
            href="/survey"
            className="flex flex-col items-center justify-center p-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md hover:shadow-lg transition-all group border border-sky-500"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base">Bắt đầu Khảo sát</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="text-xs text-sky-100">Dành cho người trả lời trực tuyến (18–30 tuổi)</span>
          </Link>

          <Link
            href="/survey?ch=offline"
            className="flex flex-col items-center justify-center p-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-sm hover:shadow border border-slate-300 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Tablet className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-base">Chế độ Tablet Khảo sát</span>
            </div>
            <span className="text-xs text-slate-500">Phỏng vấn trực tiếp tại hiện trường (?ch=offline)</span>
          </Link>
        </div>

        {/* Secondary Navigation Options */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
          <Link
            href="/survey?wave=1"
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Khảo sát Đợt 1 (Chỉ làm BWS - Wave 1)</span>
          </Link>

          <Link
            href="/analysis"
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Xem Báo cáo Mô hình (Apollo & lavaan)</span>
          </Link>

          <button
            onClick={() => setShowPrivacyModal(true)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Chính sách Dữ liệu & Đạo đức</span>
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Toán học BIBD Cân bằng</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Thiết kế 13 tập BWS từ tập sai phân hoán vị (v=13, k=4, r=4, λ=1). Mỗi rào cản xuất hiện đúng 4 lần, mỗi cặp gặp nhau đúng 1 lần.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <Award className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Chuẩn mực Apollo Choice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mô hình Mixed Logit trong không gian WTP (1.000 điểm Halton) và Hybrid Choice Model với hai biến ẩn cạnh tranh (S* và F*).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Ẩn danh & Phi PII</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Không thu thập họ tên, điện thoại hay địa chỉ. Email quay thưởng được lưu trong bảng riêng, hoàn toàn không có khóa liên kết dữ liệu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 text-xs py-4 px-4 text-center border-t border-slate-800">
        <p>© 2026 Nhóm Nghiên cứu Khoa học Giao thông Đô thị TP.HCM. Tất cả quyền được bảo lưu.</p>
        <p className="mt-1 text-slate-500">Mục đích học thuật phi thương mại tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.</p>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-sky-700">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Chính sách Dữ liệu & Đạo đức NCKH</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <p><strong>1. Mục đích nghiên cứu:</strong> Khảo sát nhằm phục vụ đề tài nghiên cứu khoa học cấp cơ sở về hành vi chuyển đổi phương tiện giao thông cá nhân của người trẻ tại TP.HCM.</p>
              <p><strong>2. Nguyên tắc ẩn danh:</strong> Chúng tôi hoàn toàn KHÔNG thu thập bất kỳ thông tin nhận dạng cá nhân nào (Họ tên, Số điện thoại, CCCD, Địa chỉ nhà cụ thể). Dữ liệu chỉ ghi nhận lựa chọn thực nghiệm và đặc điểm nhân khẩu nhóm.</p>
              <p><strong>3. Rút thăm quà tặng:</strong> Địa chỉ email tham gia quay thưởng quà tặng lưu niệm được lưu trữ trong một cơ sở dữ liệu hoàn toàn tách rời, không có khóa ngoại (foreign key) hay bất kỳ mối liên hệ nào với câu trả lời khảo sát.</p>
              <p><strong>4. Quyền tự nguyện:</strong> Người tham gia có quyền tạm dừng hoặc rời khỏi khảo sát bất kỳ lúc nào trước khi bấm nút Gửi phiếu chính thức.</p>
              <p><strong>5. Thời gian lưu trữ:</strong> Dữ liệu thô ẩn danh được bảo vệ trong máy chủ nội bộ và tiêu hủy sau khi hoàn tất công bố công trình NCKH.</p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Đã hiểu và Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
