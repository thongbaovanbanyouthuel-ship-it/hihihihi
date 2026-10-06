// src/admin/pages/SurveyBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { SurveyOutletContext } from './SurveyOverview';
import { saveSurveyDraft, publishSurvey } from '@/lib/firebase/surveys';
import { 
  Question, 
  Section, 
  Construct, 
  QuestionType, 
  QuestionOption, 
  MatrixRow 
} from '@/types/survey';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Save, 
  Send, 
  Layers, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X,
  ListOrdered,
  Settings2,
  Tag,
  ToggleLeft,
  ToggleRight,
  MoveUp,
  MoveDown,
  Sparkles,
  Check,
  Star
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const QUESTION_TYPES: { type: QuestionType; label: string; desc: string }[] = [
  { type: 'short_text', label: 'Trả lời ngắn', desc: 'Họ tên, mã sinh viên, email...' },
  { type: 'paragraph', label: 'Đoạn văn', desc: 'Ý kiến, đóng góp dài' },
  { type: 'number', label: 'Số', desc: 'Tuổi, thu nhập, số năm kinh nghiệm...' },
  { type: 'date', label: 'Ngày / Thời gian', desc: 'Ngày sinh, ngày mua sắm...' },
  { type: 'radio', label: 'Một lựa chọn (Radio)', desc: 'Giới tính, nhóm tuổi, trình độ...' },
  { type: 'checkbox', label: 'Nhiều lựa chọn (Checkbox)', desc: 'Tính năng yêu thích, kênh biết đến...' },
  { type: 'dropdown', label: 'Danh sách thả xuống', desc: 'Tỉnh/thành phố, nghề nghiệp...' },
  { type: 'likert', label: 'Thang đo Likert (5 / 7 mức)', desc: 'Mức độ đồng ý hoặc hài lòng' },
  { type: 'matrix_likert', label: 'Ma trận Likert (NCKH)', desc: 'Nhiều phát biểu thuộc cùng một thang đo' },
  { type: 'rating', label: 'Đánh giá sao (1 - 5)', desc: 'Đánh giá trải nghiệm hoặc mức độ yêu thích' },
];

