// src/admin/pages/ProjectList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  archiveProject, 
  deleteProject, 
  cloneProject 
} from '@/lib/firebase/projects';
import { seedDemoData } from '@/lib/firebase/seedData';
import { Project } from '@/types/survey';
import { 
  FolderPlus, 
  Search, 
  Archive, 
  Trash2, 
  Edit3, 
  Copy, 
  Database, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  Loader2, 
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  X
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'archived' | 'all'>('active');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Form input state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const fetchProjectsList = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error(err);
      error('Không thể tải danh sách dự án: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsList();
  }, []);

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormDesc('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setFormName(proj.name);
    setFormDesc(proj.description);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setActionLoading(true);
      if (editingProject) {
        await updateProject(editingProject.id, { name: formName, description: formDesc });
        success('Đã cập nhật dự án thành công!');
        setEditingProject(null);
      } else {
        const newId = await createProject(formName, formDesc);
        success('Đã tạo dự án mới thành công!');
        setShowCreateModal(false);
        navigate(`/admin/projects/${newId}`);
        return;
      }
      await fetchProjectsList();
    } catch (err: any) {
      error('Lỗi khi lưu dự án: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleArchive = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = !proj.archived;
      await archiveProject(proj.id, nextStatus);
      info(nextStatus ? `Đã lưu trữ dự án "${proj.name}"` : `Đã bỏ lưu trữ dự án "${proj.name}"`);
      await fetchProjectsList();
    } catch (err: any) {
      error('Lỗi: ' + err.message);
    }
  };

  const handleClone = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc muốn nhân bản dự án "${proj.name}" không? Toàn bộ khảo sát và câu hỏi sẽ được sao chép (không kèm dữ liệu trả lời).`)) return;

    try {
      setActionLoading(true);
      const newId = await cloneProject(proj.id);
      success('Nhân bản dự án thành công!');
      await fetchProjectsList();
      navigate(`/admin/projects/${newId}`);
    } catch (err: any) {
      error('Lỗi nhân bản: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    if (deleteConfirmName !== deletingProject.name) {
      error('Tên dự án xác nhận không khớp.');
      return;
    }

    try {
      setActionLoading(true);
      await deleteProject(deletingProject.id);
      success(`Đã xóa vĩnh viễn dự án "${deletingProject.name}" cùng toàn bộ dữ liệu khảo sát.`);
      setDeletingProject(null);
      setDeleteConfirmName('');
      await fetchProjectsList();
    } catch (err: any) {
      error('Lỗi xóa dự án: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    if (!window.confirm('Khởi tạo dự án mẫu "Nghiên cứu Chấp nhận Công nghệ (TAM / UTAUT)" với 4 thang đo và 200 phản hồi giả lập chân thực?')) return;

    try {
      setSeedingLoading(true);
      const result = await seedDemoData();
      success('Đã khởi tạo dự án mẫu thành công với 200 phản hồi chân thực!');
      await fetchProjectsList();
      navigate(`/admin/projects/${result.projectId}/surveys/${result.surveyId}/analysis`);
    } catch (err: any) {
      error('Lỗi khởi tạo dữ liệu mẫu: ' + err.message);
    } finally {
      setSeedingLoading(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterTab === 'active') return !p.archived;
    if (filterTab === 'archived') return p.archived;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Dự án Nghiên cứu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mỗi dự án chứa các khảo sát và bộ dữ liệu độc lập phục vụ đề tài khoa học.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSeedDemo}
            disabled={seedingLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-sm transition-colors"
            title="Tạo dự án mẫu TAM có 4 thang đo và 200 quan sát để thử nghiệm phân tích thống kê"
          >
            {seedingLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-amber-600" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
            )}
            Dữ liệu mẫu (Demo TAM)
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Tạo dự án mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        {/* Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-lg self-start">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterTab === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang hoạt động ({projects.filter((p) => !p.archived).length})
          </button>
          <button
            onClick={() => setFilterTab('archived')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterTab === 'archived'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã lưu trữ ({projects.filter((p) => p.archived).length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({projects.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mô tả..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Main Content / Project Cards Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <p className="text-sm text-slate-500 font-medium">Đang tải danh sách dự án...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-300 mt-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchTerm ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm 
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc chuyển tab bộ lọc.' 
              : 'Hãy bắt đầu bằng cách tạo dự án nghiên cứu đầu tiên hoặc thử nghiệm dữ liệu mẫu có sẵn.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Tạo dự án mới
            </button>
            <button
              onClick={handleSeedDemo}
              disabled={seedingLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
              Thử nghiệm Demo TAM
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/admin/projects/${proj.id}`)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1 text-base">
                    {proj.name}
                  </h3>
                  {proj.archived && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 flex-shrink-0">
                      Đã lưu trữ
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 h-10 mb-4">
                  {proj.description || 'Chưa có mô tả cho đề tài nghiên cứu này.'}
                </p>

                {/* Badges / Stats */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary-500" />
                    <span><strong>{proj.surveyCount || 0}</strong> khảo sát</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span><strong>{proj.totalResponses || 0}</strong> phản hồi</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Quick Actions */}
              <div 
                className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{new Date(proj.createdAt).toLocaleDateString('vi-VN')}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenEditModal(proj, e)}
                    className="p-1.5 hover:text-primary-600 hover:bg-white rounded transition-colors"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleClone(proj, e)}
                    className="p-1.5 hover:text-primary-600 hover:bg-white rounded transition-colors"
                    title="Nhân bản cấu trúc dự án"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleToggleArchive(proj, e)}
                    className="p-1.5 hover:text-amber-600 hover:bg-white rounded transition-colors"
                    title={proj.archived ? 'Bỏ lưu trữ' : 'Lưu trữ dự án'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProject(proj);
                      setDeleteConfirmName('');
                    }}
                    className="p-1.5 hover:text-rose-600 hover:bg-white rounded transition-colors"
                    title="Xóa vĩnh viễn dự án"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit Project */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án nghiên cứu mới'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProject(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tên dự án / Đề tài NCKH <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nghiên cứu các yếu tố ảnh hưởng đến ý định dùng xe điện"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mô tả / Thuyết minh đề tài
                </label>
                <textarea
                  rows={4}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu nghiên cứu, nhóm đối tượng khảo sát, phạm vi nghiên cứu..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !formName.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingProject ? 'Lưu thay đổi' : 'Tạo dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Project (Requires typing project name) */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Xác nhận xóa vĩnh viễn
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Hành động này <strong className="text-rose-600">KHÔNG THỂ hoàn tác</strong>. Mọi khảo sát, câu hỏi, thang đo và <strong className="text-rose-600">{deletingProject.totalResponses || 0} phản hồi</strong> thuộc dự án này sẽ bị xóa sạch khỏi cơ sở dữ liệu.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Để xác nhận, vui lòng gõ chính xác: <span className="font-mono text-rose-700 select-all bg-rose-50 px-1.5 py-0.5 rounded">{deletingProject.name}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Nhập tên dự án để xác nhận"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDeletingProject(null);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading || deleteConfirmName !== deletingProject.name}
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-40 transition-colors"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Xóa vĩnh viễn dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
