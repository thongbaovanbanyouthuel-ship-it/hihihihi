// src/admin/pages/SurveyAnalysis.tsx (Placeholder for Phase 3 implementation)
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { SurveyOutletContext } from './SurveyOverview';
import { BarChart3, LineChart, PieChart, Sparkles } from 'lucide-react';

export const SurveyAnalysis: React.FC = () => {
  const { project, survey } = useOutletContext<SurveyOutletContext>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <BarChart3 className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Phân tích Thống kê & Kinh tế lượng</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Thống kê mô tả, Cronbach's Alpha, Phân tích nhân tố khám phá (EFA), Tương quan Pearson, Mô hình Hồi quy tuyến tính bội (OLS) và Kiểm định So sánh nhóm (t-test / ANOVA).
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Sẵn sàng kết nối công cụ tính toán thống kê (ml-matrix, simple-statistics, jstat)
        </div>
      </div>
    </div>
  );
};
