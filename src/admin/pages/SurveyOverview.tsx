// src/admin/pages/SurveyOverview.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { getProject } from '@/lib/firebase/projects';
import { getSurvey, publishSurvey, closeSurvey, saveSurveyDraft } from '@/lib/firebase/surveys';
import { Project, Survey } from '@/types/survey';
import { 
  FileText, 
  Share2, 
  Database, 
  BarChart3, 
  Settings, 
  Send, 
  CheckCircle, 
  Lock, 
  ExternalLink, 
  Loader2, 
  ArrowLeft,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export interface SurveyOutletContext {
  project: Project;
  survey: Survey;
  refreshSurvey: () => Promise<void>;
}

export const SurveyOverview: React.FC = () => {
  const { projectId, surveyId } = useParams<{ projectId: string; surveyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error, info } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadData = async () => {
    if (!projectId || !surveyId) return;
    try {
      setLoading(true);
      const [p, s] = await Promise.all([
        getProject(projectId),
        getSurvey(projectId, surveyId)
      ]);
      setProject(p);
      setSurvey(s);
    } catch (err: any) {
      console.error(err);
      error('Lỗi khi tải thông tin khảo sát: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, surveyId]);

  // Handle Publish survey
  const handlePublish = async () => {
    if (!projectId || !surveyId) return;
    try {
      setPublishing(true);
      const nextVer = await publishSurvey(projectId, surveyId);
      success(`Đã xuất bản thành công phiên bản v${nextVer}! Khảo sát hiện đang mở cho người tham gia.`);
      await loadData();
    } catch (err: any) {
      error('Lỗi xuất bản: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Handle Close survey
  const handleClose = async () => {
    if (!projectId || !surveyId) return;
    if (!window.confirm('Bạn có chắc muốn đóng khảo sát? Người truy cập link công khai sẽ nhận thông báo khảo sát đã kết thúc.')) return;

    try {
      setPublishing(true);
      await closeSurvey(projectId, surveyId);
      info('Đã đóng khảo sát. Không nhận thêm phản hồi mới.');
      await loadData();
    } catch (err: any) {
      error('Lỗi đóng khảo sát: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Đang tải khảo sát...</p>
      </div>
    );
  }

  if (!project || !survey) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy khảo sát</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Khảo sát có thể đã bị xóa hoặc không thuộc dự án này.</p>
        <Link
          to={`/admin/projects/${projectId}`}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại dự án
        </Link>
      </div>
    );
  }

  // Active tab detection
  const currentTab = location.pathname.split('/').pop() || 'builder';

  const tabs = [
    { id: 'builder', label: 'Soạn câu hỏi', icon: FileText, path: 'builder' },
    { id: 'share', label: 'Chia sẻ', icon: Share2, path: 'share' },
    { id: 'data', label: 'Dữ liệu', icon: Database, path: 'data' },
    { id: 'analysis', label: 'Phân tích', icon: BarChart3, path: 'analysis' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: 'settings' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Survey Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                  {survey.title}
                </h1>
                
                {/* Status Badge */}
                {survey.status === 'open' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                    Đang mở
                  </span>
                ) : survey.status === 'closed' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <Lock className="w-3 h-3 mr-1 text-rose-600" />
                    Đã đóng
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Bản nháp
                  </span>
                )}

                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  v{survey.version}
                </span>

                <span className="text-xs text-slate-500 font-medium">
                  {survey.responseCount || 0} bài nộp
                </span>
              </div>

              {survey.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-1 max-w-3xl">
                  {survey.description}
                </p>
              )}
            </div>

            {/* Quick Actions (Publish, Close, View Public) */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              {survey.status === 'open' ? (
                <button
                  onClick={handleClose}
                  disabled={publishing}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  Đóng khảo sát
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  {publishing ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {survey.status === 'closed' ? 'Mở lại khảo sát' : 'Xuất bản công khai'}
                </button>
              )}

              {/* View Public Survey button */}
              <a
                href={`/s/${survey.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Mở giao diện người trả lời trong tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Xem trang công khai
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-slate-200 -mb-5 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={`/admin/projects/${projectId}/surveys/${survey.id}/${tab.path}`}
                  className={`inline-flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 bg-slate-50">
        <Outlet context={{ project, survey, refreshSurvey: loadData }} />
      </div>
    </div>
  );
};
