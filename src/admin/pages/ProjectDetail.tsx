// src/admin/pages/ProjectDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, updateProject } from '@/lib/firebase/projects';
import { getSurveys, createSurvey, deleteSurvey, cloneSurvey } from '@/lib/firebase/surveys';
import { Project, Survey } from '@/types/survey';
import { 
  FilePlus, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Copy, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Share2,
  BarChart3,
  Sliders,
  X
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit project info modal
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [editProjName, setEditProjName] = useState('');
  const [editProjDesc, setEditProjDesc] = useState('');

  const loadData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projData, surveysData] = await Promise.all([
        getProject(projectId),
        getSurveys(projectId)
      ]);
      setProject(projData);
      setSurveys(surveysData);
    } catch (err: any) {
      console.error(err);
      error('Lỗi khi tải thông tin dự án: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newSurveyTitle.trim()) return;

    try {
      setActionLoading(true);
      const surveyId = await createSurvey(projectId, {
        title: newSurveyTitle.trim(),
        description: newSurveyDesc.trim()
      });
      success('Tạo khảo sát mới thành công!');
      setShowCreateSurveyModal(false);
      navigate(`/admin/projects/${projectId}/surveys/${surveyId}/builder`);
    } catch (err: any) {
      error('Lỗi khi tạo khảo sát: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloneSurvey = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!window.confirm(`Bạn có chắc muốn nhân bản khảo sát "${survey.title}"? Cấu trúc câu hỏi sẽ được sao chép mới hoàn toàn.`)) return;

    try {
      setActionLoading(true);
      const newSurveyId = await cloneSurvey(projectId, survey.id);
      success('Nhân bản khảo sát thành công!');
      await loadData();
      navigate(`/admin/projects/${projectId}/surveys/${newSurveyId}/builder`);
    } catch (err: any) {
      error('Lỗi nhân bản khảo sát: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSurvey = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    if (!window.confirm(`CẢNH BÁO: Xóa vĩnh viễn khảo sát "${survey.title}" cùng toàn bộ dữ liệu phản hồi bên trong? Hành động này không thể hoàn tác!`)) return;

    try {
      setActionLoading(true);
      await deleteSurvey(projectId, survey.id);
      success('Đã xóa khảo sát thành công.');
      await loadData();
    } catch (err: any) {
      error('Lỗi khi xóa khảo sát: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProjectInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !editProjName.trim()) return;

    try {
      setActionLoading(true);
      await updateProject(projectId, { name: editProjName, description: editProjDesc });
      success('Đã cập nhật thông tin dự án!');
      setShowEditProjModal(false);
      await loadData();
    } catch (err: any) {
      error('Lỗi cập nhật: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Đang tải thông tin đề tài...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy dự án</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">Dự án này có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
        <Link
          to="/admin/projects"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách dự án
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Back button & Project Header */}
      <div className="mb-6">
        <Link
          to="/admin/projects"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Tất cả dự án
        </Link>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {project.name}
              </h1>
              <button
                onClick={() => {
                  setEditProjName(project.name);
                  setEditProjDesc(project.description);
                  setShowEditProjModal(true);
                }}
                className="p-1 text-slate-400 hover:text-primary-600 rounded transition-colors"
                title="Chỉnh sửa thông tin đề tài"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {project.description || 'Chưa có mô tả chi tiết cho đề tài này.'}
            </p>
          </div>

          <button
            onClick={() => {
              setNewSurveyTitle('');
              setNewSurveyDesc('');
              setShowCreateSurveyModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex-shrink-0"
          >
            <FilePlus className="w-4 h-4 mr-2" />
            Tạo khảo sát mới
          </button>
        </div>
      </div>

      {/* Surveys List Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Danh sách Mẫu khảo sát ({surveys.length})
          </h2>
        </div>

        {surveys.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3 text-primary-600">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Dự án chưa có mẫu khảo sát nào</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Tạo mẫu khảo sát đầu tiên để bắt đầu thiết kế bảng câu hỏi và thu thập dữ liệu nghiên cứu.
            </p>
            <button
              onClick={() => {
                setNewSurveyTitle('');
                setNewSurveyDesc('');
                setShowCreateSurveyModal(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              Tạo khảo sát đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => {
              const statusBadge = 
                survey.status === 'open' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
                    Đang mở
                  </span>
                ) : survey.status === 'closed' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    Đã đóng
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    Bản nháp
                  </span>
                );

              return (
                <div
                  key={survey.id}
                  onClick={() => navigate(`/admin/projects/${projectId}/surveys/${survey.id}/builder`)}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1 text-base">
                        {survey.title}
                      </h3>
                      {statusBadge}
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 h-10 mb-4">
                      {survey.description || 'Chưa có lời giới thiệu cho khảo sát này.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">v{survey.version}</span>
                      <span>{survey.questions?.length || 0} câu hỏi</span>
                      <span><strong>{survey.responseCount || 0}</strong> bài nộp</span>
                    </div>
                  </div>

                  {/* Survey Card Footer Navigation Links */}
                  <div 
                    className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/projects/${projectId}/surveys/${survey.id}/builder`}
                        className="hover:text-primary-700 font-medium"
                      >
                        Soạn câu hỏi
                      </Link>
                      <span>•</span>
                      <Link
                        to={`/admin/projects/${projectId}/surveys/${survey.id}/share`}
                        className="hover:text-primary-700 font-medium"
                      >
                        Chia sẻ
                      </Link>
                      <span>•</span>
                      <Link
                        to={`/admin/projects/${projectId}/surveys/${survey.id}/data`}
                        className="hover:text-primary-700 font-medium"
                      >
                        Dữ liệu
                      </Link>
                      <span>•</span>
                      <Link
                        to={`/admin/projects/${projectId}/surveys/${survey.id}/analysis`}
                        className="hover:text-primary-700 font-medium"
                      >
                        Phân tích
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleCloneSurvey(survey, e)}
                        className="p-1 hover:text-primary-600 rounded"
                        title="Nhân bản khảo sát"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSurvey(survey, e)}
                        className="p-1 hover:text-rose-600 rounded"
                        title="Xóa khảo sát"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create Survey */}
      {showCreateSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Tạo mẫu khảo sát mới
              </h3>
              <button
                onClick={() => setShowCreateSurveyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSurvey} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tiêu đề khảo sát <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSurveyTitle}
                  onChange={(e) => setNewSurveyTitle(e.target.value)}
                  placeholder="Ví dụ: Bảng khảo sát ý định mua xe máy điện của sinh viên"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Lời giới thiệu / Mục đích khảo sát
                </label>
                <textarea
                  rows={4}
                  value={newSurveyDesc}
                  onChange={(e) => setNewSurveyDesc(e.target.value)}
                  placeholder="Kính gửi quý anh/chị, bảng khảo sát này phục vụ nghiên cứu khoa học..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateSurveyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !newSurveyTitle.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Bắt đầu soạn thảo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Project Info */}
      {showEditProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Cập nhật thông tin đề tài
              </h3>
              <button
                onClick={() => setShowEditProjModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProjectInfo} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tên đề tài / Dự án <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProjName}
                  onChange={(e) => setEditProjName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mô tả / Thuyết minh đề tài
                </label>
                <textarea
                  rows={4}
                  value={editProjDesc}
                  onChange={(e) => setEditProjDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditProjModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !editProjName.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
