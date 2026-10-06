// src/admin/components/AdminLayout.tsx
import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/firebase/auth';
import { AdminNavbar } from './AdminNavbar';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  projectName?: string;
  surveyTitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  projectName,
  surveyTitle
}) => {
  const { user, loading } = useAuth();
  const { projectId, surveyId } = useParams<{ projectId?: string; surveyId?: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Đang tải hệ thống khảo sát NCKH...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AdminNavbar 
        projectId={projectId} 
        projectName={projectName} 
        surveyId={surveyId} 
        surveyTitle={surveyTitle} 
      />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};
