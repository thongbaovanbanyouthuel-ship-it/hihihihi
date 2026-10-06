// src/admin/pages/AdminLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, createDefaultAdmin, useAuth } from '@/lib/firebase/auth';
import { GraduationCap, Lock, User, ArrowRight, AlertCircle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/Toast';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('NCKH2627');
  const [password, setPassword] = useState('NCKH2627');
  const [loading, setLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHelper, setShowHelper] = useState(false);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/admin/projects');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ tên tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await loginAdmin(username, password);
      success('Đăng nhập thành công!');
      navigate('/admin/projects');
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Tên tài khoản hoặc mật khẩu không chính xác, hoặc tài khoản chưa được kích hoạt trên Firebase.');
        setShowHelper(true);
      } else if (err.code === 'auth/wrong-password') {
        setErrorMessage('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Quá nhiều lần thử không thành công. Vui lòng thử lại sau vài phút.');
      } else {
        setErrorMessage(`Lỗi đăng nhập: ${err.message || 'Không thể kết nối đến máy chủ xác thực.'}`);
        setShowHelper(true);
      }
      toastError('Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitDefaultAdmin = async () => {
    setCreatingUser(true);
    try {
      await createDefaultAdmin();
      success('Đã kích hoạt tài khoản nckh2627@nckh-admin.app thành công! Hệ thống đang tự động đăng nhập...');
      navigate('/admin/projects');
    } catch (err: any) {
      console.error('Lỗi tạo tài khoản mẫu:', err);
      if (err.code === 'auth/email-already-in-use') {
        info('Tài khoản đã tồn tại trên Firebase Auth. Vui lòng nhập đúng mật khẩu NCKH2627.');
      } else {
        toastError(`Không thể tạo tài khoản: ${err.message}`);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Nền tảng Khảo sát NCKH
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Khu vực Quản trị Nghiên cứu & Phân tích Dữ liệu
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên tài khoản
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="NCKH2627"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tự động chuẩn hóa thành <span className="font-mono text-slate-600">{username.toLowerCase()}@nckh-admin.app</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Xác thực qua Firebase Auth
              </span>
              <button
                type="button"
                onClick={() => setShowHelper(!showHelper)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {showHelper ? 'Ẩn hướng dẫn' : 'Trợ giúp đăng nhập'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang xác thực...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  Đăng nhập Quản trị
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Setup Helper Card */}
          {showHelper && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Kích hoạt tài khoản lần đầu:
                </div>
                <p>
                  Nếu dự án Firebase của bạn chưa có user <code>nckh2627@nckh-admin.app</code>, bạn có thể bấm nút bên dưới để tạo ngay:
                </p>
                <button
                  type="button"
                  disabled={creatingUser}
                  onClick={handleInitDefaultAdmin}
                  className="w-full mt-2 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {creatingUser ? 'Đang tạo...' : '1-Click Kích hoạt Admin NCKH2627'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Dành riêng cho nhóm nghiên cứu & khảo sát khoa học NCKH 2026–2027.
        </p>
      </div>
    </div>
  );
};
