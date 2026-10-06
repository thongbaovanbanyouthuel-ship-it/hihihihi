// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import { AdminLogin } from '@/admin/pages/AdminLogin';
import { AdminLayout } from '@/admin/components/AdminLayout';
import { ProjectList } from '@/admin/pages/ProjectList';
import { ProjectDetail } from '@/admin/pages/ProjectDetail';
import { SurveyOverview } from '@/admin/pages/SurveyOverview';
import { SurveyBuilder } from '@/admin/pages/SurveyBuilder';
import { SurveyShare } from '@/admin/pages/SurveyShare';
import { SurveyData } from '@/admin/pages/SurveyData';
import { SurveyAnalysis } from '@/admin/pages/SurveyAnalysis';
import { SurveySettings } from '@/admin/pages/SurveySettings';
import { PublicSurveyPage } from '@/public/pages/PublicSurveyPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Survey Respondent Route (Clean, isolated, mobile-first) */}
          <Route path="/s/:surveyId" element={<PublicSurveyPage />} />

          {/* Admin Login Route */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/projects" replace />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            
            {/* Survey Context Hub */}
            <Route path="projects/:projectId/surveys/:surveyId" element={<SurveyOverview />}>
              <Route index element={<Navigate to="builder" replace />} />
              <Route path="builder" element={<SurveyBuilder />} />
              <Route path="share" element={<SurveyShare />} />
              <Route path="data" element={<SurveyData />} />
              <Route path="analysis" element={<SurveyAnalysis />} />
              <Route path="settings" element={<SurveySettings />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/admin/projects" replace />} />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404 - Không tìm thấy trang</h1>
                <p className="text-sm text-slate-500 mb-6">Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.</p>
                <a
                  href="/admin/projects"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
                >
                  Về trang quản trị
                </a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
