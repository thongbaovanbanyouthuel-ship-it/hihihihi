// src/app/survey/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  Zap, 
  Sun, 
  RotateCcw, 
  ShieldCheck, 
  MapPin, 
  Fuel, 
  DollarSign, 
  BatteryCharging, 
  CheckCircle2, 
  Gift, 
  RotateCw, 
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BARRIERS, BWS_BIBD_SETS, ATTITUDE_ITEMS, ATTENTION_CHECK_ITEM, SUPPORT_POLICIES_F1 } from '@/lib/surveyData';

function SurveyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const channel = searchParams.get('ch') || 'online';
  const waveParam = searchParams.get('wave');
  const isWave1 = waveParam === '1';

  // Trạng thái tải cấu hình khởi tạo
  const [loading, setLoading] = useState(true);
  const [assignedOrder, setAssignedOrder] = useState<'A' | 'B'>('A');
  const [assignedBlock, setAssignedBlock] = useState<'K1' | 'K2' | 'K3'>('K1');
  const [wardsList, setWardsList] = useState<any[]>([]);
  const [dceDesignCards, setDceDesignCards] = useState<any[]>([]);

  // Lưu trữ tiến độ
  // Stage flow:
  // 'intro' -> 'screening' (S1-S7) -> 'disqualified'
  // -> 'context' (A1-A8) -> 'readiness' (RD1-RD5)
  // -> [If Order A: 'bws' -> 'dce_intro' -> 'dce']
  // -> [If Order B: 'dce_intro' -> 'dce' -> 'bws']
  // -> 'post_dce' (D9, D10, D11)
  // -> 'attitudes' (14 items + check)
  // -> 'demographics' (F1-F7)
  // -> 'thankyou'
  const [currentStage, setCurrentStage] = useState<string>('intro');
  const [startTime] = useState<number>(Date.now());

  // Sàng lọc S1 - S7
  const [screenStep, setScreenStep] = useState<number>(1);
  const [sAnswers, setSAnswers] = useState({
    S1: '', // Tuổi
    S2: '', // Sống/làm việc TP.HCM
    S3: '', // Thu nhập >= 7tr
    S4: '', // Tự chi trả
    S5: '', // Người quyết định mua xe
    S6: '', // Xe máy xăng
    S7: ''  // Chưa tham gia
  });

  // Bối cảnh A1 - A8
  const [aAnswers, setAAnswers] = useState({
    A1: '10–20 km',
    A2: 300, // Tiền xăng tháng (nghìn đồng) -> chèn vào DCE
    A3: 'Có, dễ dàng',
    A4: '', // Phường cư trú
    A5: '', // Phường làm việc
    A6: 'Vài lần mỗi tháng',
    A7: 'Có nghe qua',
    A8: 'Chuyển sang xe máy điện'
  });
  const [residenceWardSearch, setResidenceWardSearch] = useState('');
  const [workplaceWardSearch, setWorkplaceWardSearch] = useState('');

  // Sự sẵn sàng RD1 - RD5
  const [rdAnswers, setRdAnswers] = useState<Record<string, number>>({
    RD1: 3, RD2: 3, RD3: 3, RD4: 3, RD5: 5
  });

  // BWS State (13 sets)
  const [bwsSetIndex, setBwsSetIndex] = useState<number>(0);
  const [bwsShuffledOrder, setBwsShuffledOrder] = useState<string[]>([]);
  const [bwsAnswers, setBwsAnswers] = useState<Record<string, { best: string; worst: string }>>({});
  const [currentBwsItems, setCurrentBwsItems] = useState<string[]>([]);

  // DCE State (8 cards)
  const [dceCardIndex, setDceCardIndex] = useState<number>(0);
  const [dceShuffledCards, setDceShuffledCards] = useState<any[]>([]);
  const [dceChoices, setDceChoices] = useState<Array<{ cardNum: number; choice: number; certainty: number; peerChoice?: number }>>([]);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [selectedCertainty, setSelectedCertainty] = useState<number>(8);
  const [selectedPeer, setSelectedPeer] = useState<number | null>(null);
  const [hasOptedOutEver, setHasOptedOutEver] = useState(false);

  // Post DCE questions
  const [d9Ana, setD9Ana] = useState<string[]>([]);
  const [d10Realism, setD10Realism] = useState<number>(4);
  const [d11Reason, setD11Reason] = useState<string>('Xe xăng hiện tại vẫn còn tốt');
  const [d11Other, setD11Other] = useState<string>('');

  // Attitudes (14 Likert + Check)
  const [attitudeAnswers, setAttitudeAnswers] = useState<Record<string, number>>({
    SK1: 3, SK2: 3, SK3: 3, SK4: 3, SK5: 3, SK6: 3,
    FR1: 3, FR2: 3, FR3: 3, FR4: 3,
    SD1: 3, SD2: 3, SD3: 3, SD4: 3
  });
  const [checkAnswer, setCheckAnswer] = useState<string>('');

  // Demographics F1 - F7
  const [f1Policies, setF1Policies] = useState<string[]>(['Trợ giá của thành phố', 'Miễn lệ phí trước bạ']);
  const [f2Gender, setF2Gender] = useState<string>('Nam');
  const [f3Education, setF3Education] = useState<string>('Đại học');
  const [f4Occupation, setF4Occupation] = useState<string>('Nhân viên văn phòng');
  const [f5Income, setF5Income] = useState<string>('10 – dưới 15 triệu');
  const [f6Residual, setF6Residual] = useState<string>('1 – dưới 3 triệu');
  const [f7Budget, setF7Budget] = useState<string>('25 – dưới 35 triệu');

  // Lucky Draw modal
  const [luckyEmail, setLuckyEmail] = useState('');
  const [luckySubmitted, setLuckySubmitted] = useState(false);
  const [showLuckyModal, setShowLuckyModal] = useState(false);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(false);

  // Khởi tạo và nạp dữ liệu máy chủ
  useEffect(() => {
    async function initSurvey() {
      try {
        const res = await fetch(`/api/survey?ch=${channel}&wave=${waveParam || ''}`);
        const data = await res.json();
        if (data.success) {
          setAssignedOrder(data.config.assignedOrder);
          setAssignedBlock(data.config.assignedBlock);
          setWardsList(data.wards || []);

          // Xáo trộn 13 tập BWS
          const setKeys = Object.keys(BWS_BIBD_SETS);
          const shuffledSets = [...setKeys].sort(() => Math.random() - 0.5);
          setBwsShuffledOrder(shuffledSets);
          setCurrentBwsItems([...BWS_BIBD_SETS[shuffledSets[0]]].sort(() => Math.random() - 0.5));

          // Xáo trộn 8 thẻ DCE của khối được gán
          const cards = data.dceCards || [];
          // Nhóm theo thẻ (mỗi thẻ có A, B, OPT)
          const grouped: Record<number, any> = {};
          cards.forEach((c: any) => {
            const cardNum = Number(c.card);
            if (!grouped[cardNum]) grouped[cardNum] = { cardNum, isDominance: Number(c.is_dominance_check) === 1 };
            grouped[cardNum][c.alt] = c;
          });
          const cardList = Object.values(grouped).sort(() => Math.random() - 0.5);
          setDceShuffledCards(cardList);
        }
      } catch (err) {
        console.error('Error initializing survey:', err);
      } finally {
        setLoading(false);
      }
    }
    initSurvey();
  }, [channel, waveParam]);

  // Phường/xã đã chọn và cờ LEZ
  const selectedResWard = useMemo(() => wardsList.find(w => w.full_name === aAnswers.A4), [wardsList, aAnswers.A4]);
  const selectedWorkWard = useMemo(() => wardsList.find(w => w.full_name === aAnswers.A5), [wardsList, aAnswers.A5]);
  const lezResidence = selectedResWard ? selectedResWard.in_lez : false;
  const lezWorkplace = selectedWorkWard ? selectedWorkWard.in_lez : false;

  // Lọc tìm kiếm phường xã
  const filteredResWards = useMemo(() => {
    if (!residenceWardSearch) return wardsList.slice(0, 8);
    return wardsList.filter(w => w.full_name.toLowerCase().includes(residenceWardSearch.toLowerCase())).slice(0, 10);
  }, [wardsList, residenceWardSearch]);

  const filteredWorkWards = useMemo(() => {
    if (!workplaceWardSearch) return wardsList.slice(0, 8);
    return wardsList.filter(w => w.full_name.toLowerCase().includes(workplaceWardSearch.toLowerCase())).slice(0, 10);
  }, [wardsList, workplaceWardSearch]);

  // Tính thanh tiến trình chung (%)
  const progressPct = useMemo(() => {
    switch (currentStage) {
      case 'intro': return 5;
      case 'screening': return 10 + Math.round((screenStep / 7) * 10);
      case 'context': return 25;
      case 'readiness': return 35;
      case 'bws': return 40 + Math.round((bwsSetIndex / 13) * 20);
      case 'dce_intro': return 62;
      case 'dce': return 65 + Math.round((dceCardIndex / 8) * 15);
      case 'post_dce': return 82;
      case 'attitudes': return 88;
      case 'demographics': return 95;
      case 'thankyou': return 100;
      default: return 50;
    }
  }, [currentStage, screenStep, bwsSetIndex, dceCardIndex]);

  // Xử lý chuyển sàng lọc S1-S7
  const handleScreeningAnswer = (code: string, value: string, isDisqualify: boolean) => {
    setSAnswers(prev => ({ ...prev, [code]: value }));
    if (isDisqualify) {
      setCurrentStage('disqualified');
      return;
    }
    if (screenStep < 7) {
      setScreenStep(s => s + 1);
    } else {
      setCurrentStage('context');
    }
  };

  // Xử lý chuyển bài tập BWS
  const handleBwsPick = (itemCode: string, type: 'best' | 'worst') => {
    const currentSetId = bwsShuffledOrder[bwsSetIndex];
    const existing = bwsAnswers[currentSetId] || { best: '', worst: '' };
    const updated = { ...existing };

    if (type === 'best') {
      if (updated.worst === itemCode) updated.worst = ''; // Không cho chọn trùng
      updated.best = itemCode;
    } else {
      if (updated.best === itemCode) updated.best = ''; // Không cho chọn trùng
      updated.worst = itemCode;
    }

    setBwsAnswers({ ...bwsAnswers, [currentSetId]: updated });
  };

  const handleNextBws = () => {
    const currentSetId = bwsShuffledOrder[bwsSetIndex];
    const ans = bwsAnswers[currentSetId];
    if (!ans || !ans.best || !ans.worst) return;

    if (bwsSetIndex < 12) {
      const nextIndex = bwsSetIndex + 1;
      setBwsSetIndex(nextIndex);
      const nextSetId = bwsShuffledOrder[nextIndex];
      setCurrentBwsItems([...BWS_BIBD_SETS[nextSetId]].sort(() => Math.random() - 0.5));
    } else {
      // Đã xong 13 tập BWS
      if (isWave1) {
        // Đợt 1 bỏ qua DCE
        setCurrentStage('attitudes');
      } else {
        if (assignedOrder === 'A') {
          setCurrentStage('dce_intro');
        } else {
          // Order B đã làm DCE trước đó rồi
          setCurrentStage('attitudes');
        }
      }
    }
  };

  // Xử lý DCE Card Choice
  const handleNextDce = () => {
    if (selectedAlt === null) return;
    const currentCard = dceShuffledCards[dceCardIndex];
    const newChoice = {
      cardNum: currentCard.cardNum,
      choice: selectedAlt,
      certainty: selectedCertainty,
      peerChoice: (dceCardIndex === 2 || dceCardIndex === 5) ? (selectedPeer || undefined) : undefined
    };

    if (selectedAlt === 3) {
      setHasOptedOutEver(true);
    }

    const updatedChoices = [...dceChoices, newChoice];
    setDceChoices(updatedChoices);
    setSelectedAlt(null);
    setSelectedCertainty(8);
    setSelectedPeer(null);

    if (dceCardIndex < 7) {
      setDceCardIndex(i => i + 1);
    } else {
      // Đã xong 8 thẻ DCE
      setCurrentStage('post_dce');
    }
  };

  // Chuyển sau post_dce
  const handleNextPostDce = () => {
    if (assignedOrder === 'B' && Object.keys(bwsAnswers).length < 13) {
      setCurrentStage('bws');
    } else {
      setCurrentStage('attitudes');
    }
  };

  // Gửi toàn bộ khảo sát
  const submitSurvey = async () => {
    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Định dạng các lựa chọn DCE
      const dceCardResults = dceShuffledCards.map((card, idx) => {
        const choiceRecord = dceChoices.find(c => c.cardNum === card.cardNum) || { choice: 1, certainty: 8 };
        return {
          cardNum: card.cardNum,
          displayPos: idx + 1,
          isDominanceCheck: card.isDominance ? 1 : 0,
          choice: choiceRecord.choice,
          certainty: choiceRecord.certainty,
          peerChoice: choiceRecord.peerChoice,
          priceA: Number(card.A?.price || 24),
          batteryA: card.A?.battery || 'buy',
          energyA: card.A?.energy || 'grid',
          recycleA: card.A?.recycle || 'none',
          flex1A: card.A?.flex1 || '3km',
          flex2A: card.A?.flex2 || 'none',
          priceB: Number(card.B?.price || 30),
          batteryB: card.B?.battery || 'rent250',
          energyB: card.B?.energy || 'solar',
          recycleB: card.B?.recycle || '100audit',
          flex1B: card.B?.flex1 || 'home',
          flex2B: card.B?.flex2 || '60pct',
          lezFee: Number(card.OPT?.lez_fee || 100)
        };
      });

      // Định dạng 13 tập BWS
      const bwsResults = bwsShuffledOrder.map(setId => ({
        setId,
        items: BWS_BIBD_SETS[setId],
        bestItem: bwsAnswers[setId]?.best || '',
        worstItem: bwsAnswers[setId]?.worst || ''
      }));

      // Điểm trung bình các biến ẩn
      const skMean = Object.values(attitudeAnswers).slice(0, 6).reduce((a, b) => a + b, 0) / 6;
      const frMean = Object.values(attitudeAnswers).slice(6, 10).reduce((a, b) => a + b, 0) / 4;
      const sdMean = (attitudeAnswers.SD1 + (6 - attitudeAnswers.SD2) + attitudeAnswers.SD3 + (6 - attitudeAnswers.SD4)) / 4;

      const payload = {
        orderVersion: assignedOrder,
        dceBlock: assignedBlock,
        channel,
        durationSeconds,
        ageGroup: sAnswers.S1,
        age: sAnswers.S1 === '18-24' ? 22 : 27,
        gender: f2Gender,
        education: f3Education,
        occupation: f4Occupation,
        income: f5Income,
        residualIncome: f6Residual,
        dailyKm: aAnswers.A1,
        monthlyFuelCost: aAnswers.A2,
        homeCharging: aAnswers.A3,
        residenceWard: aAnswers.A4 || 'Phường Bến Nghé, Quận 1',
        workplaceWard: aAnswers.A5 || 'Phường Võ Thị Sáu, Quận 3',
        lezResidence,
        lezWorkplace,
        a6News: aAnswers.A6,
        a7LezKnow: aAnswers.A7,
        a8LezResponse: aAnswers.A8,
        rdScores: rdAnswers,
        skScores: {
          SK1: attitudeAnswers.SK1, SK2: attitudeAnswers.SK2, SK3: attitudeAnswers.SK3,
          SK4: attitudeAnswers.SK4, SK5: attitudeAnswers.SK5, SK6: attitudeAnswers.SK6
        },
        frScores: {
          FR1: attitudeAnswers.FR1, FR2: attitudeAnswers.FR2, FR3: attitudeAnswers.FR3, FR4: attitudeAnswers.FR4
        },
        sdScores: {
          SD1: attitudeAnswers.SD1, SD2: attitudeAnswers.SD2, SD3: attitudeAnswers.SD3, SD4: attitudeAnswers.SD4
        },
        attentionAnswer: checkAnswer,
        dceBlockChoices: dceChoices,
        dceCardResults,
        bwsResults,
        d9Ana: d9Ana.join('; '),
        d10Realism,
        d11Reason: d11Reason === 'Lý do khác' ? d11Other : d11Reason,
        f1Policies,
        f7Budget,
        skMean: Math.round(skMean * 100) / 100,
        frMean: Math.round(frMean * 100) / 100,
        sdMean: Math.round(sdMean * 100) / 100,
        likertAnswers14: [
          attitudeAnswers.SK1, attitudeAnswers.SK2, attitudeAnswers.SK3, attitudeAnswers.SK4, attitudeAnswers.SK5, attitudeAnswers.SK6,
          attitudeAnswers.FR1, attitudeAnswers.FR2, attitudeAnswers.FR3, attitudeAnswers.FR4,
          attitudeAnswers.SD1, attitudeAnswers.SD2, attitudeAnswers.SD3, attitudeAnswers.SD4
        ]
      };

      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmissionCompleted(true);
        setCurrentStage('thankyou');
      }
    } catch (e) {
      console.error('Error submitting survey:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Gửi email quay thưởng (Bảng riêng không liên kết)
  const submitLuckyDraw = async () => {
    if (!luckyEmail || !luckyEmail.includes('@')) return;
    try {
      const res = await fetch('/api/luckydraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: luckyEmail })
      });
      if (res.ok) {
        setLuckySubmitted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RotateCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Đang khởi tạo khảo sát khoa học...</p>
          <p className="text-xs text-slate-400 mt-1">Chuẩn bị khối thực nghiệm ngẫu nhiên cân bằng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-xl bg-white border-x border-slate-200">
      {/* Sticky Progress Bar */}
      {currentStage !== 'disqualified' && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="truncate">
              {currentStage === 'intro' && 'Giới thiệu & Đồng ý'}
              {currentStage === 'screening' && `Sàng lọc đối tượng (${screenStep}/7)`}
              {currentStage === 'context' && 'Bối cảnh đi lại TP.HCM'}
              {currentStage === 'readiness' && 'Sự sẵn sàng chuyển đổi'}
              {currentStage === 'bws' && `Rào cản xe điện (${bwsSetIndex + 1}/13)`}
              {currentStage === 'dce_intro' && 'Hướng dẫn lựa chọn xe'}
              {currentStage === 'dce' && `Thẻ lựa chọn (${dceCardIndex + 1}/8)`}
              {currentStage === 'post_dce' && 'Đánh giá sau lựa chọn'}
              {currentStage === 'attitudes' && 'Quan điểm & Nhận thức'}
              {currentStage === 'demographics' && 'Thông tin cá nhân & Chính sách'}
              {currentStage === 'thankyou' && 'Hoàn thành phiếu'}
            </span>
            <span className="text-sky-600 font-bold shrink-0">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Form Content Container */}
      <main className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* ===================== 1. INTRO & CONSENT ===================== */}
        {currentStage === 'intro' && (
          <div className="space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2 border border-sky-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-center text-slate-900 leading-snug">
              Khảo sát Sự sẵn sàng chuyển sang Xe máy điện tại TP.HCM
            </h2>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
              <p>
                Xin chào anh/chị! Chúng tôi là nhóm sinh viên thực hiện đề tài nghiên cứu khoa học về quan điểm của người trẻ tại TP.HCM đối với việc chuyển từ xe máy xăng sang xe máy điện. Khảo sát mất khoảng 18–20 phút. Không có câu trả lời đúng hay sai — chúng tôi chỉ mong nhận được suy nghĩ thật của anh/chị.
              </p>
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200/60 text-sky-900 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Khảo sát <strong>hoàn toàn ẩn danh</strong>. Thông tin chỉ được dùng cho mục đích học thuật và được bảo mật theo quy định hiện hành về bảo vệ dữ liệu cá nhân. Anh/chị có thể dừng bất cứ lúc nào.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCurrentStage('screening')}
                className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Tôi đồng ý tham gia</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentStage('disqualified')}
                className="w-full btn-mobile-touch rounded-xl bg-transparent text-slate-500 font-medium text-xs hover:bg-slate-100 transition-colors"
              >
                Không đồng ý (kết thúc)
              </button>
            </div>
          </div>
        )}

        {/* ===================== 2. SÀNG LỌC S1 - S7 ===================== */}
        {currentStage === 'screening' && (
          <div className="space-y-4 my-auto">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-sky-600">Câu hỏi sàng lọc {screenStep}/7</span>
              <span>Bấm là chuyển trang tự động</span>
            </div>

            {/* S1: Tuổi */}
            {screenStep === 1 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Anh/chị bao nhiêu tuổi?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S1', 'Dưới 18', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Dưới 18 tuổi</button>
                  <button onClick={() => handleScreeningAnswer('S1', '18-24', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">18 – 24 tuổi</button>
                  <button onClick={() => handleScreeningAnswer('S1', '25-30', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">25 – 30 tuổi</button>
                  <button onClick={() => handleScreeningAnswer('S1', 'Trên 30', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Trên 30 tuổi</button>
                </div>
              </div>
            )}

            {/* S2: Sống/làm việc tại TP.HCM */}
            {screenStep === 2 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Anh/chị hiện sống hoặc làm việc thường xuyên tại TP.HCM không?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S2', 'Có', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Có</button>
                  <button onClick={() => handleScreeningAnswer('S2', 'Không', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Không</button>
                </div>
              </div>
            )}

            {/* S3: Thu nhập cá nhân >= 7 triệu */}
            {screenStep === 3 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Thu nhập cá nhân hằng tháng của anh/chị từ lao động (toàn thời gian, bán thời gian, tự doanh, freelance) khoảng bao nhiêu?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S3', 'Từ 7 triệu đồng trở lên', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Từ 7 triệu đồng trở lên</button>
                  <button onClick={() => handleScreeningAnswer('S3', 'Dưới 7 triệu đồng', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Dưới 7 triệu đồng</button>
                </div>
              </div>
            )}

            {/* S4: Tự chi trả */}
            {screenStep === 4 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Anh/chị có tự chi trả phần lớn chi tiêu cá nhân hằng tháng (ăn ở, đi lại, sinh hoạt) không?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S4', 'Có', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Có</button>
                  <button onClick={() => handleScreeningAnswer('S4', 'Không', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Không</button>
                </div>
              </div>
            )}

            {/* S5: Người quyết định mua xe */}
            {screenStep === 5 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Ai là người quyết định việc mua phương tiện của anh/chị?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S5', 'Tôi tự quyết định', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Tôi tự quyết định</button>
                  <button onClick={() => handleScreeningAnswer('S5', 'Tôi cùng quyết định với gia đình/người thân', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Tôi cùng quyết định với gia đình/người thân</button>
                  <button onClick={() => handleScreeningAnswer('S5', 'Người khác quyết định', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Người khác quyết định</button>
                </div>
              </div>
            )}

            {/* S6: Phương tiện thường dùng nhất */}
            {screenStep === 6 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Phương tiện anh/chị sử dụng thường xuyên nhất là gì?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S6', 'Xe máy xăng', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Xe máy xăng</button>
                  <button onClick={() => handleScreeningAnswer('S6', 'Xe máy điện', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Xe máy điện</button>
                  <button onClick={() => handleScreeningAnswer('S6', 'Phương tiện khác', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Phương tiện khác (ô tô, xe buýt, metro, xe công nghệ, xe đạp)</button>
                </div>
              </div>
            )}

            {/* S7: Đã từng tham gia */}
            {screenStep === 7 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <h3 className="text-base font-bold text-slate-900">Anh/chị đã từng tham gia khảo sát hoặc phỏng vấn của đề tài này chưa?</h3>
                <div className="space-y-2 pt-2">
                  <button onClick={() => handleScreeningAnswer('S7', 'Chưa', false)} className="w-full p-4 rounded-xl border-2 border-sky-600/30 hover:border-sky-600 bg-sky-50/40 text-left text-sm font-semibold text-sky-900 transition-colors">Chưa</button>
                  <button onClick={() => handleScreeningAnswer('S7', 'Đã tham gia', true)} className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 text-left text-sm font-medium transition-colors">Đã tham gia</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== 3. KHÔNG ĐỦ ĐIỀU KIỆN (DISQUALIFIED) ===================== */}
        {currentStage === 'disqualified' && (
          <div className="space-y-4 my-auto text-center py-8">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không đủ điều kiện tham gia</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Cảm ơn anh/chị đã quan tâm. Khảo sát này dành cho người trẻ 18–30 tuổi đang sử dụng xe máy xăng và tự chủ tài chính tại TP.HCM. Rất tiếc anh/chị không thuộc nhóm đối tượng của nghiên cứu.
            </p>
            <div className="pt-4">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Quay về Trang chủ
              </button>
            </div>
          </div>
        )}

        {/* ===================== 4. BỐI CẢNH ĐI LẠI (A1 - A8) ===================== */}
        {currentStage === 'context' && (
          <div className="space-y-5 my-auto pb-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">Phần A: Bối cảnh đi lại hằng ngày</h2>
              <p className="text-xs text-slate-500">Giúp nhóm nghiên cứu hiểu rõ điều kiện di chuyển thực tế của anh/chị</p>
            </div>

            {/* A1: km/ngày */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A1. Trung bình mỗi ngày anh/chị đi bao nhiêu km bằng xe máy?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Dưới 10 km', '10–20 km', '20–40 km', 'Trên 40 km'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAAnswers(prev => ({ ...prev, A1: opt }))}
                    className={`p-3 rounded-lg text-xs font-medium border text-left transition-colors ${
                      aAnswers.A1 === opt ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* A2: Tiền xăng tháng */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A2. Mỗi tháng anh/chị chi khoảng bao nhiêu tiền xăng? (nghìn đồng)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={aAnswers.A2}
                  onChange={e => setAAnswers(prev => ({ ...prev, A2: Number(e.target.value) || 300 }))}
                  className="w-36 p-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-sky-600"
                />
                <span className="text-xs text-slate-500">nghìn đồng/tháng (ví dụ 300 = 300.000 đ)</span>
              </div>
              <p className="text-[11px] text-sky-700 italic">
                * Giá trị này sẽ được hiển thị vào phương án “Giữ xe xăng” trong các thẻ lựa chọn phương tiện tiếp theo.
              </p>
            </div>

            {/* A3: Sạc qua đêm tại nơi ở */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A3. Tại nơi ở, anh/chị có thể sạc xe điện qua đêm không?
              </label>
              <div className="space-y-1.5">
                {[
                  'Có, dễ dàng',
                  'Có nhưng bị hạn chế (phí, giờ, chủ nhà/ban quản lý không cho)',
                  'Không',
                  'Không biết'
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAAnswers(prev => ({ ...prev, A3: opt }))}
                    className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      aAnswers.A3 === opt ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* A4: Phường/xã cư trú */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                A4. Anh/chị đang cư trú tại phường/xã nào ở TP.HCM?
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tìm kiếm phường/xã hoặc quận..."
                  value={residenceWardSearch}
                  onChange={e => setResidenceWardSearch(e.target.value)}
                  className="w-full p-2 pl-8 rounded-lg border border-slate-300 text-xs focus:outline-sky-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                {filteredResWards.map(w => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setAAnswers(prev => ({ ...prev, A4: w.full_name }));
                      setResidenceWardSearch(w.full_name);
                    }}
                    className={`p-2 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 ${
                      aAnswers.A4 === w.full_name ? 'bg-sky-50 font-bold text-sky-900' : 'text-slate-700'
                    }`}
                  >
                    <span>{w.full_name}</span>
                    {w.in_lez && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 font-semibold">LEZ</span>}
                  </div>
                ))}
              </div>
              {selectedResWard && (
                <p className="text-[11px] text-slate-500">
                  Đã chọn: <strong className="text-slate-800">{selectedResWard.full_name}</strong> {lezResidence ? '(Vùng phát thải thấp LEZ)' : '(Ngoài vùng LEZ)'}
                </p>
              )}
            </div>

            {/* A5: Phường/xã làm việc */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                A5. Anh/chị làm việc tại phường/xã nào ở TP.HCM?
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tìm kiếm nơi làm việc..."
                  value={workplaceWardSearch}
                  onChange={e => setWorkplaceWardSearch(e.target.value)}
                  className="w-full p-2 pl-8 rounded-lg border border-slate-300 text-xs focus:outline-sky-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                <div
                  onClick={() => {
                    setAAnswers(prev => ({ ...prev, A5: 'Không có nơi làm việc cố định' }));
                    setWorkplaceWardSearch('Không có nơi làm việc cố định');
                  }}
                  className={`p-2 text-xs cursor-pointer hover:bg-slate-50 ${
                    aAnswers.A5 === 'Không có nơi làm việc cố định' ? 'bg-sky-50 font-bold text-sky-900' : 'text-slate-700'
                  }`}
                >
                  Không có nơi làm việc cố định
                </div>
                {filteredWorkWards.map(w => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setAAnswers(prev => ({ ...prev, A5: w.full_name }));
                      setWorkplaceWardSearch(w.full_name);
                    }}
                    className={`p-2 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 ${
                      aAnswers.A5 === w.full_name ? 'bg-sky-50 font-bold text-sky-900' : 'text-slate-700'
                    }`}
                  >
                    <span>{w.full_name}</span>
                    {w.in_lez && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 font-semibold">LEZ</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* A6: Đọc tin tức */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A6. Anh/chị có thường đọc tin tức về xe điện, năng lượng hoặc môi trường không?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Hầu như không', 'Vài lần mỗi tháng', 'Vài lần mỗi tuần', 'Hằng ngày'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAAnswers(prev => ({ ...prev, A6: opt }))}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      aAnswers.A6 === opt ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* A7: Nhận biết đề án LEZ */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A7. Anh/chị có biết TP.HCM dự kiến lập vùng phát thải thấp (LEZ), hạn chế xe máy xăng vào khu trung tâm không?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Biết rõ', 'Có nghe qua', 'Chưa biết'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAAnswers(prev => ({ ...prev, A7: opt }))}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                      aAnswers.A7 === opt ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* INFO: Khung thông tin LEZ */}
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Thông tin tham khảo về Đề án LEZ TP.HCM</span>
              </div>
              <p className="leading-relaxed">
                Theo đề án đang được TP.HCM xây dựng, vùng phát thải thấp (LEZ) dự kiến được thí điểm tại khu lõi trung tâm và Thủ Thiêm từ tháng 7/2027; xe máy cá nhân sẽ từng bước phải đáp ứng tiêu chuẩn khí thải cao hơn và dự kiến chuyển sang điện hoặc năng lượng xanh trong LEZ vào năm 2035. Các mốc này hiện vẫn là đề xuất.
              </p>
            </div>

            {/* A8: Dự kiến ứng phó */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                A8. Nếu LEZ được áp dụng tại nơi anh/chị thường đi qua, anh/chị dự kiến ứng phó chủ yếu bằng cách nào?
              </label>
              <div className="space-y-1.5">
                {[
                  'Chuyển sang xe máy điện',
                  'Gửi xe ở rìa vùng rồi đi bộ, xe buýt hoặc metro vào trung tâm',
                  'Chuyển hẳn sang giao thông công cộng',
                  'Chấp nhận nộp phụ phí và tiếp tục đi xe xăng',
                  'Thay đổi nơi ở hoặc nơi làm việc',
                  'Không bị ảnh hưởng'
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAAnswers(prev => ({ ...prev, A8: opt }))}
                    className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      aAnswers.A8 === opt ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStage('readiness')}
              className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Tiếp tục sang Phần Sự sẵn sàng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 5. SỰ SẴN SÀNG CHUYỂN ĐỔI (RD1 - RD5) ===================== */}
        {currentStage === 'readiness' && (
          <div className="space-y-5 my-auto pb-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">Phần B: Sự sẵn sàng chuyển đổi</h2>
              <p className="text-xs text-slate-500">Mỗi nhận định bấm vào 1 trong 5 mức độ bên dưới (1 = Hoàn toàn không đồng ý ... 5 = Hoàn toàn đồng ý)</p>
            </div>

            {/* RD1 - RD4 (5 nút bấm ngang trên từng thẻ) */}
            {[
              { id: 'RD1', text: 'Tôi sẵn sàng chuyển sang xe máy điện nếu có điều kiện phù hợp' },
              { id: 'RD2', text: 'Tôi đã bắt đầu tìm hiểu giá, mẫu mã hoặc chính sách của xe máy điện' },
              { id: 'RD3', text: 'Tôi sẽ cân nhắc xe máy điện cho lần đổi xe tiếp theo' },
              { id: 'RD4', text: 'Tôi sẵn sàng giới thiệu xe máy điện cho bạn bè, đồng nghiệp' }
            ].map((item, idx) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {idx + 1}. {item.text}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRdAnswers(prev => ({ ...prev, [item.id]: level }))}
                      className={`h-11 rounded-lg text-xs font-bold transition-colors ${
                        rdAnswers[item.id] === level
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                  <span>Hoàn toàn không đồng ý (1)</span>
                  <span>Đồng ý hoàn toàn (5)</span>
                </div>
              </div>
            ))}

            {/* RD5 (Thang 0-10) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <p className="text-xs font-semibold text-slate-800 leading-snug">
                5. Khả năng anh/chị chuyển sang xe máy điện trong 2 năm tới là bao nhiêu?
              </p>
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                <span>Điểm chọn: {rdAnswers.RD5}/10</span>
                <span>{rdAnswers.RD5 >= 8 ? 'Rất cao' : (rdAnswers.RD5 >= 5 ? 'Trung bình' : 'Thấp')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={rdAnswers.RD5}
                onChange={e => setRdAnswers(prev => ({ ...prev, RD5: Number(e.target.value) }))}
                className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 = Chắc chắn không</span>
                <span>5 = 50/50</span>
                <span>10 = Chắc chắn có</span>
              </div>
            </div>

            <button
              onClick={() => {
                // Nhánh phân phiên bản thứ tự
                if (assignedOrder === 'A') {
                  setCurrentStage('bws');
                } else {
                  setCurrentStage('dce_intro');
                }
              }}
              className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>{assignedOrder === 'A' ? 'Tiếp tục sang Phần BWS (Rào cản)' : 'Tiếp tục sang Phần DCE (Lựa chọn xe)'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 6. BWS (13 TẬP BIBD) ===================== */}
        {currentStage === 'bws' && (
          <div className="space-y-4 my-auto pb-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wide">Nhóm rào cản {bwsSetIndex + 1}/13</span>
                <h3 className="text-sm font-bold text-slate-900">Hãy chọn 1 Cản trở nhiều nhất và 1 Cản trở ít nhất</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Trong 4 lý do dưới đây, hãy bấm <ThumbsUp className="w-3.5 h-3.5 text-sky-700 inline" /> <strong>Nhiều nhất</strong> cho lý do cản trở lớn nhất, và <ThumbsDown className="w-3.5 h-3.5 text-slate-600 inline" /> <strong>Ít nhất</strong> cho lý do cản trở nhỏ nhất.
            </p>

            {/* 4 Barrier Cards */}
            <div className="space-y-2.5">
              {currentBwsItems.map(itemCode => {
                const bInfo = BARRIERS.find(b => b.code === itemCode);
                const currentSetId = bwsShuffledOrder[bwsSetIndex];
                const setAns = bwsAnswers[currentSetId] || { best: '', worst: '' };
                const isBest = setAns.best === itemCode;
                const isWorst = setAns.worst === itemCode;

                return (
                  <div 
                    key={itemCode}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isBest 
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs' 
                        : (isWorst ? 'border-amber-600 bg-amber-50/40' : 'border-slate-200 bg-white')
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 mb-3 leading-snug">
                      {bInfo?.label}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBwsPick(itemCode, 'best')}
                        className={`h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          isBest 
                            ? 'bg-sky-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Nhiều nhất</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBwsPick(itemCode, 'worst')}
                        className={`h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          isWorst 
                            ? 'bg-amber-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Ít nhất</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trạng thái đã chọn đủ */}
            {(() => {
              const currentSetId = bwsShuffledOrder[bwsSetIndex];
              const ans = bwsAnswers[currentSetId];
              const isComplete = Boolean(ans && ans.best && ans.worst);

              return (
                <button
                  type="button"
                  disabled={!isComplete}
                  onClick={handleNextBws}
                  className={`w-full btn-mobile-touch rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${
                    isComplete 
                      ? 'bg-sky-600 text-white hover:bg-sky-700 active:scale-98 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>{bwsSetIndex < 12 ? 'Xác nhận & Sang Nhóm tiếp theo' : 'Hoàn thành 13 nhóm BWS'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              );
            })()}
          </div>
        )}

        {/* ===================== 7. DCE INTRO & HƯỚNG DẪN ===================== */}
        {currentStage === 'dce_intro' && (
          <div className="space-y-4 my-auto pb-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-1 border border-sky-100">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-center text-slate-900 leading-snug">
              Thực nghiệm Lựa chọn Phương tiện (DCE)
            </h2>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-2.5 leading-relaxed">
              <p><strong>Tình huống:</strong> Chiếc xe máy xăng anh/chị đang dùng cần được thay thế. Trên thị trường có các phương án xe máy điện với đặc điểm khác nhau. Anh/chị sẽ chọn phương án nào?</p>
              
              <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                <li>Hãy tưởng tượng anh/chị đang thực sự phải chi trả số tiền này từ ngân sách cá nhân của mình.</li>
                <li>Kết quả tổng hợp sẽ gửi tới cơ quan hoạch định giao thông TP.HCM để hỗ trợ đề xuất chính sách thực tế.</li>
                <li>“Phụ phí phát thải khi đi vào vùng LEZ” là kịch bản giả định học thuật, không phải chính sách đã ban hành.</li>
                <li>Nếu không phương án xe điện nào đủ hấp dẫn, anh/chị hãy chọn <strong>“Tiếp tục dùng xe xăng hiện tại”</strong>.</li>
              </ul>
            </div>

            {/* Bảng chú giải biểu tượng */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-800 block mb-1">Chú giải các đặc điểm:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" /><span>Giá mua ban đầu (chưa pin)</span></div>
                <div className="flex items-center gap-1.5"><BatteryCharging className="w-3.5 h-3.5 text-blue-600 shrink-0" /><span>Gói pin & Chi phí tháng</span></div>
                <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span>Điện mặt trời tại trạm</span></div>
                <div className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" /><span>Cam kết tái chế pin</span></div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span>Khoảng cách trạm sạc</span></div>
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" /><span>Bảo hành / Chống nước</span></div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStage('dce')}
              className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Bắt đầu xem 8 Thẻ lựa chọn</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 8. DCE (8 THẺ LỰA CHỌN) ===================== */}
        {currentStage === 'dce' && dceShuffledCards.length > 0 && (
          <div className="space-y-4 my-auto pb-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wide">Thẻ lựa chọn {dceCardIndex + 1}/8</span>
                <h3 className="text-sm font-bold text-slate-900">Anh/chị sẽ chọn phương án nào dưới đây?</h3>
              </div>
            </div>

            {/* 3 Thẻ phương án có TRỌNG LƯỢNG THỊ GIÁC HOÀN TOÀN TƯƠNG ĐƯƠNG */}
            {(() => {
              const card = dceShuffledCards[dceCardIndex];
              const altA = card.A;
              const altB = card.B;
              const altOpt = card.OPT;

              const formatBattery = (b: string) => {
                if (b === 'buy') return 'Mua đứt pin (0 đ/tháng)';
                if (b === 'rent150') return 'Thuê pin 150.000 đ/tháng';
                if (b === 'rent250') return 'Thuê pin 250.000 đ/tháng';
                if (b === 'rent350') return 'Thuê pin 350.000 đ/tháng';
                return b;
              };

              const formatEnergy = (e: string) => {
                if (e === 'solar') return 'Trạm dùng điện mặt trời áp mái (công khai tỷ lệ)';
                return 'Lưới điện thông thường';
              };

              const formatRecycle = (r: string) => {
                if (r === '100audit') return 'Thu hồi 100% pin cũ có kiểm toán độc lập';
                if (r === 'cert50') return 'Thu hồi 50% pin có chứng nhận';
                return 'Không công bố cam kết tái chế';
              };

              const formatFlex1 = (f: string) => {
                if (f === 'home') return 'Trạm sạc: Ngay tại nơi ở / nơi làm việc';
                if (f === '1km') return 'Trạm sạc: Cách 1 km';
                if (f === '3km') return 'Trạm sạc: Cách 3 km';
                return `Đặc điểm 1: ${f}`;
              };

              const formatFlex2 = (f: string) => {
                if (f === '60pct') return 'Cam kết mua lại: 60% giá gốc sau 3 năm';
                if (f === '40pct') return 'Cam kết mua lại: 40% giá gốc sau 3 năm';
                if (f === 'none') return 'Cam kết mua lại: Không có';
                if (f === '8yr') return 'Bảo hành pin: 8 năm';
                if (f === '5yr') return 'Bảo hành pin: 5 năm';
                if (f === '3yr') return 'Bảo hành pin: 3 năm';
                return `Đặc điểm 2: ${f}`;
              };

              return (
                <div className="space-y-3">
                  {/* Xe điện A */}
                  <div
                    onClick={() => setSelectedAlt(1)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAlt === 1 ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-600/20' : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Phương án 1: Xe máy điện A</span>
                      {selectedAlt === 1 && <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Đã chọn</span>}
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>Giá mua xe: <strong>{altA.price} triệu đồng</strong></span></div>
                      <div className="flex items-center gap-2"><BatteryCharging className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatBattery(altA.battery)}</span></div>
                      <div className="flex items-center gap-2"><Sun className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatEnergy(altA.energy)}</span></div>
                      <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatRecycle(altA.recycle)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatFlex1(altA.flex1)}</span></div>
                      <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatFlex2(altA.flex2)}</span></div>
                    </div>
                  </div>

                  {/* Xe điện B */}
                  <div
                    onClick={() => setSelectedAlt(2)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAlt === 2 ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-600/20' : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Phương án 2: Xe máy điện B</span>
                      {selectedAlt === 2 && <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Đã chọn</span>}
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>Giá mua xe: <strong>{altB.price} triệu đồng</strong></span></div>
                      <div className="flex items-center gap-2"><BatteryCharging className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatBattery(altB.battery)}</span></div>
                      <div className="flex items-center gap-2"><Sun className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatEnergy(altB.energy)}</span></div>
                      <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatRecycle(altB.recycle)}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatFlex1(altB.flex1)}</span></div>
                      <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{formatFlex2(altB.flex2)}</span></div>
                    </div>
                  </div>

                  {/* Tiếp tục giữ xe xăng hiện tại (ĐÚNG kích thước, ĐÚNG kiểu thẻ, KHÔNG bị thu nhỏ hay làm mờ) */}
                  <div
                    onClick={() => setSelectedAlt(3)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAlt === 3 ? 'border-sky-600 bg-sky-50/50 shadow-md ring-2 ring-sky-600/20' : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">Phương án 3: Tiếp tục dùng xe xăng hiện tại</span>
                      {selectedAlt === 3 && <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Đã chọn</span>}
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>Không tốn thêm tiền mua xe</span></div>
                      <div className="flex items-center gap-2"><Fuel className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>Tiền xăng: như hiện tại ({aAnswers.A2}.000 đ/tháng)</span></div>
                      <div className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>Phụ phí khi đi vào LEZ: <strong>{altOpt.lez_fee === '0' ? '0 đ/tháng' : `${altOpt.lez_fee}.000 đ/tháng`}</strong></span></div>
                      <div className="text-[11px] text-slate-400 pt-1">Giữ nguyên thói quen đổ xăng, sửa chữa và chi phí vận hành quen thuộc</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Câu hỏi chắc chắn (1-10) */}
            {selectedAlt !== null && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Anh/chị chắc chắn thế nào về lựa chọn vừa rồi?</span>
                  <span className="text-sky-700 font-bold">{selectedCertainty}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={selectedCertainty}
                  onChange={e => setSelectedCertainty(Number(e.target.value))}
                  className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 = Rất không chắc</span>
                  <span>10 = Hoàn toàn chắc chắn</span>
                </div>
              </div>
            )}

            {/* Câu hỏi đồng đẳng (Peer Question) ở vị trí hiển thị thứ 3 và thứ 6 */}
            {(dceCardIndex === 2 || dceCardIndex === 5) && selectedAlt !== null && (
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-sky-900 block">
                  Theo anh/chị, một người trẻ điển hình ở TP.HCM sẽ chọn phương án nào trong thẻ này?
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Xe điện A', 'Xe điện B', 'Tiếp tục đi xe xăng'].map((pLabel, pIdx) => (
                    <button
                      key={pLabel}
                      type="button"
                      onClick={() => setSelectedPeer(pIdx + 1)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                        selectedPeer === (pIdx + 1) ? 'bg-sky-600 text-white font-bold border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={selectedAlt === null}
              onClick={handleNextDce}
              className={`w-full btn-mobile-touch rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 ${
                selectedAlt !== null 
                  ? 'bg-sky-600 text-white hover:bg-sky-700 active:scale-98 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{dceCardIndex < 7 ? 'Xác nhận & Sang Thẻ tiếp theo' : 'Hoàn thành 8 thẻ lựa chọn'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 9. POST DCE QUESTIONS (D9, D10, D11) ===================== */}
        {currentStage === 'post_dce' && (
          <div className="space-y-4 my-auto pb-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">Đánh giá các phương án xe vừa xem</h2>
              <p className="text-xs text-slate-500">Giúp nhà nghiên cứu kiểm tra mức độ quan tâm thuộc tính</p>
            </div>

            {/* D9: Thuộc tính bỏ qua */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                D9. Khi chọn, anh/chị có bỏ qua hoàn toàn đặc điểm nào không? (chọn nhiều phương án)
              </label>
              <div className="space-y-1.5">
                {[
                  'Giá mua xe',
                  'Pin và chi phí thuê/mua hằng tháng',
                  'Nguồn năng lượng tại trạm sạc',
                  'Cam kết tái chế pin',
                  'Khoảng cách tới trạm sạc',
                  'Cam kết mua lại / Bảo hành pin',
                  'Phụ phí phát thải LEZ',
                  'Không bỏ qua đặc điểm nào'
                ].map(opt => {
                  const isChecked = d9Ana.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (opt === 'Không bỏ qua đặc điểm nào') {
                          setD9Ana(['Không bỏ qua đặc điểm nào']);
                        } else {
                          const withoutNone = d9Ana.filter(x => x !== 'Không bỏ qua đặc điểm nào');
                          if (isChecked) {
                            setD9Ana(withoutNone.filter(x => x !== opt));
                          } else {
                            setD9Ana([...withoutNone, opt]);
                          }
                        }
                      }}
                      className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors flex items-center justify-between ${
                        isChecked ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-sky-700" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D10: Tính thực tế */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                D10. Các phương án xe điện anh/chị vừa xem có thực tế không?
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setD10Realism(lvl)}
                    className={`h-11 rounded-lg text-xs font-bold transition-colors ${
                      d10Realism === lvl ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 = Rất không thực tế</span>
                <span>5 = Rất thực tế</span>
              </div>
            </div>

            {/* D11: Chỉ hiện nếu từng chọn Giữ xe xăng */}
            {hasOptedOutEver && (
              <div className="space-y-2 p-3 bg-amber-50/50 rounded-xl border border-amber-200 animate-in fade-in duration-150">
                <label className="text-xs font-semibold text-amber-950 block">
                  D11. Lý do chính khiến anh/chị chọn tiếp tục dùng xe xăng trong các thẻ vừa rồi là gì?
                </label>
                <div className="space-y-1.5">
                  {[
                    'Không đủ khả năng tài chính để mua xe điện lúc này',
                    'Xe xăng hiện tại vẫn còn tốt',
                    'Không tin xe điện thực sự thân thiện với môi trường',
                    'Lo ngại rủi ro về pin và giá trị bán lại',
                    'Chờ chính sách LEZ rõ ràng hơn',
                    'Lý do khác'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setD11Reason(opt)}
                      className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                        d11Reason === opt ? 'border-amber-600 bg-amber-100 text-amber-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {d11Reason === 'Lý do khác' && (
                  <input
                    type="text"
                    placeholder="Nhập lý do khác của anh/chị..."
                    value={d11Other}
                    onChange={e => setD11Other(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs focus:outline-amber-600 mt-2 bg-white"
                  />
                )}
              </div>
            )}

            <button
              onClick={handleNextPostDce}
              className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Tiếp tục</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 10. QUAN ĐIỂM (14 LIKERT + CÂU KIỂM TRA CHÚ Ý) ===================== */}
        {currentStage === 'attitudes' && (
          <div className="space-y-5 my-auto pb-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">Phần C: Quan điểm & Nhận thức</h2>
              <p className="text-xs text-slate-500">Mỗi nhận định bấm vào 1 trong 5 mức độ (1 = Hoàn toàn không đồng ý ... 5 = Hoàn toàn đồng ý)</p>
            </div>

            {/* 14 items */}
            {ATTITUDE_ITEMS.map((item, idx) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {idx + 1}. {item.text}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAttitudeAnswers(prev => ({ ...prev, [item.id]: level }))}
                      className={`h-11 rounded-lg text-xs font-bold transition-colors ${
                        attitudeAnswers[item.id] === level
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Câu kiểm tra chú ý CHECK */}
            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-300 space-y-2.5 shadow-2xs">
              <p className="text-xs font-bold text-slate-900 leading-snug">
                15. {ATTENTION_CHECK_ITEM.question}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ATTENTION_CHECK_ITEM.options.map(colorOpt => (
                  <button
                    key={colorOpt}
                    type="button"
                    onClick={() => setCheckAnswer(colorOpt)}
                    className={`p-3 rounded-lg text-xs font-bold border transition-colors ${
                      checkAnswer === colorOpt ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {colorOpt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setCurrentStage('demographics')}
              className="w-full btn-mobile-touch rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>Tiếp tục sang Thông tin cá nhân</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===================== 11. THÔNG TIN CÁ NHÂN & CHÍNH SÁCH (F1 - F7) ===================== */}
        {currentStage === 'demographics' && (
          <div className="space-y-4 my-auto pb-4 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">Phần D: Chính sách hỗ trợ & Thông tin chung</h2>
              <p className="text-xs text-slate-500">Phần cuối cùng để hoàn tất phiếu khảo sát</p>
            </div>

            {/* F1: Tối đa 3 hỗ trợ */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                F1. Chọn tối đa 3 hỗ trợ giúp anh/chị chuyển sang xe máy điện nhiều nhất:
              </label>
              <div className="space-y-1.5">
                {SUPPORT_POLICIES_F1.map(pol => {
                  const isChecked = f1Policies.includes(pol);
                  return (
                    <button
                      key={pol}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setF1Policies(f1Policies.filter(p => p !== pol));
                        } else if (f1Policies.length < 3) {
                          setF1Policies([...f1Policies, pol]);
                        }
                      }}
                      className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors flex items-center justify-between ${
                        isChecked ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{pol}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-sky-700" />}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500">Đã chọn: {f1Policies.length}/3 chính sách</span>
            </div>

            {/* F2: Giới tính */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">F2. Giới tính:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Nam', 'Nữ', 'Khác/Không muốn trả lời'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF2Gender(opt)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                      f2Gender === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* F3: Học vấn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">F3. Trình độ học vấn cao nhất:</label>
              <div className="grid grid-cols-2 gap-2">
                {['THPT trở xuống', 'Trung cấp/Cao đẳng', 'Đại học', 'Sau đại học'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF3Education(opt)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      f3Education === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* F4: Nghề nghiệp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">F4. Nghề nghiệp chính:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Nhân viên văn phòng', 'Kỹ thuật/sản xuất', 'Kinh doanh, bán hàng',
                  'Tự doanh/freelance', 'Tài xế công nghệ, giao hàng', 'Sinh viên có việc làm', 'Khác'
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF4Occupation(opt)}
                    className={`p-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                      f4Occupation === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* F5: Thu nhập */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">F5. Thu nhập cá nhân hằng tháng:</label>
              <div className="space-y-1.5">
                {[
                  '7 – dưới 10 triệu', '10 – dưới 15 triệu', '15 – dưới 20 triệu',
                  '20 – dưới 30 triệu', 'Từ 30 triệu trở lên'
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF5Income(opt)}
                    className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      f5Income === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* F6: Thu nhập còn lại */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                F6. Sau khi trả chi phí thiết yếu, mỗi tháng còn dư khoảng:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Hầu như không dư', 'Dưới 1 triệu', '1 – dưới 3 triệu', '3 – dưới 5 triệu', 'Từ 5 triệu trở lên'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF6Residual(opt)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      f6Residual === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* F7: Ngân sách tối đa */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                F7. Nếu mua xe máy điện, số tiền tối đa anh/chị có thể chi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Dưới 15 triệu', '15 – dưới 25 triệu', '25 – dưới 35 triệu', 'Từ 35 triệu trở lên'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setF7Budget(opt)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      f7Budget === opt ? 'bg-sky-50 border-sky-600 font-bold text-sky-900' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Nút gửi phiếu */}
            <button
              onClick={submitSurvey}
              disabled={submitting}
              className="w-full btn-mobile-touch rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg hover:bg-emerald-700 active:scale-98 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Đang gửi phiếu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất & Gửi phiếu khảo sát</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ===================== 12. TRANG CẢM ƠN (THANK YOU) ===================== */}
        {currentStage === 'thankyou' && (
          <div className="space-y-5 my-auto text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              Xin chân thành cảm ơn anh/chị!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              Đóng góp của anh/chị là nguồn dữ liệu quý giá giúp hoàn thiện đề tài nghiên cứu khoa học về quá trình chuyển đổi giao thông xanh tại TP.HCM.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
              <strong className="text-slate-800 block">Giải thích thêm về kịch bản:</strong>
              <p>
                Mức phụ phí phát thải khi vào vùng LEZ và một số đặc điểm xe máy điện trong phần lựa chọn phương tiện là các kịch bản giả định do nhóm nghiên cứu xây dựng, không phải sản phẩm hay chính sách đã được ban hành trên thị trường.
              </p>
            </div>

            {/* Nút Rút thăm trúng thưởng */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLuckyModal(true)}
                className="w-full btn-mobile-touch rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>Tham gia rút thăm quà tặng lưu niệm</span>
              </button>
            </div>

            {/* Chế độ Tablet cho khảo sát trực tiếp (?ch=offline) */}
            {channel === 'offline' && (
              <div className="pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full btn-mobile-touch rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Bắt đầu phiếu mới (Chế độ Tablet)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lucky Draw Decoupled Modal */}
      {showLuckyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <Gift className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Rút thăm Quà tặng Lưu niệm</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Vui lòng nhập email để nhóm nghiên cứu gửi thông báo kết quả quay thưởng. 
              <br />
              <strong className="text-sky-700">Lưu ý bảo mật:</strong> Email này được lưu ở một bảng riêng, hoàn toàn không có khóa liên kết với câu trả lời của anh/chị.
            </p>

            {luckySubmitted ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold text-center mb-3">
                Đã ghi nhận email thành công! Chúc anh/chị may mắn.
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email của anh/chị..."
                  value={luckyEmail}
                  onChange={e => setLuckyEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-sky-600"
                />
                <button
                  type="button"
                  onClick={submitLuckyDraw}
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                >
                  Xác nhận tham gia
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLuckyModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SurveyPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RotateCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Đang khởi tạo khảo sát khoa học...</p>
        </div>
      </div>
    }>
      <SurveyContent />
    </React.Suspense>
  );
}
