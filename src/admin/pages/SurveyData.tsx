// src/admin/pages/SurveyData.tsx (Placeholder for Phase 2 implementation)
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { SurveyOutletContext } from './SurveyOverview';
import { Database, Download, Filter, RefreshCw, Loader2 } from 'lucide-react';

export const SurveyData: React.FC = () => {
  const { project, survey } = useOutletContext<SurveyOutletContext>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <Database className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Quản lý Dữ liệu Phản hồi</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Xem bảng dữ liệu thô, lọc và gắn cờ loại trừ phản hồi không hợp lệ (speeder, straight-liner), và xuất dữ liệu sang CSV / Excel kèm Codebook.
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-primary-50 text-primary-700 rounded-lg">
          Tổng số phản hồi: {survey.responseCount || 0} bài nộp
        </div>
      </div>
    </div>
  );
};
