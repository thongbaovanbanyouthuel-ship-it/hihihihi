// src/public/pages/PublicSurveyPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicSurvey, submitPublicSurveyResponse } from '@/lib/firebase/surveys';
import { PublicSurvey, Question, Section, QuestionOption, MatrixRow } from '@/types/survey';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Loader2, 
  GraduationCap, 
  Lock, 
  Star,
  Check
} from 'lucide-react';

export const PublicSurveyPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();

  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form pagination state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Duration tracking
  const startTimeRef = useRef<number>(Date.now());

  // Storage keys
  const draftStorageKey = `survey_draft_${surveyId}`;
  const submittedStorageKey = `survey_submitted_${surveyId}`;

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;
      try {
        setLoading(true);
        // Check if device already submitted
        if (localStorage.getItem(submittedStorageKey)) {
          setAlreadySubmitted(true);
        }

        const data = await getPublicSurvey(surveyId);
        if (!data) {
          setLoadError('Không tìm thấy bảng khảo sát này hoặc khảo sát đã bị gỡ.');
          return;
        }

        setSurvey(data);

        // Check if one response per device was checked
        if (data.settings?.oneResponsePerDevice && localStorage.getItem(submittedStorageKey)) {
          setAlreadySubmitted(true);
        }

        // Restore draft answers from localStorage if available
        try {
          const savedDraft = localStorage.getItem(draftStorageKey);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.otherTexts) setOtherTexts(parsed.otherTexts);
          }
        } catch {}

        startTimeRef.current = Date.now();
      } catch (err: any) {
        console.error(err);
        setLoadError('Có lỗi xảy ra khi tải bảng khảo sát: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  // Autosave draft to localStorage
  useEffect(() => {
    if (!surveyId || submitted || Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({ answers, otherTexts }));
    } catch {}
  }, [answers, otherTexts, surveyId, submitted]);

  // Value change handlers
  const handleAnswerChange = (code: string, value: any) => {
    setAnswers(prev => ({ ...prev, [code]: value }));
    // Clear error for this question if any
    if (errors[code]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  };

  const handleCheckboxChange = (code: string, value: any, checked: boolean) => {
    const currentList: any[] = Array.isArray(answers[code]) ? [...answers[code]] : [];
    let updated: any[];
    if (checked) {
      updated = [...currentList, value];
    } else {
      updated = currentList.filter(item => item !== value);
    }
    handleAnswerChange(code, updated);
  };

  // Validation before next section / submit
  const validateCurrentSection = (): boolean => {
    if (!survey) return true;
    const currentSection = survey.sections[currentSectionIndex];
    if (!currentSection) return true;

    const newErrors: Record<string, string> = {};
    const currentQuestions = currentSection.questionIds
      .map(id => survey.questions.find(q => q.id === id))
      .filter(Boolean) as Question[];

    for (const q of currentQuestions) {
      if (!q.required) continue;

      if (q.type === 'matrix_likert' && q.matrixRows) {
        // Validate every row in matrix
        for (const row of q.matrixRows) {
          const val = answers[row.code];
          if (val === undefined || val === null || val === '') {
            newErrors[row.code] = 'Vui lòng đánh giá phát biểu này.';
            newErrors[q.code] = 'Vui lòng hoàn thành toàn bộ các phát biểu trong bảng.';
          }
        }
      } else if (q.type === 'checkbox') {
        const val = answers[q.code];
        if (!Array.isArray(val) || val.length === 0) {
          newErrors[q.code] = 'Vui lòng chọn ít nhất một câu trả lời.';
        }
      } else {
        const val = answers[q.code];
        if (val === undefined || val === null || val.toString().trim() === '') {
          newErrors[q.code] = 'Vui lòng trả lời câu hỏi này.';
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`q_wrapper_${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) return;
    if (survey && currentSectionIndex < survey.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    if (!survey || !surveyId) return;

    try {
      setSubmitting(true);
      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      // Assemble final answers with otherText if specified
      const finalAnswers = { ...answers };
      Object.keys(otherTexts).forEach(key => {
        if (otherTexts[key]) {
          finalAnswers[`${key}_OTHER`] = otherTexts[key];
        }
      });

      await submitPublicSurveyResponse(survey.projectId, surveyId, {
        answers: finalAnswers,
        surveyVersion: survey.version || 1,
        durationSec,
        meta: {
          device: isMobile ? 'mobile' : 'desktop',
          lang: navigator.language || 'vi',
          userAgent: navigator.userAgent
        }
      });

      // Clear draft & set device lock
      try {
        localStorage.removeItem(draftStorageKey);
        localStorage.setItem(submittedStorageKey, 'true');
      } catch {}

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert('Không thể gửi bài khảo sát: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== RENDER STATES =====================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Đang tải bảng khảo sát...</p>
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy khảo sát</h2>
          <p className="text-sm text-slate-600 mt-2">{loadError || 'Khảo sát không tồn tại.'}</p>
        </div>
      </div>
    );
  }

  // Already submitted on this device
  if (alreadySubmitted && survey.settings?.oneResponsePerDevice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Bạn đã hoàn thành khảo sát này</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hệ thống ghi nhận bạn đã gửi câu trả lời trên thiết bị này. Mỗi người tham gia chỉ cần đóng góp ý kiến một lần.
          </p>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            Xin chân thành cảm ơn sự hợp tác và hỗ trợ của bạn cho nghiên cứu khoa học!
          </p>
        </div>
      </div>
    );
  }

  // Survey is Draft
  if (survey.status === 'draft') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Khảo sát chưa mở</h2>
          <p className="text-sm text-slate-600">
            Mẫu khảo sát đang trong quá trình chuẩn bị và chưa sẵn sàng tiếp nhận câu trả lời. Vui lòng quay lại sau!
          </p>
        </div>
      </div>
    );
  }

  // Survey is Closed
  if (survey.status === 'closed') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-3">
          <Lock className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Khảo sát đã kết thúc</h2>
          <p className="text-sm text-slate-600">
            Bảng khảo sát này hiện đã đóng tiếp nhận phản hồi. Cảm ơn sự quan tâm của quý anh/chị đối với đề tài nghiên cứu!
          </p>
        </div>
      </div>
    );
  }

  // Survey Successfully Submitted Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-md border border-slate-200 max-w-lg w-full text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Gửi câu trả lời thành công!</h2>
          <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
            {survey.settings?.thankYouMessage || 'Xin chân thành cảm ơn quý anh/chị đã dành thời gian quý báu tham gia khảo sát nghiên cứu khoa học!'}
          </div>
          <p className="text-xs text-slate-400">
            Phản hồi của bạn đã được mã hóa an toàn và ghi nhận vào cơ sở dữ liệu nghiên cứu.
          </p>
        </div>
      </div>
    );
  }

  // Active section & questions
  const totalSections = survey.sections.length || 1;
  const currentSection = survey.sections[currentSectionIndex] || {
    id: 'sec_1',
    title: survey.title,
    description: survey.description,
    order: 1,
    questionIds: survey.questions.map(q => q.id)
  };

  const currentQuestions = currentSection.questionIds
    .map(id => survey.questions.find(q => q.id === id))
    .filter(Boolean) as Question[];

  const progressPercent = Math.round(((currentSectionIndex + 1) / totalSections) * 100);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="h-2 bg-primary-600 absolute top-0 left-0 right-0" />
          
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" />
            Khảo sát Nghiên cứu Khoa học
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {survey.title}
          </h1>

          {survey.description && (
            <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">
              {survey.description}
            </p>
          )}

          {/* Progress Bar (if enabled in settings) */}
          {survey.settings?.showProgressBar !== false && totalSections > 1 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Phần {currentSectionIndex + 1} / {totalSections}: {currentSection.title}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section Heading Card (if different from survey title) */}
        {totalSections > 1 && (
          <div className="bg-white/80 rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">{currentSection.title}</h2>
            {currentSection.description && (
              <p className="text-xs text-slate-500 mt-1">{currentSection.description}</p>
            )}
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-5">
          {currentQuestions.map((q, idx) => {
            const hasError = !!errors[q.code];

            return (
              <div
                key={q.id}
                id={`q_wrapper_${q.code}`}
                className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-sm transition-all duration-200 ${
                  hasError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                {/* Question Title */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <label className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      <span className="text-primary-700 mr-1.5">{idx + 1}.</span>
                      {q.title}
                      {q.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>
                  </div>
                  {q.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{q.description}</p>
                  )}
                </div>

                {/* Error Banner */}
                {hasError && (
                  <div className="mb-4 text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors[q.code]}
                  </div>
                )}

                {/* Question Inputs */}
                {/* 1. SHORT TEXT */}
                {q.type === 'short_text' && (
                  <input
                    type="text"
                    value={answers[q.code] || ''}
                    onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full text-sm bg-slate-50/70 border border-slate-300 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                )}

                {/* 2. PARAGRAPH */}
                {q.type === 'paragraph' && (
                  <textarea
                    rows={4}
                    value={answers[q.code] || ''}
                    onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                    placeholder="Nhập câu trả lời chi tiết..."
                    className="w-full text-sm bg-slate-50/70 border border-slate-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                )}

                {/* 3. NUMBER */}
                {q.type === 'number' && (
                  <input
                    type="number"
                    value={answers[q.code] || ''}
                    onChange={(e) => handleAnswerChange(q.code, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Nhập số..."
                    className="w-full sm:w-60 text-sm bg-slate-50/70 border border-slate-300 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                )}

                {/* 4. DATE */}
                {q.type === 'date' && (
                  <input
                    type="date"
                    value={answers[q.code] || ''}
                    onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                    className="w-full sm:w-60 text-sm bg-slate-50/70 border border-slate-300 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                )}

                {/* 5. RADIO (Một lựa chọn) */}
                {q.type === 'radio' && (
                  <div className="space-y-2 mt-2">
                    {(q.options || []).map((opt, oIdx) => {
                      const isSelected = answers[q.code] === opt.value;
                      return (
                        <label
                          key={oIdx}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.code}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q.code, opt.value)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 6. CHECKBOX (Nhiều lựa chọn) */}
                {q.type === 'checkbox' && (
                  <div className="space-y-2 mt-2">
                    {(q.options || []).map((opt, oIdx) => {
                      const selectedList: any[] = Array.isArray(answers[q.code]) ? answers[q.code] : [];
                      const isSelected = selectedList.includes(opt.value);
                      return (
                        <label
                          key={oIdx}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(q.code, opt.value, e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 7. DROPDOWN */}
                {q.type === 'dropdown' && (
                  <select
                    value={answers[q.code] || ''}
                    onChange={(e) => handleAnswerChange(q.code, isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
                    className="w-full text-sm bg-slate-50/70 border border-slate-300 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Vui lòng chọn --</option>
                    {(q.options || []).map((opt, oIdx) => (
                      <option key={oIdx} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {/* 8. LIKERT (5 hoặc 7 mức đơn) */}
                {q.type === 'likert' && (
                  <div className="mt-3">
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const isSelected = answers[q.code] === level;
                        const labelText = q.likertLabels?.[level] || 
                          (level === 1 ? 'Hoàn toàn không đồng ý' :
                           level === 2 ? 'Không đồng ý' :
                           level === 3 ? 'Trung lập' :
                           level === 4 ? 'Đồng ý' : 'Hoàn toàn đồng ý');

                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleAnswerChange(q.code, level)}
                            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[70px] ${
                              isSelected
                                ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-[1.02]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span className="text-base sm:text-lg font-bold">{level}</span>
                            <span className={`text-[10px] leading-tight mt-1 line-clamp-2 ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                              {labelText}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. MATRIX LIKERT (Ma trận Likert trên Mobile vs Desktop) */}
                {q.type === 'matrix_likert' && q.matrixRows && (
                  <div className="mt-4 space-y-4">
                    {/* Desktop Table View (Hidden on mobile) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            <th className="py-3 px-3 text-slate-600 font-bold">Phát biểu</th>
                            {[1, 2, 3, 4, 5].map(v => (
                              <th key={v} className="py-3 px-2 text-center text-slate-700 font-bold w-16">
                                <div>{v}</div>
                                <div className="text-[9px] font-normal text-slate-400 mt-0.5 line-clamp-1">
                                  {v === 1 ? 'Rất không đồng ý' : v === 3 ? 'Trung lập' : v === 5 ? 'Rất đồng ý' : ''}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {q.matrixRows.map((row, rIdx) => {
                            const isRowAnswered = answers[row.code] !== undefined;
                            const rowHasError = !!errors[row.code];
                            return (
                              <tr 
                                key={rIdx} 
                                className={`border-b border-slate-100 transition-colors ${
                                  rowHasError ? 'bg-rose-50/50' : rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                }`}
                              >
                                <td className="py-3 px-3 text-slate-800 text-xs font-medium leading-relaxed">
                                  {row.label}
                                </td>
                                {[1, 2, 3, 4, 5].map(v => {
                                  const isSelected = answers[row.code] === v;
                                  return (
                                    <td key={v} className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleAnswerChange(row.code, v)}
                                        className={`w-7 h-7 rounded-full text-xs font-bold transition-all mx-auto flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-300'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                        }`}
                                      >
                                        {v}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Friendly Vertical Cards (Hidden on desktop) */}
                    <div className="md:hidden space-y-3">
                      {q.matrixRows.map((row, rIdx) => {
                        const rowHasError = !!errors[row.code];
                        return (
                          <div
                            key={rIdx}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              rowHasError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-slate-50/50'
                            }`}
                          >
                            <p className="text-xs font-medium text-slate-800 mb-2.5 leading-relaxed">
                              <span className="font-bold mr-1">{rIdx + 1}.</span>
                              {row.label}
                            </p>

                            <div className="grid grid-cols-5 gap-1.5">
                              {[1, 2, 3, 4, 5].map(v => {
                                const isSelected = answers[row.code] === v;
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={() => handleAnswerChange(row.code, v)}
                                    className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                                      isSelected
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {v}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 10. RATING (Đánh giá sao 1-5) */}
                {q.type === 'rating' && (
                  <div className="flex items-center gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const currentVal = answers[q.code] || 0;
                      const isFilled = starVal <= currentVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => handleAnswerChange(q.code, starVal)}
                          className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                        >
                          <Star 
                            className={`w-8 h-8 ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                          />
                        </button>
                      );
                    })}
                    {answers[q.code] && (
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {answers[q.code]} / 5 sao
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Navigation Footer */}
        <div className="pt-6 pb-12 flex items-center justify-between gap-4">
          {currentSectionIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrevSection}
              className="inline-flex items-center px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl shadow-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Quay lại
            </button>
          ) : <div />}

          {currentSectionIndex < totalSections - 1 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-2xl shadow-md transition-colors ml-auto"
            >
              Tiếp theo
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center px-8 py-3.5 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg transition-colors ml-auto disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Hoàn thành & Nộp bài
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-slate-400 py-4">
        Khảo sát Nghiên cứu Khoa học NCKH • Thu thập dữ liệu phục vụ học thuật
      </footer>
    </div>
  );
};