export const SurveyBuilder: React.FC = () => {
  const { project, survey, refreshSurvey } = useOutletContext<SurveyOutletContext>();
  const { success, error, info } = useToast();

  // Local state for builder
  const [title, setTitle] = useState(survey.title || '');
  const [description, setDescription] = useState(survey.description || '');
  const [sections, setSections] = useState<Section[]>(survey.sections || []);
  const [questions, setQuestions] = useState<Question[]>(survey.questions || []);
  const [constructs, setConstructs] = useState<Construct[]>(survey.constructs || []);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Active section tab in editor
  const [activeSectionId, setActiveSectionId] = useState<string>(
    survey.sections?.[0]?.id || 'sec_default'
  );

  // Modals
  const [showConstructModal, setShowConstructModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Construct editor state
  const [newConstructCode, setNewConstructCode] = useState('');
  const [newConstructName, setNewConstructName] = useState('');
  const [newConstructDesc, setNewConstructDesc] = useState('');

  // Sync state if survey prop changes from server
  useEffect(() => {
    setTitle(survey.title || '');
    setDescription(survey.description || '');
    setSections(survey.sections || []);
    setQuestions(survey.questions || []);
    setConstructs(survey.constructs || []);
    if (survey.sections?.length > 0 && !survey.sections.some(s => s.id === activeSectionId)) {
      setActiveSectionId(survey.sections[0].id);
    }
  }, [survey.id, survey.version]);

  // Track unsaved modifications
  const markDirty = () => setIsDirty(true);

  // ===================== SECTION ACTIONS =====================
  const handleAddSection = () => {
    const newId = 'sec_' + Math.random().toString(36).substr(2, 7);
    const newOrder = sections.length + 1;
    const newSec: Section = {
      id: newId,
      title: `Phần ${newOrder}: Thông tin mới`,
      description: 'Mô tả hướng dẫn cho phần khảo sát này.',
      order: newOrder,
      questionIds: []
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newId);
    markDirty();
    success(`Đã thêm phần ${newOrder}!`);
  };

  const handleUpdateSection = (secId: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === secId ? { ...s, ...updates } : s));
    markDirty();
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      error('Khảo sát cần có ít nhất một phần.');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa phần này? Các câu hỏi trong phần sẽ bị loại bỏ.')) return;
    
    const secToDelete = sections.find(s => s.id === secId);
    const remainingQuestions = questions.filter(q => !secToDelete?.questionIds.includes(q.id));
    const remainingSections = sections.filter(s => s.id !== secId);
    setSections(remainingSections);
    setQuestions(remainingQuestions);
    setActiveSectionId(remainingSections[0].id);
    markDirty();
    info('Đã xóa phần khảo sát.');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    // update order
    newSections.forEach((s, idx) => s.order = idx + 1);
    setSections(newSections);
    markDirty();
  };

  // ===================== QUESTION ACTIONS =====================
  const handleAddQuestion = (type: QuestionType) => {
    const qCount = questions.length + 1;
    const newId = 'q_' + Math.random().toString(36).substr(2, 7);
    const codePrefix = type === 'likert' || type === 'matrix_likert' ? 'ITEM' : 'Q';
    const autoCode = `${codePrefix}${qCount}`;

    let options: QuestionOption[] | undefined;
    if (type === 'radio' || type === 'checkbox' || type === 'dropdown') {
      options = [
        { label: 'Lựa chọn 1', value: 1 },
        { label: 'Lựa chọn 2', value: 2 },
        { label: 'Lựa chọn 3', value: 3 },
      ];
    }

    let matrixRows: MatrixRow[] | undefined;
    if (type === 'matrix_likert') {
      matrixRows = [
        { code: `${autoCode}_1`, label: 'Phát biểu 1: Tôi nhận thấy hệ thống rất dễ sử dụng.', reverseCoded: false },
        { code: `${autoCode}_2`, label: 'Phát biểu 2: Hệ thống giúp nâng cao hiệu quả học tập và nghiên cứu.', reverseCoded: false },
        { code: `${autoCode}_3`, label: 'Phát biểu 3: Tôi cảm thấy việc thao tác phức tạp và tốn nhiều công sức.', reverseCoded: true },
      ];
    }

    const newQuestion: Question = {
      id: newId,
      code: autoCode,
      title: type === 'matrix_likert' 
        ? 'Xin vui lòng cho biết mức độ đồng ý của anh/chị với các nhận định dưới đây:' 
        : `Câu hỏi ${qCount}: Nội dung câu hỏi khảo sát`,
      type,
      required: true,
      options,
      matrixRows,
      likertScale: 5,
      likertLabels: {
        1: 'Hoàn toàn không đồng ý',
        2: 'Không đồng ý',
        3: 'Trung lập',
        4: 'Đồng ý',
        5: 'Hoàn toàn đồng ý'
      }
    };

    setQuestions([...questions, newQuestion]);

    // Attach to active section
    setSections(sections.map(s => {
      if (s.id === activeSectionId) {
        return { ...s, questionIds: [...s.questionIds, newId] };
      }
      return s;
    }));

    markDirty();
    success(`Đã thêm câu hỏi [${newQuestion.code}]`);
  };

  const handleUpdateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, ...updates } : q));
    markDirty();
  };

  const handleDeleteQuestion = (qId: string) => {
    if (survey.responseCount > 0) {
      if (!window.confirm('CẢNH BÁO: Khảo sát đã có dữ liệu trả lời! Xóa câu hỏi này có thể ảnh hưởng đến kết quả phân tích thống kê. Bạn có chắc muốn xóa?')) {
        return;
      }
    }
    setQuestions(questions.filter(q => q.id !== qId));
    setSections(sections.map(s => ({
      ...s,
      questionIds: s.questionIds.filter(id => id !== qId)
    })));
    markDirty();
    info('Đã xóa câu hỏi.');
  };

  const handleDuplicateQuestion = (original: Question) => {
    const qCount = questions.length + 1;
    const newId = 'q_' + Math.random().toString(36).substr(2, 7);
    const newCode = `${original.code}_COPY`;

    const cloned: Question = {
      ...original,
      id: newId,
      code: newCode,
      title: `${original.title} (Bản sao)`
    };

    setQuestions([...questions, cloned]);
    setSections(sections.map(s => {
      if (s.id === activeSectionId) {
        return { ...s, questionIds: [...s.questionIds, newId] };
      }
      return s;
    }));
    markDirty();
    success(`Đã nhân bản câu hỏi [${cloned.code}]`);
  };

  const handleMoveQuestionInSection = (qId: string, direction: 'up' | 'down') => {
    const activeSec = sections.find(s => s.id === activeSectionId);
    if (!activeSec) return;

    const list = [...activeSec.questionIds];
    const index = list.indexOf(qId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setSections(sections.map(s => s.id === activeSectionId ? { ...s, questionIds: list } : s));
    markDirty();
  };

  // ===================== CONSTRUCT ACTIONS =====================
  const handleAddConstruct = () => {
    if (!newConstructCode.trim() || !newConstructName.trim()) {
      error('Vui lòng nhập mã và tên thang đo.');
      return;
    }
    const cleanCode = newConstructCode.trim().toUpperCase();
    if (constructs.some(c => c.code === cleanCode)) {
      error(`Mã thang đo "${cleanCode}" đã tồn tại.`);
      return;
    }

    const newConstruct: Construct = {
      id: 'c_' + Math.random().toString(36).substr(2, 7),
      code: cleanCode,
      name: newConstructName.trim(),
      description: newConstructDesc.trim()
    };

    setConstructs([...constructs, newConstruct]);
    setNewConstructCode('');
    setNewConstructName('');
    setNewConstructDesc('');
    markDirty();
    success(`Đã thêm thang đo [${cleanCode}] - ${newConstruct.name}`);
  };

  const handleDeleteConstruct = (cId: string) => {
    setConstructs(constructs.filter(c => c.id !== cId));
    // Detach from questions and matrix rows
    setQuestions(questions.map(q => {
      const updated = { ...q };
      if (updated.constructId === cId) updated.constructId = undefined;
      if (updated.matrixRows) {
        updated.matrixRows = updated.matrixRows.map(r => r.constructId === cId ? { ...r, constructId: undefined } : r);
      }
      return updated;
    }));
    markDirty();
    info('Đã xóa thang đo.');
  };

  // ===================== SAVE & PUBLISH =====================
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      // Validate unique question codes
      const codes = new Set<string>();
      for (const q of questions) {
        const c = q.code.trim().toUpperCase();
        if (!c) {
          error(`Có câu hỏi chưa được đặt mã biến.`);
          return;
        }
        if (codes.has(c)) {
          error(`Mã biến [${c}] bị trùng lặp! Mỗi câu hỏi phải có mã biến duy nhất.`);
          return;
        }
        codes.add(c);

        // Also check matrixRows codes
        if (q.matrixRows) {
          for (const row of q.matrixRows) {
            const rc = row.code.trim().toUpperCase();
            if (codes.has(rc)) {
              error(`Mã biến dòng ma trận [${rc}] bị trùng lặp!`);
              return;
            }
            codes.add(rc);
          }
        }
      }

      await saveSurveyDraft(project.id, survey.id, {
        title,
        description,
        sections,
        questions,
        constructs
      });

      setIsDirty(false);
      success('Đã lưu bản nháp khảo sát thành công!');
      await refreshSurvey();
    } catch (err: any) {
      error('Lỗi khi lưu bản nháp: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishSurvey = async () => {
    try {
      setPublishing(true);
      // Save draft first
      await saveSurveyDraft(project.id, survey.id, {
        title,
        description,
        sections,
        questions,
        constructs
      });

      const nextVer = await publishSurvey(project.id, survey.id);
      setIsDirty(false);
      success(`Đã xuất bản thành công phiên bản v${nextVer}! Trang khảo sát đã được cập nhật trực tuyến.`);
      await refreshSurvey();
    } catch (err: any) {
      error('Lỗi xuất bản: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // ===================== EXCEL / CSV IMPORT =====================
  const handleDownloadSampleFile = () => {
    const sampleRows = [
      {
        'Mã biến': 'GT1',
        'Nội dung câu hỏi': 'Giới tính của bạn là gì?',
        'Loại câu hỏi': 'radio',
        'Thang đo': '',
        'Đáp án': '1: Nam | 2: Nữ | 3: Khác',
        'Bắt buộc': 'CÓ',
        'Đảo ngược': 'KHÔNG'
      },
      {
        'Mã biến': 'TUOI',
        'Nội dung câu hỏi': 'Độ tuổi hiện tại của bạn?',
        'Loại câu hỏi': 'radio',
        'Thang đo': '',
        'Đáp án': '1: Dưới 18 | 2: 18 - 22 | 3: 23 - 30 | 4: Trên 30',
        'Bắt buộc': 'CÓ',
        'Đảo ngược': 'KHÔNG'
      },
      {
        'Mã biến': 'PE1',
        'Nội dung câu hỏi': 'Sử dụng xe máy điện giúp tôi tiết kiệm chi phí nhiên liệu hàng tháng.',
        'Loại câu hỏi': 'likert',
        'Thang đo': 'PE',
        'Đáp án': '1: Hoàn toàn không đồng ý | 2: Không đồng ý | 3: Trung lập | 4: Đồng ý | 5: Hoàn toàn đồng ý',
        'Bắt buộc': 'CÓ',
        'Đảo ngược': 'KHÔNG'
      },
      {
        'Mã biến': 'PE2',
        'Nội dung câu hỏi': 'Xe máy điện đáp ứng tốt nhu cầu đi lại hàng ngày của tôi.',
        'Loại câu hỏi': 'likert',
        'Thang đo': 'PE',
        'Đáp án': '1: Hoàn toàn không đồng ý | 2: Không đồng ý | 3: Trung lập | 4: Đồng ý | 5: Hoàn toàn đồng ý',
        'Bắt buộc': 'CÓ',
        'Đảo ngược': 'KHÔNG'
      },
      {
        'Mã biến': 'PE3',
        'Nội dung câu hỏi': 'Việc sạc pin xe máy điện quá rườm rà và tốn nhiều thời gian chờ đợi.',
        'Loại câu hỏi': 'likert',
        'Thang đo': 'PE',
        'Đáp án': '1: Hoàn toàn không đồng ý | 2: Không đồng ý | 3: Trung lập | 4: Đồng ý | 5: Hoàn toàn đồng ý',
        'Bắt buộc': 'CÓ',
        'Đảo ngược': 'CÓ'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Cau_Hoi');
    XLSX.writeFile(workbook, 'Mau_Nhap_Cau_Hoi_NCKH.xlsx');
    info('Đã tải xuống file Excel mẫu nhập câu hỏi.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          error('File không chứa dữ liệu câu hỏi.');
          return;
        }

        const newQList: Question[] = [];
        const newSecQIds: string[] = [];

        json.forEach((row, idx) => {
          const rawCode = (row['Mã biến'] || row['Code'] || `IMPORT_${idx + 1}`).toString().trim().toUpperCase();
          const rawTitle = (row['Nội dung câu hỏi'] || row['Title'] || `Câu hỏi ${idx + 1}`).toString().trim();
          const rawType = (row['Loại câu hỏi'] || row['Type'] || 'likert').toString().trim().toLowerCase();
          const rawConstruct = (row['Thang đo'] || row['Construct'] || '').toString().trim().toUpperCase();
          const rawOptions = (row['Đáp án'] || row['Options'] || '').toString();
          const rawReverse = (row['Đảo ngược'] || row['Reverse'] || '').toString().trim().toUpperCase() === 'CÓ';
          const rawRequired = (row['Bắt buộc'] || row['Required'] || 'CÓ').toString().trim().toUpperCase() !== 'KHÔNG';

          // Type mapping
          let type: QuestionType = 'likert';
          if (['radio', 'mot_lua_chon', 'single'].includes(rawType)) type = 'radio';
          else if (['checkbox', 'nhieu_lua_chon', 'multiple'].includes(rawType)) type = 'checkbox';
          else if (['short_text', 'text', 'ngan'].includes(rawType)) type = 'short_text';
          else if (['paragraph', 'doan_van'].includes(rawType)) type = 'paragraph';
          else if (['number', 'so'].includes(rawType)) type = 'number';
          else if (['date', 'ngay'].includes(rawType)) type = 'date';
          else if (['dropdown'].includes(rawType)) type = 'dropdown';
          else if (['rating', 'sao'].includes(rawType)) type = 'rating';

          // Parse options if radio/checkbox
          let parsedOptions: QuestionOption[] | undefined;
          if (['radio', 'checkbox', 'dropdown'].includes(type) && rawOptions) {
            parsedOptions = rawOptions.split('|').map((optStr: string, optIdx: number) => {
              const parts = optStr.split(':');
              if (parts.length >= 2) {
                return {
                  value: isNaN(Number(parts[0].trim())) ? parts[0].trim() : Number(parts[0].trim()),
                  label: parts.slice(1).join(':').trim()
                };
              }
              return { value: optIdx + 1, label: optStr.trim() };
            });
          }

          // Match construct if exists
          const matchedConstruct = constructs.find(c => c.code === rawConstruct);

          const qId = 'q_' + Math.random().toString(36).substr(2, 7);
          newQList.push({
            id: qId,
            code: rawCode,
            title: rawTitle,
            type,
            required: rawRequired,
            constructId: matchedConstruct?.id,
            reverseCoded: rawReverse,
            options: parsedOptions,
            likertScale: 5,
            likertLabels: {
              1: 'Hoàn toàn không đồng ý',
              2: 'Không đồng ý',
              3: 'Trung lập',
              4: 'Đồng ý',
              5: 'Hoàn toàn đồng ý'
            }
          });
          newSecQIds.push(qId);
        });

        // Append to questions and active section
        setQuestions(prev => [...prev, ...newQList]);
        setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, questionIds: [...s.questionIds, ...newSecQIds] } : s));
        markDirty();
        setShowImportModal(false);
        success(`Đã nhập thành công ${newQList.length} câu hỏi từ file!`);
      } catch (err: any) {
        console.error(err);
        error('Lỗi khi đọc file Excel/CSV: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const activeQuestions = activeSection
    ? activeSection.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Warning if Survey has Responses */}
      {survey.responseCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Lưu ý bảo toàn dữ liệu:</span> Khảo sát này đã thu thập{' '}
            <strong>{survey.responseCount} bài nộp</strong>. Khi chỉnh sửa, hạn chế thay đổi mã biến
            hoặc xóa câu hỏi để tránh làm sai lệch dữ liệu cũ. Các thay đổi sau khi <strong>Xuất bản lại</strong> sẽ được cập nhật phiên bản mới (v{survey.version + 1}).
          </div>
        </div>
      )}

      {/* Builder Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowConstructModal(true)}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Quản lý Thang đo ({constructs.length})
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            Nhập file Excel/CSV
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
            Xem trước (Preview)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Có thay đổi chưa lưu
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5 text-slate-500" />
            {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>

          <button
            onClick={handlePublishSurvey}
            disabled={publishing}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-1.5" />
            {publishing ? 'Đang xuất bản...' : 'Xuất bản công khai'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sections Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Các phần khảo sát ({sections.length})
              </span>
              <button
                onClick={handleAddSection}
                className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                title="Thêm phần mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {sections.map((sec, idx) => {
                const isActive = sec.id === activeSectionId;
                const count = sec.questionIds.length;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-800 font-semibold border border-primary-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <span className="line-clamp-1">{sec.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {count} câu hỏi
                      </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:text-primary-600 disabled:opacity-20"
                        title="Di chuyển lên"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, 'down');
                        }}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:text-primary-600 disabled:opacity-20"
                        title="Di chuyển xuống"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(sec.id);
                        }}
                        className="p-1 hover:text-rose-600"
                        title="Xóa phần này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddSection}
              className="w-full mt-3 py-2 px-3 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm phần mới
            </button>
          </div>

          {/* Quick Stats card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2">
            <div className="font-semibold text-slate-700">Tổng quan cấu trúc:</div>
            <div className="flex justify-between text-slate-600">
              <span>Tổng số câu hỏi:</span>
              <strong className="text-slate-900">{questions.length}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Thang đo / Construct:</span>
              <strong className="text-slate-900">{constructs.length}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phiên bản hiện tại:</span>
              <strong className="text-slate-900">v{survey.version}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Question Editor for Active Section */}
        <div className="lg:col-span-9 space-y-6">
          {activeSection && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tiêu đề phần
                </label>
                <input
                  type="text"
                  value={activeSection.title}
                  onChange={(e) => handleUpdateSection(activeSection.id, { title: e.target.value })}
                  className="w-full text-base font-bold text-slate-900 border-0 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-0 px-0 py-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Mô tả / Hướng dẫn trả lời của phần này
                </label>
                <textarea
                  rows={2}
                  value={activeSection.description || ''}
                  onChange={(e) => handleUpdateSection(activeSection.id, { description: e.target.value })}
                  placeholder="Điền hướng dẫn cho người tham gia khảo sát khi bước vào phần này..."
                  className="w-full text-sm text-slate-700 border-0 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-0 px-0 py-1 resize-none"
                />
              </div>
            </div>
          )}

          {/* Questions in Section */}
          <div className="space-y-4">
            {activeQuestions.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">Phần này chưa có câu hỏi nào</h4>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                  Chọn một loại câu hỏi bên dưới để thêm vào phần khảo sát này.
                </p>
              </div>
            ) : (
              activeQuestions.map((q, qIndex) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  qIndex={qIndex}
                  totalInSec={activeQuestions.length}
                  constructs={constructs}
                  onUpdate={(updates) => handleUpdateQuestion(q.id, updates)}
                  onDelete={() => handleDeleteQuestion(q.id)}
                  onDuplicate={() => handleDuplicateQuestion(q)}
                  onMove={(dir) => handleMoveQuestionInSection(q.id, dir)}
                />
              ))
            )}
          </div>

          {/* Add Question Menu Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary-600" />
              Thêm câu hỏi mới vào phần này
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {QUESTION_TYPES.map((qt) => (
                <button
                  key={qt.type}
                  type="button"
                  onClick={() => handleAddQuestion(qt.type)}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50/40 transition-all flex flex-col justify-between group"
                >
                  <span className="font-semibold text-xs text-slate-800 group-hover:text-primary-700">
                    {qt.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {qt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CONSTRUCT MANAGER MODAL ===================== */}
      {showConstructModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-600" />
                  Quản lý Thang đo / Biến tiềm ẩn (Constructs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định nghĩa các nhân tố nghiên cứu (PE, EE, SI, BI...) để chạy Cronbach's Alpha, EFA và Hồi quy.
                </p>
              </div>
              <button onClick={() => setShowConstructModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Existing Constructs */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {constructs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Chưa có thang đo nào được tạo.</p>
              ) : (
                constructs.map((c) => {
                  // Find questions assigned
                  const assignedItems = questions.filter(
                    q => q.constructId === c.id || q.matrixRows?.some(r => r.constructId === c.id)
                  );
                  return (
                    <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{c.name}</span>
                        </div>
                        {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{assignedItems.length} biến quan sát gắn vào thang đo này</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteConstruct(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Xóa thang đo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add New Construct Form */}
            <div className="pt-4 border-t border-slate-200 space-y-3 bg-slate-50/50 p-4 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Thêm thang đo mới:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Mã (VD: PE, EE)"
                    value={newConstructCode}
                    onChange={(e) => setNewConstructCode(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Tên thang đo (VD: Kỳ vọng hiệu quả)"
                    value={newConstructName}
                    onChange={(e) => setNewConstructName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Mô tả phụ về khái niệm nghiên cứu..."
                  value={newConstructDesc}
                  onChange={(e) => setNewConstructDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddConstruct}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
                >
                  Thêm thang đo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PREVIEW MODAL ===================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 bg-white -mx-6 -mt-6 p-6 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  Chế độ xem trước (Preview)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{title}</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {sections.map((sec, sIdx) => (
                <div key={sec.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-primary-700">{sec.title}</h4>
                    {sec.description && <p className="text-xs text-slate-500 mt-0.5">{sec.description}</p>}
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {sec.questionIds.map((qId) => {
                      const q = questions.find(item => item.id === qId);
                      if (!q) return null;
                      return (
                        <div key={q.id} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-slate-800">
                              {q.title} {q.required && <span className="text-rose-500">*</span>}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
                              {q.code}
                            </span>
                          </div>

                          {/* Preview inputs */}
                          {q.type === 'short_text' && (
                            <input disabled type="text" placeholder="Câu trả lời của bạn..." className="w-full text-xs p-2 bg-white border border-slate-300 rounded" />
                          )}
                          {q.type === 'paragraph' && (
                            <textarea disabled rows={2} placeholder="Ý kiến phản hồi..." className="w-full text-xs p-2 bg-white border border-slate-300 rounded resize-none" />
                          )}
                          {q.type === 'number' && (
                            <input disabled type="number" placeholder="Nhập số..." className="w-48 text-xs p-2 bg-white border border-slate-300 rounded" />
                          )}
                          {q.type === 'radio' && q.options && (
                            <div className="space-y-1.5 pt-1">
                              {q.options.map((opt, i) => (
                                <label key={i} className="flex items-center gap-2 text-xs text-slate-700">
                                  <input type="radio" disabled name={q.code} className="text-primary-600" />
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {q.type === 'likert' && (
                            <div className="grid grid-cols-5 gap-2 pt-2">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <div key={val} className="text-center p-2 rounded bg-white border border-slate-200 text-xs">
                                  <div className="font-bold text-slate-700">{val}</div>
                                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                    {q.likertLabels?.[val] || `Mức ${val}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'matrix_likert' && q.matrixRows && (
                            <div className="overflow-x-auto pt-2">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="py-2 text-slate-600 font-semibold">Phát biểu</th>
                                    {[1, 2, 3, 4, 5].map(v => (
                                      <th key={v} className="py-2 text-center text-slate-600 font-semibold w-12">{v}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.matrixRows.map((r, ri) => (
                                    <tr key={ri} className="border-b border-slate-100">
                                      <td className="py-2.5 pr-2 text-slate-800">
                                        <div className="font-medium">{r.label}</div>
                                        <span className="font-mono text-[10px] text-slate-400">[{r.code}]</span>
                                      </td>
                                      {[1, 2, 3, 4, 5].map(v => (
                                        <td key={v} className="py-2 text-center">
                                          <input type="radio" disabled name={r.code} />
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== IMPORT EXCEL / CSV MODAL ===================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Nhập câu hỏi hàng loạt từ Excel / CSV
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600">
              <p>
                Bạn có thể soạn sẵn bảng câu hỏi trên Excel rồi tải lên hệ thống. Các câu hỏi sẽ được tự động thêm vào phần đang chọn.
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Chưa có file mẫu?</div>
                  <div className="text-[11px] text-slate-500">Tải file mẫu Excel chuẩn với các cột định dạng sẵn.</div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleFile}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Tải mẫu Excel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chọn file Excel (.xlsx) hoặc CSV:
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportFile}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== SUBCOMPONENT: QUESTION CARD =====================
interface QuestionCardProps {
  question: Question;
  qIndex: number;
  totalInSec: number;
  constructs: Construct[];
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  qIndex,
  totalInSec,
  constructs,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove
}) => {
  const [expanded, setExpanded] = useState(true);

  // Handle options changes
  const handleAddOption = () => {
    const opts = question.options || [];
    const nextVal = opts.length + 1;
    onUpdate({
      options: [...opts, { label: `Lựa chọn ${nextVal}`, value: nextVal }]
    });
  };

  const handleUpdateOption = (index: number, updates: Partial<QuestionOption>) => {
    const opts = [...(question.options || [])];
    opts[index] = { ...opts[index], ...updates };
    onUpdate({ options: opts });
  };

  const handleDeleteOption = (index: number) => {
    const opts = [...(question.options || [])];
    opts.splice(index, 1);
    onUpdate({ options: opts });
  };

  // Matrix rows changes
  const handleAddMatrixRow = () => {
    const rows = question.matrixRows || [];
    const nextCode = `${question.code}_${rows.length + 1}`;
    onUpdate({
      matrixRows: [
        ...rows,
        { code: nextCode, label: `Phát biểu ${rows.length + 1}: Nội dung nhận định`, reverseCoded: false }
      ]
    });
  };

  const handleUpdateMatrixRow = (index: number, updates: Partial<MatrixRow>) => {
    const rows = [...(question.matrixRows || [])];
    rows[index] = { ...rows[index], ...updates };
    onUpdate({ matrixRows: rows });
  };

  const handleDeleteMatrixRow = (index: number) => {
    const rows = [...(question.matrixRows || [])];
    rows.splice(index, 1);
    onUpdate({ matrixRows: rows });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300">
      {/* Question Card Header */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Variable Code Badge */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400">MÃ:</span>
            <input
              type="text"
              value={question.code}
              onChange={(e) => onUpdate({ code: e.target.value.trim().toUpperCase() })}
              placeholder="MÃ_BIẾN"
              className="font-mono text-xs font-bold uppercase text-primary-700 bg-white px-2 py-0.5 border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-28"
            />
          </div>

          <span className="text-xs text-slate-400">•</span>

          {/* Question Type selector */}
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
            className="text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {QUESTION_TYPES.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>

          {/* Construct assignment badge */}
          <select
            value={question.constructId || ''}
            onChange={(e) => onUpdate({ constructId: e.target.value || undefined })}
            className={`text-xs rounded px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-primary-500 ${
              question.constructId
                ? 'bg-primary-50 text-primary-800 border-primary-300 font-semibold'
                : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            <option value="">-- Chưa gán thang đo --</option>
            {constructs.map(c => (
              <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
            ))}
          </select>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onMove('up')}
            disabled={qIndex === 0}
            className="p-1 hover:text-primary-600 disabled:opacity-20 text-slate-400"
            title="Di chuyển lên"
          >
            <MoveUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={qIndex === totalInSec - 1}
            className="p-1 hover:text-primary-600 disabled:opacity-20 text-slate-400"
            title="Di chuyển xuống"
          >
            <MoveDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 hover:text-primary-600 text-slate-400"
            title="Nhân bản câu hỏi"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:text-rose-600 text-slate-400"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Title input */}
        <div>
          <input
            type="text"
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Nhập nội dung câu hỏi..."
            className="w-full text-sm font-semibold text-slate-900 border-0 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-0 px-0 py-1"
          />
        </div>

        {/* Description / Instructions */}
        <div>
          <input
            type="text"
            value={question.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Mô tả phụ hoặc hướng dẫn thêm cho câu hỏi này (nếu có)..."
            className="w-full text-xs text-slate-500 border-0 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:ring-0 px-0 py-1"
          />
        </div>

        {/* Question Type Specific Details */}
        {/* RADIO / CHECKBOX / DROPDOWN OPTIONS */}
        {['radio', 'checkbox', 'dropdown'].includes(question.type) && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Danh sách đáp án & Giá trị mã hóa số:
            </span>
            <div className="space-y-1.5">
              {(question.options || []).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4 text-right">{oIdx + 1}.</span>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleUpdateOption(oIdx, { label: e.target.value })}
                    placeholder="Tên nhãn đáp án"
                    className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Mã số:</span>
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => handleUpdateOption(oIdx, { value: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) })}
                      className="w-14 text-xs font-mono text-center px-1.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteOption(oIdx)}
                    className="p-1 text-slate-300 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm đáp án
            </button>
          </div>
        )}

        {/* MATRIX LIKERT ROWS */}
        {question.type === 'matrix_likert' && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Các phát biểu trong ma trận (Biến quan sát):
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Thang đo điểm:</span>
                <select
                  value={question.likertScale || 5}
                  onChange={(e) => onUpdate({ likertScale: Number(e.target.value) as 5 | 7 })}
                  className="text-xs px-2 py-0.5 border border-slate-300 rounded font-semibold text-slate-700"
                >
                  <option value={5}>5 mức</option>
                  <option value={7}>7 mức</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {(question.matrixRows || []).map((row, rIdx) => (
                <div key={rIdx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-1 sm:w-28">
                    <span className="text-[10px] text-slate-400">Mã:</span>
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => handleUpdateMatrixRow(rIdx, { code: e.target.value.trim().toUpperCase() })}
                      className="font-mono text-xs font-bold text-primary-700 bg-white px-1.5 py-1 border border-slate-300 rounded w-full"
                    />
                  </div>

                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => handleUpdateMatrixRow(rIdx, { label: e.target.value })}
                    placeholder="Nội dung phát biểu..."
                    className="flex-1 text-xs px-2.5 py-1 bg-white border border-slate-300 rounded"
                  />

                  {/* Construct selection for row */}
                  <select
                    value={row.constructId || question.constructId || ''}
                    onChange={(e) => handleUpdateMatrixRow(rIdx, { constructId: e.target.value || undefined })}
                    className="text-xs px-2 py-1 bg-white border border-slate-300 rounded sm:w-36 text-slate-700"
                  >
                    <option value="">Thang đo chung</option>
                    {constructs.map(c => (
                      <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>
                    ))}
                  </select>

                  {/* Reverse coded flag */}
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!row.reverseCoded}
                      onChange={(e) => handleUpdateMatrixRow(rIdx, { reverseCoded: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className={row.reverseCoded ? 'text-amber-700 font-bold' : ''}>Mã ngược</span>
                  </label>

                  <button
                    onClick={() => handleDeleteMatrixRow(rIdx)}
                    className="p-1 text-slate-300 hover:text-rose-500 self-end sm:self-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMatrixRow}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm phát biểu vào ma trận
            </button>
          </div>
        )}

        {/* LIKERT SINGLE QUESTION OPTIONS */}
        {question.type === 'likert' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Số mức Likert:</span>
              <select
                value={question.likertScale || 5}
                onChange={(e) => onUpdate({ likertScale: Number(e.target.value) as 5 | 7 })}
                className="text-xs px-2 py-1 border border-slate-300 rounded font-semibold text-slate-700"
              >
                <option value={5}>5 mức (1: Hoàn toàn không đồng ý ... 5: Hoàn toàn đồng ý)</option>
                <option value={7}>7 mức (1: Rất không đồng ý ... 7: Rất đồng ý)</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={!!question.reverseCoded}
                onChange={(e) => onUpdate({ reverseCoded: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className={question.reverseCoded ? 'text-amber-700 font-bold' : ''}>
                Câu hỏi mã hóa ngược (Reverse-coded)
              </span>
            </label>
          </div>
        )}

        {/* Footer toggles (Required) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className={question.required ? 'font-semibold text-slate-800' : ''}>
              Bắt buộc trả lời
            </span>
          </label>

          {question.reverseCoded && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
              ĐẢO BIẾN KHI PHÂN TÍCH
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
