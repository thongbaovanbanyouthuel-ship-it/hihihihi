// src/admin/pages/SurveySettings.tsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { SurveyOutletContext } from './SurveyOverview';
import { saveSurveyDraft } from '@/lib/firebase/surveys';
import { SurveySettings as ISurveySettings } from '@/types/survey';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  BarChart, 
  Shuffle, 
  MessageSquare, 
  Hash,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export const SurveySettings: React.FC = () => {
  const { project, survey, refreshSurvey } = useOutletContext<SurveyOutletContext>();
  const { success, error } = useToast();

  const [settings, setSettings] = useState<ISurveySettings>(
    survey.settings || {
      thankYouMessage: 'Xin chân thành cảm ơn anh/chị đã dành thời gian quý báu tham gia khảo sát nghiên cứu khoa học!',
      oneResponsePerDevice: false,
      showProgressBar: true,
      shuffleOptions: false
    }
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveSurveyDraft(project.id, survey.id, {
        settings
      });
      success('Đã lưu cấu hình khảo sát thành công!');
      await refreshSurvey();
    } catch (err: any) {
      error('Lỗi khi lưu cài đặt: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="pb-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            Cài đặt & Giới hạn Khảo sát
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập thông điệp phản hồi, giới hạn thời gian và quy tắc kiểm soát người trả lời.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 mt-6">
          {/* Thank You Message */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              Thông điệp cảm ơn sau khi nộp bài
            </label>
            <textarea
              rows={3}
              value={settings.thankYouMessage}
              onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
              placeholder="Nội dung hiển thị cho người trả lời sau khi hoàn tất..."
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Hiển thị trên màn hình kết thúc của người trả lời sau khi bấm nút "Nộp bài".
            </p>
          </div>

          {/* Time Limit: openAt, closeAt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian mở nhận bài (Tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={settings.openAt || ''}
                onChange={(e) => setSettings({ ...settings, openAt: e.target.value || undefined })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian kết thúc tự động (Tùy chọn)
              </label>
              <input
                type="datetime-local"
                value={settings.closeAt || ''}
                onChange={(e) => setSettings({ ...settings, closeAt: e.target.value || undefined })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Max Responses */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Giới hạn số lượng phản hồi tối đa (Tùy chọn)
            </label>
            <input
              type="number"
              min={1}
              value={settings.maxResponses || ''}
              onChange={(e) => setSettings({ ...settings, maxResponses: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Ví dụ: 300 (để trống nếu không giới hạn)"
              className="w-full sm:w-64 text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Khảo sát sẽ tự động ngưng nhận bài khi đạt đủ số phản hồi này.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.oneResponsePerDevice}
                onChange={(e) => setSettings({ ...settings, oneResponsePerDevice: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  Mỗi thiết bị chỉ được trả lời một lần (Giới hạn qua LocalStorage)
                </span>
                <p className="text-xs text-slate-500">
                  Ngăn chặn một người gửi nhiều lần liên tiếp trên cùng một trình duyệt hoặc thiết bị.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.showProgressBar}
                onChange={(e) => setSettings({ ...settings, showProgressBar: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <BarChart className="w-4 h-4 text-slate-500" />
                  Hiển thị thanh tiến độ phần trăm (Progress bar)
                </span>
                <p className="text-xs text-slate-500">
                  Giúp người trả lời biết được mình đã hoàn thành bao nhiêu phần của khảo sát.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.shuffleOptions}
                onChange={(e) => setSettings({ ...settings, shuffleOptions: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4 text-slate-500" />
                  Xáo trộn ngẫu nhiên thứ tự các lựa chọn đáp án
                </span>
                <p className="text-xs text-slate-500">
                  Giảm thiểu sai số do thứ tự ưu tiên thị giác của người trả lời.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu cài đặt khảo sát
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
