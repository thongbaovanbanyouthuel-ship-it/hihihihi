// src/admin/components/AdminNavbar.tsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, logoutAdmin } from '@/lib/firebase/auth';
import { GraduationCap, LogOut, FolderKanban, ChevronRight, User } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface AdminNavbarProps {
  projectName?: string;
  projectId?: string;
  surveyTitle?: string;
  surveyId?: string;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  projectName,
  projectId,
  surveyTitle,
  surveyId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { info } = useToast();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      info('Đã đăng xuất khỏi tài khoản quản trị.');
      navigate('/login');
    } catch (err: any) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Breadcrumb */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <Link 
              to="/admin/projects" 
              className="flex items-center space-x-2 text-primary-700 hover:text-primary-800 font-bold text-lg tracking-tight flex-shrink-0"
            >
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">NCKH Survey</span>
            </Link>

            {/* Breadcrumb Navigation */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 overflow-hidden pl-4 border-l border-slate-200">
              <Link 
                to="/admin/projects" 
                className="flex items-center hover:text-primary-700 transition-colors"
              >
                <FolderKanban className="w-4 h-4 mr-1 text-slate-400" />
                <span>Dự án</span>
              </Link>

              {projectId && projectName && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <Link 
                    to={`/admin/projects/${projectId}`}
                    className={`hover:text-primary-700 transition-colors truncate max-w-[180px] ${
                      !surveyId ? 'font-semibold text-slate-800' : ''
                    }`}
                    title={projectName}
                  >
                    {projectName}
                  </Link>
                </>
              )}

              {surveyId && surveyTitle && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span 
                    className="font-semibold text-primary-800 truncate max-w-[220px]"
                    title={surveyTitle}
                  >
                    {surveyTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-primary-600" />
              <span className="font-semibold tracking-wider">NCKH2627</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
