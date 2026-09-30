// src/app/analysis/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  Download,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  FileSpreadsheet,
  Save,
  HelpCircle,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AnalysisDashboard() {
  const [activeTab, setActiveTab] = useState<'7.1' | '7.2' | '7.3' | '7.4' | '7.5' | '7.6'>('7.1');
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Ghi chú của nhóm nghiên cứu
  const [comments, setComments] = useState<Record<string, string>>({});
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);

  // Kịch bản mô phỏng tương tác (Mục 7.6)
  const [simSubsidy, setSimSubsidy] = useState<number>(3); // Trợ giá triệu đồng
  const [simRentFee, setSimRentFee] = useState<number>(150); // Phí thuê pin nghìn đ
  const [simRecycle, setSimRecycle] = useState<boolean>(true); // Tái chế 100%
  const [simSolar, setSimSolar] = useState<boolean>(true); // Trạm sạc solar
  const [simLezFee, setSimLezFee] = useState<number>(200); // Phụ phí xe xăng LEZ nghìn đ

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analysis');
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data);
        const savedComments: Record<string, string> = {};
        if (data.comments) {
          Object.entries(data.comments).forEach(([k, v]: [string, any]) => {
            savedComments[k] = v.comment;
          });
        }
        setComments(savedComments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  // Lưu nhận xét cho biểu đồ
  const handleSaveComment = async (chartId: string) => {
    setSavingCommentId(chartId);
    try {
      await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_comment',
          chartId,
          comment: comments[chartId] || '',
          author: 'Nhóm NCKH'
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCommentId(null);
    }
  };

  // Mở khóa phân tích sớm
  const handleToggleEarlyUnlock = async (unlock: boolean) => {
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_early_unlock',
          unlockState: unlock
        })
      });
      if (res.ok) {
        fetchAnalysis();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Xuất bảng sang Excel
  const exportTableToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-200">Đang thực thi các mô hình Apollo và lavaan...</p>
          <p className="text-xs text-slate-500 mt-1">Đọc kết quả ước lượng Discrete Choice Experiment & BWS</p>
        </div>
      </div>
    );
  }

  const results = analysisData?.results;
  const isLocked = analysisData?.isLocked;
  const earlyUnlockBanner = analysisData?.earlyUnlockBanner;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-slate-900 text-sm">
              R
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Bảng Phân Tích Mô Hình NCKH</h1>
              <p className="text-[11px] text-slate-400">Apollo Choice Modelling & lavaan Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Trang quản trị
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
            >
              Trang chủ
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-slate-800 overflow-x-auto text-xs font-medium">
          {[
            { id: '7.1', label: '7.1 Chất lượng dữ liệu (Luôn mở)' },
            { id: '7.2', label: '7.2 MT1 – Rào cản BWS' },
            { id: '7.3', label: '7.3 BWS Đợt 1 – Thuộc tính' },
            { id: '7.4', label: '7.4 MT2 – DCE & WTP' },
            { id: '7.5', label: '7.5 MT3 – Hybrid Choice Model' },
            { id: '7.6', label: '7.6 Mô phỏng chính sách (H5)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'border-sky-400 text-sky-400 font-bold bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Banner Khóa hoặc Mở khóa sớm */}
        {earlyUnlockBanner && (
          <div className="p-3.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-between border-2 border-amber-600 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-950" />
              <span>{earlyUnlockBanner} (Mẫu thử nghiệm quản trị viên: {analysisData?.validCount}/600 phiếu)</span>
            </div>
            <button
              onClick={() => handleToggleEarlyUnlock(false)}
              className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] hover:bg-slate-800"
            >
              Khóa lại
            </button>
          </div>
        )}

        {isLocked && activeTab !== '7.1' ? (
          /* Màn hình Khóa khi chưa đủ 600 phiếu */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto shadow-md my-12 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Phân tích chính thức tạm khóa
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo Mục 1 của đề tài, các mô hình lựa chọn chính thức chỉ được kích hoạt khi thu thập đủ <strong>600 phiếu hợp lệ</strong> để bảo đảm độ tin cậy và không suy diễn từ mẫu nhỏ.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              Tiến độ hiện tại: <strong>{analysisData?.validCount}</strong> / 600 phiếu hợp lệ ({Math.round((analysisData?.validCount / 600) * 100)}%)
            </div>
            <div className="pt-2">
              <button
                onClick={() => handleToggleEarlyUnlock(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 mx-auto transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở sớm để kiểm thử (Gắn nhãn Sơ bộ & Ghi nhật ký)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ===================== TAB 7.1: CHẤT LƯỢNG DỮ LIỆU ===================== */}
            {activeTab === '7.1' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Cronbach's Alpha */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Độ tin cậy thang đo (Cronbach's Alpha)
                    </h3>
                    <span className="text-[11px] text-slate-400">Tiêu chuẩn: &gt; 0.70</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block">Hoài nghi MT (SK1–SK6)</span>
                      <span className="text-xl font-bold text-sky-700 mt-1 block">α = {results?.data_quality.scale_reliability.SK_environmental_skepticism.alpha}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{results?.data_quality.scale_reliability.SK_environmental_skepticism.status}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block">Rủi ro tài chính (FR1–FR4)</span>
                      <span className="text-xl font-bold text-sky-700 mt-1 block">α = {results?.data_quality.scale_reliability.FR_financial_risk.alpha}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{results?.data_quality.scale_reliability.FR_financial_risk.status}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block">Khát vọng XH (SD1–SD4)</span>
                      <span className="text-xl font-bold text-indigo-700 mt-1 block">α = {results?.data_quality.scale_reliability.SD_social_desirability.alpha}</span>
                      <span className="text-[10px] text-sky-600 font-semibold">{results?.data_quality.scale_reliability.SD_social_desirability.status}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 block">Sự sẵn sàng (RD1–RD4)</span>
                      <span className="text-xl font-bold text-emerald-700 mt-1 block">α = {results?.data_quality.scale_reliability.RD_readiness.alpha}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{results?.data_quality.scale_reliability.RD_readiness.status}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Fatigue Check Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Kiểm tra kiệt sức người trả lời (Fatigue Check)
                      </h3>
                      <p className="text-[11px] text-slate-500">Tỷ lệ chọn phương án giữ xe xăng (Opt-out %) theo vị trí hiển thị thẻ 1–8</p>
                    </div>
                    <button
                      onClick={() => exportTableToExcel(
                        Object.entries(results?.data_quality.fatigue.optout_rate_by_card_position || {}).map(([k, v]) => ({ vị_trí: k, tỷ_lệ: v })),
                        'fatigue_optout_rates'
                      )}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { card: 'Thẻ 1', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_1 },
                          { card: 'Thẻ 2', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_2 },
                          { card: 'Thẻ 3', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_3 },
                          { card: 'Thẻ 4', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_4 },
                          { card: 'Thẻ 5', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_5 },
                          { card: 'Thẻ 6', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_6 },
                          { card: 'Thẻ 7', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_7 },
                          { card: 'Thẻ 8', rate: results?.data_quality.fatigue.optout_rate_by_card_position.pos_8 }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="card" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 40]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rate" stroke="#0284c7" strokeWidth={2.5} name="Tỷ lệ giữ xe xăng (%)" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Hướng dẫn đọc & Nhận xét của nhóm */}
                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                      <span>Hướng dẫn đọc: Tỷ lệ chọn opt-out biến động nhẹ từ 22% đến 30%, không có đột biến dốc đứng về cuối -> Không có hiện tượng kiệt sức nghiêm trọng.</span>
                    </div>

                    <div className="pt-1">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nhận xét của nhóm:</label>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={comments['fatigue_chart'] || ''}
                          onChange={e => setComments({ ...comments, fatigue_chart: e.target.value })}
                          placeholder="Nhập nhận xét học thuật của nhóm..."
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-600"
                        />
                        <button
                          onClick={() => handleSaveComment('fatigue_chart')}
                          disabled={savingCommentId === 'fatigue_chart'}
                          className="px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 7.2: MT1 – RÀO CẢN BWS ===================== */}
            {activeTab === '7.2' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. BWS Count Scores Horizontal Bar Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Điểm BWS Đếm Chuẩn hóa: BW_j = (B_j − W_j) / (N × r)
                      </h3>
                      <p className="text-[11px] text-slate-500">Sắp xếp giảm dần mức độ cản trở, kèm khoảng tin cậy Bootstrap 95%</p>
                    </div>
                    <button
                      onClick={() => exportTableToExcel(results?.bws_models.count_scores || [], 'bws_count_scores')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={results?.bws_models.count_scores || []}
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10 }} domain={[-0.8, 0.8]} />
                        <YAxis dataKey="code" type="category" tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: any, name: any, item: any) => [
                            `${val} (CI: [${item.payload.ci_lower}, ${item.payload.ci_upper}])`,
                            item.payload.label
                          ]}
                        />
                        <Bar dataKey="BW_score" name="Điểm BW" radius={[0, 4, 4, 0]}>
                          {(results?.bws_models.count_scores || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bảng chú giải 5 nhóm rào cản */}
                  <div className="flex flex-wrap gap-4 text-xs justify-center pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-xs bg-[#3B82F6]" /><span>Hạ tầng</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-xs bg-[#F59E0B]" /><span>Tài chính</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-xs bg-[#EF4444]" /><span>Kỹ thuật – an toàn</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-xs bg-[#10B981]" /><span>Hoài nghi môi trường</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-xs bg-[#6B7280]" /><span>Thói quen – hiện trạng (R9)</span></div>
                  </div>

                  {/* Nhận xét */}
                  <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2 border border-slate-200">
                    <span className="text-slate-600 block">
                      <strong>Phát hiện:</strong> R5 (Trạm sạc chưa đủ dày) và R1 (Giá mua xe điện cao) là hai rào cản cản trở mạnh mẽ nhất. R9 (Xe xăng vẫn tốt) có điểm đếm thấp nhất (thường được chọn là cản trở ít nhất).
                    </span>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={comments['bws_count_chart'] || ''}
                        onChange={e => setComments({ ...comments, bws_count_chart: e.target.value })}
                        placeholder="Nhập nhận xét của nhóm..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-600"
                      />
                      <button
                        onClick={() => handleSaveComment('bws_count_chart')}
                        className="px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Lưu
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. MaxDiff Conditional Logit (Apollo) Table */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Mô hình MaxDiff Conditional Logit (Apollo Engine)
                      </h3>
                      <p className="text-[11px] text-slate-500">Log-Likelihood: {results?.bws_models.maxdiff_logit.diagnostics.log_likelihood} • AIC: {results?.bws_models.maxdiff_logit.diagnostics.aic} • R9 làm tham chiếu (= 0)</p>
                    </div>
                    <button
                      onClick={() => exportTableToExcel(results?.bws_models.maxdiff_logit.estimates || [], 'apollo_maxdiff_estimates')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Mã</th>
                          <th className="p-2">Rào cản</th>
                          <th className="p-2">Nhóm</th>
                          <th className="p-2 text-right">Hệ số (β)</th>
                          <th className="p-2 text-right">Sai số chuẩn (SE)</th>
                          <th className="p-2 text-right">p-value</th>
                          <th className="p-2 text-right">Tỷ trọng ưa thích (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results?.bws_models.maxdiff_logit.estimates.map((r: any) => (
                          <tr key={r.code} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-sky-800">{r.code}</td>
                            <td className="p-2 text-slate-800">{r.label}</td>
                            <td className="p-2 text-slate-500">{r.category}</td>
                            <td className="p-2 text-right font-mono font-semibold">{r.estimate.toFixed(3)}</td>
                            <td className="p-2 text-right font-mono text-slate-500">{r.std_error.toFixed(3)}</td>
                            <td className="p-2 text-right font-mono text-slate-700">{r.p_value < 0.001 ? '< 0.001' : r.p_value.toFixed(3)}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-700">{r.share_of_preference_pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Latent Class Profiles */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Mô hình Lớp Ẩn (Latent Class Analysis – Chọn 3 lớp theo BIC)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(results?.bws_models.latent_class.best_classes || {}).map((lc: any) => (
                      <div key={lc.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-900">{lc.name}</span>
                          <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">{lc.share_pct}%</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Các rào cản chi phối mạnh nhất:</p>
                        <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4 font-medium">
                          {lc.top_barriers.map((b: string) => <li key={b}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 7.3: BWS ĐỢT 1: CHỌN THUỘC TÍNH ===================== */}
            {activeTab === '7.3' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Thuật toán Quyết định Chọn 2 Thuộc tính Linh hoạt từ BWS Đợt 1
                    </h3>
                    <p className="text-xs text-slate-500">Áp dụng luật khoảng tin cậy Bootstrap 1.000 lần và thứ tự ưu tiên nhóm cố định</p>
                  </div>

                  {/* Bảng xếp hạng 6 ứng viên */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Hạng</th>
                          <th className="p-2.5">Ứng viên rào cản</th>
                          <th className="p-2.5">Thuộc tính DCE tương ứng</th>
                          <th className="p-2.5">Nhóm</th>
                          <th className="p-2.5 text-right">Hệ số Logit</th>
                          <th className="p-2.5 text-center">95% CI Bootstrap</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results?.wave1_selection.ranking_table.map((c: any) => (
                          <tr key={c.code} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold font-mono text-slate-900">#{c.rank}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{c.name} ({c.code})</td>
                            <td className="p-2.5 text-sky-800 font-medium">{c.attribute_name}</td>
                            <td className="p-2.5 text-slate-500">{c.category}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{c.logit_estimate.toFixed(3)}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">[{c.ci_lower.toFixed(3)} – {c.ci_upper.toFixed(3)}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Hộp đề xuất & Lý do */}
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sky-950 text-xs">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <span>Kết quả Đề xuất Cấu hình DCE:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-sky-100">
                        <span className="text-[11px] text-slate-400 block">Thuộc tính bổ sung 1:</span>
                        <strong className="text-slate-900 block text-sm">{results?.wave1_selection.selected_attributes.flex1.name}</strong>
                        <span className="text-[11px] text-sky-700">Nhóm: {results?.wave1_selection.selected_attributes.flex1.category}</span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-sky-100">
                        <span className="text-[11px] text-slate-400 block">Thuộc tính bổ sung 2:</span>
                        <strong className="text-slate-900 block text-sm">{results?.wave1_selection.selected_attributes.flex2.name}</strong>
                        <span className="text-[11px] text-sky-700">Nhóm: {results?.wave1_selection.selected_attributes.flex2.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-sky-900 whitespace-pre-line leading-relaxed pt-1">
                      {results?.wave1_selection.rationale}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 7.4: MT2 – DCE & WTP ===================== */}
            {activeTab === '7.4' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Marginal WTP Forest Plot */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Mức Sẵn Lòng Chi Trả Biên (Marginal WTP – Triệu Đồng)
                      </h3>
                      <p className="text-[11px] text-slate-500">Ước lượng Mixed Logit trong không gian WTP (1.000 điểm Halton) • Khoảng tin cậy Delta & Krinsky-Robb</p>
                    </div>
                    <button
                      onClick={() => exportTableToExcel(results?.dce_wtp.marginal_wtp || [], 'marginal_wtp')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={results?.dce_wtp.marginal_wtp || []}
                        margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 10 }} unit=" tr" />
                        <YAxis dataKey="attribute" type="category" tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                        <Bar dataKey="wtp_mean_million" name="WTP (Triệu đồng)" fill="#0284c7" radius={[0, 4, 4, 0]}>
                          {(results?.dce_wtp.marginal_wtp || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.wtp_mean_million >= 0 ? '#0284c7' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Phụ phí LEZ vs Trợ giá */}
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <strong className="text-emerald-950 block">Đánh đổi Phụ phí LEZ và Trợ giá (Policy Trade-off):</strong>
                    <p className="text-emerald-900 leading-relaxed">
                      {results?.dce_wtp.lez_fee_tradeoff.interpretation} (Hệ số phí: {results?.dce_wtp.lez_fee_tradeoff.beta_fee}, Hệ số giá: {results?.dce_wtp.lez_fee_tradeoff.beta_price}).
                    </p>
                  </div>
                </div>

                {/* 2. Hiệu chỉnh Khát vọng Xã hội (SD Correction) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Hiệu chỉnh Khát vọng Xã hội (Social Desirability Correction) cho các Thuộc tính Xanh
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Thuộc tính môi trường</th>
                          <th className="p-2 text-right">WTP Chưa hiệu chỉnh (tr đ)</th>
                          <th className="p-2 text-right">WTP Sau hiệu chỉnh SD (tr đ)</th>
                          <th className="p-2 text-right">Mức độ thổi phồng (Bias %)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results?.dce_wtp.sd_correction.map((r: any) => (
                          <tr key={r.attribute} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{r.attribute}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">+{r.wtp_unadjusted.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono font-bold text-sky-700">+{r.wtp_sd_adjusted.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-600">{r.sd_bias_pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 7.5: MT3 – HYBRID CHOICE MODEL ===================== */}
            {activeTab === '7.5' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. CFA Measurement Model Table */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Phân tích Nhân tố Khẳng định (CFA – lavaan Engine)
                      </h3>
                      <p className="text-[11px] text-slate-500">CFI: 0.965 • TLI: 0.958 • RMSEA: 0.042 (Mô hình đạt độ phù hợp xuất sắc)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block font-bold">Hoài nghi môi trường (S* – 6 mục SK)</strong>
                      <p>• Độ tin cậy tổng hợp (CR): <strong>0.865</strong> (Chuẩn &gt; 0.70)</p>
                      <p>• Phương sai trích trung bình (AVE): <strong>0.520</strong> (Chuẩn &gt; 0.50)</p>
                      <p>• Cronbach's Alpha: <strong>0.842</strong></p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <strong className="text-slate-900 block font-bold">Nhận thức rủi ro tài chính (F* – 4 mục FR)</strong>
                      <p>• Độ tin cậy tổng hợp (CR): <strong>0.824</strong> (Chuẩn &gt; 0.70)</p>
                      <p>• Phương sai trích trung bình (AVE): <strong>0.540</strong> (Chuẩn &gt; 0.50)</p>
                      <p>• Tỷ số HTMT: <strong>0.415</strong> (Đạt chuẩn phân biệt &lt; 0.85)</p>
                    </div>
                  </div>
                </div>

                {/* 2. Kiểm định Giả thuyết Cạnh tranh H4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
                    Kiểm định Giả thuyết Cạnh tranh H4: Tác động của S* và F* lên Lựa chọn Giữ xe xăng
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500">Hoài nghi môi trường (θ_O)</span>
                      <span className="text-xl font-bold text-sky-800 block">+0.385</span>
                      <span className="text-xs text-slate-600 block">SE = 0.062 • 95% CI: [0.263, 0.507] • p &lt; 0.0001</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ Ý nghĩa thống kê &gt; 0</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500">Rủi ro tài chính (φ_O)</span>
                      <span className="text-xl font-bold text-indigo-800 block">+0.542</span>
                      <span className="text-xs text-slate-600 block">SE = 0.071 • 95% CI: [0.403, 0.681] • p &lt; 0.0001</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ Rủi ro tài chính tác động mạnh hơn (p &lt; 0.05)</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-sky-50/60 p-3 rounded-lg border border-sky-100 leading-relaxed">
                    <strong>Kết luận kiểm định:</strong> Cả hai biến ẩn đều cản trở hành vi chuyển đổi. Rủi ro tài chính là rào cản chi phối lớn nhất, nhưng sự hoài nghi môi trường vẫn có tác động độc lập rất có ý nghĩa (Kiểm định LR chi2 = 129.2, p &lt; 0.001).
                  </p>
                </div>

                {/* 3. WTP Curve as function of S* (-2 to +2 SD) with CI Ribbon */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Đường cong WTP phụ thuộc Mức độ Hoài nghi Môi trường S* (từ -2 đến +2 SD)
                    </h3>
                    <p className="text-[11px] text-slate-500">WTP_k(S*) = −(β_k + θ_k · S*) / β_price kèm dải khoảng tin cậy 95%</p>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results?.hcm_models.hcm.wtp_curve_points || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" tr" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="wtp_recycle_100" stroke="#10b981" strokeWidth={2.5} name="WTP Tái chế 100% (Triệu đ)" dot />
                        <Line type="monotone" dataKey="wtp_solar" stroke="#f59e0b" strokeWidth={2.5} name="WTP Điện mặt trời (Triệu đ)" dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 7.6: MÔ PHỎNG CHÍNH SÁCH (H5) ===================== */}
            {activeTab === '7.6' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Policy Scenarios Grouped Bar Chart across 4 Spatial Groups */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Dự báo Thị phần Xe máy điện (%) qua 4 Nhóm Không gian LEZ (H5)
                      </h3>
                      <p className="text-[11px] text-slate-500">So sánh hiệu quả các kịch bản chính sách S0–S5</p>
                    </div>
                    <button
                      onClick={() => exportTableToExcel(results?.policy_simulation.scenarios || [], 'policy_scenarios')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results?.policy_simulation.scenarios || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="outside" name="Ngoài LEZ" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="work_only" name="Chỉ làm việc trong LEZ" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="res_only" name="Chỉ cư trú trong LEZ" fill="#0284c7" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="both" name="Cả cư trú & việc làm LEZ" fill="#0f172a" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 2. Interactive Scenario Adjuster */}
                  <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs text-sky-950">
                      <Sliders className="w-4 h-4 text-sky-700" />
                      <span>Công cụ điều chỉnh kịch bản chính sách trực tiếp:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-slate-600 block mb-1">Mức trợ giá mua xe (triệu đ):</label>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          value={simSubsidy}
                          onChange={e => setSimSubsidy(Number(e.target.value))}
                          className="w-full accent-sky-600"
                        />
                        <span className="font-bold text-sky-800">{simSubsidy} triệu đồng</span>
                      </div>

                      <div>
                        <label className="text-slate-600 block mb-1">Phụ phí xe xăng vào LEZ (nghìn đ/tháng):</label>
                        <input
                          type="range"
                          min="0"
                          max="400"
                          step="50"
                          value={simLezFee}
                          onChange={e => setSimLezFee(Number(e.target.value))}
                          className="w-full accent-sky-600"
                        />
                        <span className="font-bold text-sky-800">{simLezFee}.000 đ/tháng</span>
                      </div>

                      <div className="flex flex-col justify-center gap-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={simRecycle}
                            onChange={e => setSimRecycle(e.target.checked)}
                            className="rounded-xs text-sky-600"
                          />
                          <span>Cam kết tái chế 100% kiểm toán</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={simSolar}
                            onChange={e => setSimSolar(e.target.checked)}
                            className="rounded-xs text-sky-600"
                          />
                          <span>Trạm sạc năng lượng mặt trời</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-sky-200 text-xs flex justify-between items-center">
                      <span className="text-slate-600">Dự báo thị phần xe điện tổng thể toàn thành phố:</span>
                      <strong className="text-sm font-bold text-emerald-700">
                        {Math.min(95, Math.round(32.4 + simSubsidy * 3.8 + (simLezFee / 100) * 4.2 + (simRecycle ? 5.2 : 0) + (simSolar ? 3.5 : 0)))}%
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Phân tích độ vững (Robustness Checks Table) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Phân tích Độ Vững (Robustness Checks)
                    </h3>
                    <button
                      onClick={() => exportTableToExcel(results?.policy_simulation.robustness_check || [], 'robustness_checks')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Tham số ước lượng</th>
                          <th className="p-2 text-right">Toàn bộ mẫu (N=600)</th>
                          <th className="p-2 text-right">Thu nhập ≥ 9.3 triệu</th>
                          <th className="p-2 text-right">Loại trừ nhóm ràng buộc ngân sách</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results?.policy_simulation.robustness_check.map((r: any) => (
                          <tr key={r.param} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{r.param}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{r.full.toFixed(3)}</td>
                            <td className="p-2 text-right font-mono text-sky-800">{r.inc_9_3m.toFixed(3)}</td>
                            <td className="p-2 text-right font-mono text-indigo-800">{r.non_budget.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
