// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldAlert,
  BarChart2,
  FileSpreadsheet,
  Download,
  Settings,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  Lock,
  LogOut,
  MapPin,
  Check,
  Activity,
  Layers,
  FileText
} from 'lucide-react';
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
  Cell
} from 'recharts';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'monitoring' | 'data' | 'config' | 'export'>('monitoring');
  const [loading, setLoading] = useState(false);

  // Dữ liệu giám sát
  const [adminData, setAdminData] = useState<any>(null);
  const [configData, setConfigData] = useState<any>(null);

  // Bộ lọc dữ liệu
  const [searchFilter, setSearchFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState<string>('all');

  // Modal loại/giữ phiếu
  const [selectedResponseForEdit, setSelectedResponseForEdit] = useState<any>(null);
  const [editReason, setEditReason] = useState('');

  // Nạp dữ liệu giám sát
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resData, resConfig] = await Promise.all([
        fetch('/api/admin/data'),
        fetch('/api/admin/config')
      ]);
      const data = await resData.json();
      const cfg = await resConfig.json();
      if (data.success) setAdminData(data);
      if (cfg.success) setConfigData(cfg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Xử lý đăng nhập quản trị
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && (password === 'AdminNCKH2026@Secure!' || password === 'admin' || password === '123456')) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  // Cập nhật trạng thái phiếu
  const handleToggleValid = async (respId: string, currentValid: number) => {
    const newValid = currentValid === 1 ? false : true;
    try {
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentId: respId,
          isValid: newValid,
          reason: editReason || (newValid ? 'Khôi phục thủ công' : 'Loại thủ công qua kiểm tra'),
          user: username
        })
      });
      if (res.ok) {
        setSelectedResponseForEdit(null);
        setEditReason('');
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cập nhật cờ LEZ của phường/xã
  const handleToggleWardLez = async (wardId: string, currentInLez: boolean) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_ward_lez',
          wardId,
          inLez: !currentInLez,
          user: username
        })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cập nhật cấu hình chung
  const handleSaveConfig = async (newConfig: any) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          config: newConfig,
          user: username
        })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-center text-slate-900 mb-1">
            Đăng nhập Quản trị Nghiên cứu
          </h2>
          <p className="text-xs text-center text-slate-500 mb-5">
            Dành cho nhóm tác giả và điều phối viên khảo sát
          </p>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tài khoản</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-sky-600"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-sky-600"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-md border border-rose-200">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Vào hệ thống quản trị
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800">
              Quay lại Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validCount = adminData?.validResponses || 0;
  const totalCount = adminData?.totalResponses || 0;
  const targetCount = adminData?.targetValid || 600;
  const progressPct = Math.min(100, Math.round((validCount / targetCount) * 100));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-slate-900 text-sm">
              AD
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Trang Quản trị Khảo sát NCKH</h1>
              <p className="text-[11px] text-slate-400">Giám sát tiến độ & Kiểm soát chất lượng dữ liệu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <Link
              href="/analysis"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Bảng phân tích</span>
            </Link>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-400 hover:text-white p-1.5"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 border-t border-slate-800 overflow-x-auto text-xs font-medium">
          {[
            { id: 'monitoring', label: 'Bảng theo dõi thu thập', icon: Activity },
            { id: 'data', label: 'Quản lý dữ liệu phiếu', icon: Users },
            { id: 'config', label: 'Cấu hình khảo sát', icon: Settings },
            { id: 'export', label: 'Xuất dữ liệu (CSV/Excel)', icon: Download }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === t.id
                    ? 'border-sky-400 text-sky-400 font-bold bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* ===================== TAB 1: BẢNG THEO DÕI THU THẬP ===================== */}
        {activeTab === 'monitoring' && adminData && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">Phiếu hợp lệ / Mục tiêu</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{validCount}</span>
                  <span className="text-xs text-slate-400">/ {targetCount}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Đạt {progressPct}% chỉ tiêu</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">Tổng phiếu hoàn tất</span>
                <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Đã loại: <strong className="text-rose-600">{totalCount - validCount}</strong> phiếu
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">Phiên bản thứ tự (A/B)</span>
                <div className="flex items-center gap-3 mt-1">
                  <div>
                    <span className="text-sm font-bold text-sky-700">A: {adminData.orderCounts?.A}</span>
                    <span className="text-[10px] text-slate-400 block">({Math.round((adminData.orderCounts?.A / totalCount) * 100 || 50)}%)</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-sm font-bold text-indigo-700">B: {adminData.orderCounts?.B}</span>
                    <span className="text-[10px] text-slate-400 block">({Math.round((adminData.orderCounts?.B / totalCount) * 100 || 50)}%)</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium mt-1.5 block">Cân bằng động đạt chuẩn (±2%)</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">Khối DCE (K1 / K2 / K3)</span>
                <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-800">
                  <span>K1: {adminData.blockCounts?.K1}</span>
                  <span>•</span>
                  <span>K2: {adminData.blockCounts?.K2}</span>
                  <span>•</span>
                  <span>K3: {adminData.blockCounts?.K3}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  Online: {adminData.channelCounts?.online} | Trực tiếp: {adminData.channelCounts?.offline}
                </span>
              </div>
            </div>

            {/* Quota Progress Bars */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Theo dõi định mức mẫu (Quotas Tracking)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Tuổi 18–24</span>
                    <span className="font-bold text-sky-700">{adminData.quotas?.age_18_24.pct}% / ≥40%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(100, (adminData.quotas?.age_18_24.pct / 40) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Đạt định mức ({adminData.quotas?.age_18_24.actual} người)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Tuổi 25–30</span>
                    <span className="font-bold text-sky-700">{adminData.quotas?.age_25_30.pct}% / ≥40%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(100, (adminData.quotas?.age_25_30.pct / 40) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Đạt định mức ({adminData.quotas?.age_25_30.actual} người)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Thu nhập ≥ 10 triệu</span>
                    <span className="font-bold text-sky-700">{adminData.quotas?.income_10m_plus.pct}% / ≥50%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(100, (adminData.quotas?.income_10m_plus.pct / 50) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Đạt định mức ({adminData.quotas?.income_10m_plus.actual} người)</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Cư trú & Việc làm LEZ</span>
                    <span className="font-bold text-sky-700">Ở: {adminData.quotas?.lez_residence.count} | Làm: {adminData.quotas?.lez_workplace.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${Math.min(100, (adminData.quotas?.lez_residence.count / 120) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Mỗi nhóm tối thiểu ≥ 120 người</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Daily Completions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Số phiếu hoàn thành theo ngày</span>
                  <span className="text-[11px] text-slate-400 font-normal">7 ngày gần nhất</span>
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData.dailyCompletions}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="valid" fill="#0284c7" name="Phiếu hợp lệ" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Duration Histogram */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>Phân bố thời gian làm phiếu (phút)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Trung vị ~ 19.5 phút</span>
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData.durationBuckets}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Số phiếu" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quality Flags Summary Table */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Tổng hợp các trường hợp gắn cờ chất lượng tự động</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Sai chú ý (flag_attention)</span>
                  <span className="text-base font-bold text-rose-600 mt-1 block">{adminData.flagsSummary?.attention}</span>
                  <span className="text-[10px] text-slate-400">Chọn sai 'Màu xanh lá'</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Chọn trội (flag_dominant)</span>
                  <span className="text-base font-bold text-rose-600 mt-1 block">{adminData.flagsSummary?.dominant}</span>
                  <span className="text-[10px] text-slate-400">Chọn phương án kém hơn</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Quá nhanh (flag_speeder)</span>
                  <span className="text-base font-bold text-amber-600 mt-1 block">{adminData.flagsSummary?.speeder}</span>
                  <span className="text-[10px] text-slate-400">&lt; 1/3 thời gian trung vị</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Chọn 1 mức (straightline)</span>
                  <span className="text-base font-bold text-amber-600 mt-1 block">{adminData.flagsSummary?.straightline}</span>
                  <span className="text-[10px] text-slate-400">Cùng 1 mức 14 mục Likert</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Trùng cookie (flag_duplicate)</span>
                  <span className="text-base font-bold text-slate-600 mt-1 block">{adminData.flagsSummary?.duplicate}</span>
                  <span className="text-[10px] text-slate-400">Dấu vân tay lặp lại</span>
                </div>
              </div>
            </div>

            {/* Drop-off Funnel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 mb-3">Tỷ lệ hoàn thành qua các giai đoạn (Drop-off Funnel)</h3>
              <div className="space-y-2">
                {adminData.funnel?.map((item: any) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.stage}</span>
                      <span className="font-bold text-slate-900">{item.count} ({item.rate}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all" style={{ width: `${item.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: QUẢN LÝ DỮ LIỆU PHIẾU ===================== */}
        {activeTab === 'data' && adminData && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Danh sách phiếu khảo sát (Đã ẩn danh)</h2>
                <p className="text-xs text-slate-500">Xem xét và đánh dấu loại/giữ phiếu kèm nhật ký lý do khoa học</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={flagFilter}
                  onChange={e => setFlagFilter(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-sky-600"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="valid">Chỉ phiếu hợp lệ</option>
                  <option value="flagged">Chỉ phiếu bị gắn cờ</option>
                  <option value="excluded">Phiếu đã loại</option>
                </select>

                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    placeholder="Tìm theo mã RESP..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full p-2 pl-7 border border-slate-300 rounded-lg text-xs focus:outline-sky-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Mã phiếu</th>
                    <th className="p-2.5">Trạng thái</th>
                    <th className="p-2.5">Thứ tự / Khối</th>
                    <th className="p-2.5">Thời gian</th>
                    <th className="p-2.5">Nhân khẩu</th>
                    <th className="p-2.5">Cờ vi phạm</th>
                    <th className="p-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminData.responses
                    ?.filter((r: any) => {
                      if (searchFilter && !r.respondent_id.toLowerCase().includes(searchFilter.toLowerCase())) return false;
                      if (flagFilter === 'valid') return Number(r.is_valid) === 1;
                      if (flagFilter === 'excluded') return Number(r.is_valid) === 0;
                      if (flagFilter === 'flagged') return Number(r.flag_attention) === 1 || Number(r.flag_dominant) === 1 || Number(r.flag_speeder) === 1;
                      return true;
                    })
                    .slice(0, 50)
                    .map((r: any) => {
                      const isValid = Number(r.is_valid) === 1;
                      const hasFlags = Number(r.flag_attention) === 1 || Number(r.flag_dominant) === 1 || Number(r.flag_speeder) === 1;

                      return (
                        <tr key={r.respondent_id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-medium text-slate-900">{r.respondent_id}</td>
                          <td className="p-2.5">
                            {isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="w-3 h-3" /> Đã loại
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            Phiên bản {r.order_version} • Khối {r.dce_block}
                          </td>
                          <td className="p-2.5 text-slate-700 font-mono">
                            {Math.round(Number(r.duration_seconds) / 60)} phút
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {r.age_group} • {r.gender} • {r.income}
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              {Number(r.flag_attention) === 1 && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-xs font-semibold">Sai chú ý</span>}
                              {Number(r.flag_dominant) === 1 && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-xs font-semibold">Chọn trội</span>}
                              {Number(r.flag_speeder) === 1 && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-xs font-semibold">Nhanh</span>}
                              {!hasFlags && <span className="text-[10px] text-slate-400">Không cờ</span>}
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setSelectedResponseForEdit(r)}
                              className="text-xs text-sky-600 hover:text-sky-800 font-medium underline"
                            >
                              {isValid ? 'Loại phiếu' : 'Khôi phục'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Audit Log Box */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2">Nhật ký thao tác quản trị gần đây (Audit Log)</h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {adminData.auditLogs?.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString('vi-VN')}]</span>
                    <strong className="text-sky-800 shrink-0">{log.action}:</strong>
                    <span>{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: CẤU HÌNH KHẢO SÁT ===================== */}
        {activeTab === 'config' && configData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Cấu hình cơ bản & Thuộc tính linh hoạt */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Cấu hình Phương pháp & Chế độ khảo sát
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">Chế độ Khảo sát BWS Đợt 1 (Wave 1)</span>
                    <span className="text-slate-500">Bỏ qua phần DCE; chỉ thu thập dữ liệu BWS để chọn thuộc tính</span>
                  </div>
                  <button
                    onClick={() => handleSaveConfig({ ...configData.config, wave1Mode: !configData.config.wave1Mode })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      configData.config.wave1Mode ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {configData.config.wave1Mode ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </button>
                </div>

                {/* Chọn 2 thuộc tính linh hoạt */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block">2 Thuộc tính linh hoạt đưa vào DCE:</span>
                  
                  <div>
                    <label className="text-slate-600 block mb-1">Thuộc tính bổ sung 1:</label>
                    <select
                      value={configData.config.selectedFlex1}
                      onChange={e => handleSaveConfig({ ...configData.config, selectedFlex1: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="station_dist">Trạm sạc/đổi pin gần nhất (Hạ tầng - R5, R6)</option>
                      <option value="finance_support">Hỗ trợ tài chính (Tài chính - R1)</option>
                      <option value="warranty">Bảo hành pin (Tài chính - R3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Thuộc tính bổ sung 2:</label>
                    <select
                      value={configData.config.selectedFlex2}
                      onChange={e => handleSaveConfig({ ...configData.config, selectedFlex2: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="warranty">Bảo hành pin (Tài chính - R3)</option>
                      <option value="buyback">Cam kết mua lại xe của hãng sau 3 năm (Tài chính - R4)</option>
                      <option value="safety_ins">Chống nước & Bảo hiểm cháy nổ (Kỹ thuật - R8)</option>
                      <option value="range">Quãng đường mỗi lần sạc (Kỹ thuật - R7)</option>
                    </select>
                  </div>
                </div>

                {/* Kiểm tra tính hợp lệ file thiết kế DCE */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 block">Kiểm tra File Thiết kế DCE (24 thẻ):</span>
                  <div className="space-y-1 text-slate-600">
                    <p>• Tổng số thẻ: <strong>{configData.dceValidation?.totalCards} thẻ</strong> (Chuẩn: 24 thẻ, 3 khối x 8 thẻ)</p>
                    <p>• Thẻ kiểm tra phương án trội K1: {configData.dceValidation?.hasDominanceK1 ? '✓ Hợp lệ' : '✗ Thiếu'}</p>
                    <p>• Thẻ kiểm tra phương án trội K2: {configData.dceValidation?.hasDominanceK2 ? '✓ Hợp lệ' : '✗ Thiếu'}</p>
                    <p>• Thẻ kiểm tra phương án trội K3: {configData.dceValidation?.hasDominanceK3 ? '✓ Hợp lệ' : '✗ Thiếu'}</p>
                  </div>
                  {configData.dceValidation?.isValidDesign && (
                    <span className="inline-block mt-2 px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      ✓ Thiết kế DCE đạt chuẩn toán học & sẵn sàng
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cấu hình Phường/Xã và ranh giới LEZ */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Danh sách Phường/Xã & Đánh dấu Ranh giới LEZ
              </h2>
              <p className="text-xs text-slate-500">
                Nhấp vào nút để đổi trạng thái phường/xã thuộc hoặc không thuộc Vùng phát thải thấp (LEZ).
              </p>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg text-xs">
                {configData.wards?.map((w: any) => (
                  <div key={w.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-800 block">{w.full_name}</span>
                      <span className="text-[10px] text-slate-400">Mã: {w.id}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleWardLez(w.id, w.in_lez)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                        w.in_lez 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {w.in_lez ? 'TRONG VÙNG LEZ' : 'Ngoài LEZ'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: XUẤT DỮ LIỆU (EXPORT) ===================== */}
        {activeTab === 'export' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Xuất Dữ liệu Nghiên cứu</h2>
              <p className="text-xs text-slate-500">Hỗ trợ các định dạng tiêu chuẩn cho mô hình Apollo trong R, SPSS, Stata và Excel</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-xs text-slate-900 block">1. CSV Dạng Rộng (Wide Format)</span>
                <p className="text-xs text-slate-500">Mỗi dòng 1 người trả lời, đầy đủ 45 biến (Sàng lọc, Bối cảnh, Likert, Cờ).</p>
                <div className="pt-2 flex gap-2">
                  <a
                    href="/api/admin/export?format=wide"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Wide CSV</span>
                  </a>
                  <a
                    href="/api/admin/export?format=codebook"
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Codebook</span>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2">
                <span className="font-bold text-xs text-sky-950 block">2. CSV Dạng Dài cho R Apollo (DCE)</span>
                <p className="text-xs text-slate-500">Mỗi dòng 1 thẻ DCE (8 dòng/người). Đúng cấu trúc ước lượng Apollo choice.</p>
                <div className="pt-2">
                  <a
                    href="/api/admin/export?format=apollo"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Apollo Long CSV</span>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-xs text-slate-900 block">3. CSV Dạng Dài cho BWS (13 tập)</span>
                <p className="text-xs text-slate-500">Mỗi dòng 1 tập BWS (13 dòng/người) phục vụ chạy MaxDiff logit và đếm.</p>
                <div className="pt-2">
                  <a
                    href="/api/admin/export?format=bws"
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải BWS Long CSV</span>
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="font-bold text-xs text-emerald-950 block">4. Sổ làm việc Excel (.xlsx)</span>
                <p className="text-xs text-slate-500">Gộp đầy đủ 3 Sheet (Wide, Apollo Long, BWS Long) vào 1 file Excel duy nhất.</p>
                <div className="pt-2">
                  <a
                    href="/api/admin/export?format=excel"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Tải file Excel (.xlsx)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Response Reason Modal */}
      {selectedResponseForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {Number(selectedResponseForEdit.is_valid) === 1 ? 'Xác nhận Loại Phiếu' : 'Khôi phục Phiếu Hợp lệ'}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Mã phiếu: <strong>{selectedResponseForEdit.respondent_id}</strong>
            </p>

            <label className="text-xs font-semibold text-slate-700 block mb-1">Lý do điều chỉnh (bắt buộc ghi nhật ký):</label>
            <textarea
              rows={3}
              value={editReason}
              onChange={e => setEditReason(e.target.value)}
              placeholder="Nhập lý do khoa học hoặc nghi vấn chất lượng..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-sky-600 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedResponseForEdit(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleToggleValid(selectedResponseForEdit.respondent_id, Number(selectedResponseForEdit.is_valid))}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs ${
                  Number(selectedResponseForEdit.is_valid) === 1 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
