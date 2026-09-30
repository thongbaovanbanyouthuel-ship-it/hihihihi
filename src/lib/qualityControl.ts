// src/lib/qualityControl.ts
// Thuật toán kiểm soát chất lượng dữ liệu, gắn cờ tự động và phân nhóm cân bằng động

export function allocateOrderVersion(countA: number, countB: number): 'A' | 'B' {
  if (countA < countB) return 'A';
  if (countB < countA) return 'B';
  return Math.random() < 0.5 ? 'A' : 'B';
}

export function allocateDCEBlock(blockCounts: { K1: number; K2: number; K3: number }): 'K1' | 'K2' | 'K3' {
  const blocks: ('K1' | 'K2' | 'K3')[] = ['K1', 'K2', 'K3'];
  const minCount = Math.min(blockCounts.K1, blockCounts.K2, blockCounts.K3);
  const candidates = blocks.filter(b => blockCounts[b] === minCount);
  const selectedIndex = Math.floor(Math.random() * candidates.length);
  return candidates[selectedIndex];
}

export interface FlagResults {
  flag_attention: number;
  flag_dominant: number;
  flag_speeder: number;
  flag_straightline: number;
  flag_duplicate: number;
  is_valid: number;
}

export function evaluateQualityFlags(params: {
  attentionAnswer: string;
  dceBlock: string;
  dceChoices: Array<{ cardNum: number; choice: number }>;
  totalDurationSeconds: number;
  medianDurationSeconds: number;
  likertAnswers14: number[];
  fingerprintHash: string;
  existingFingerprints: Set<string>;
}): FlagResults {
  // 1. Kiểm tra chú ý: Phải chọn đúng "Màu xanh lá"
  const flag_attention = params.attentionAnswer === "Màu xanh lá" ? 0 : 1;

  // 2. Thẻ kiểm tra phương án bị trội:
  // K1: Card 4 (A trội B -> nếu chọn B là bị trội)
  // K2: Card 5 (B trội A -> nếu chọn A là bị trội)
  // K3: Card 3 (A trội B -> nếu chọn B là bị trội)
  let flag_dominant = 0;
  for (const item of params.dceChoices) {
    if (params.dceBlock === "K1" && item.cardNum === 4 && item.choice === 2) {
      flag_dominant = 1;
    } else if (params.dceBlock === "K2" && item.cardNum === 5 && item.choice === 1) {
      flag_dominant = 1;
    } else if (params.dceBlock === "K3" && item.cardNum === 3 && item.choice === 2) {
      flag_dominant = 1;
    }
  }

  // 3. flag_speeder: Tổng thời gian làm phiếu < 1/3 trung vị
  const speederThreshold = Math.max(240, params.medianDurationSeconds / 3);
  const flag_speeder = params.totalDurationSeconds < speederThreshold ? 1 : 0;

  // 4. flag_straightline: Chọn cùng một mức cho toàn bộ 14 mục Likert
  const uniqueLikertLevels = new Set(params.likertAnswers14);
  const flag_straightline = (params.likertAnswers14.length >= 14 && uniqueLikertLevels.size === 1) ? 1 : 0;

  // 5. flag_duplicate: Dấu vân tay hoặc cookie trùng lặp
  const flag_duplicate = params.existingFingerprints.has(params.fingerprintHash) ? 1 : 0;

  // Phiếu hợp lệ nếu không vi phạm các cờ chí mạng
  const is_valid = (flag_attention === 0 && flag_dominant === 0 && flag_speeder === 0) ? 1 : 0;

  return {
    flag_attention,
    flag_dominant,
    flag_speeder,
    flag_straightline,
    flag_duplicate,
    is_valid
  };
}

export interface QuotaStatus {
  age_18_24: { actual: number; total: number; pct: number; targetPct: number; met: boolean };
  age_25_30: { actual: number; total: number; pct: number; targetPct: number; met: boolean };
  income_10m_plus: { actual: number; total: number; pct: number; targetPct: number; met: boolean };
  lez_residence: { count: number; targetCount: number; met: boolean };
  lez_workplace: { count: number; targetCount: number; met: boolean };
}

export function evaluateQuotas(responses: any[]): QuotaStatus {
  const total = Math.max(1, responses.length);
  const count18_24 = responses.filter(r => r.age_group === "18-24").length;
  const count25_30 = responses.filter(r => r.age_group === "25-30").length;
  const countIncome10m = responses.filter(r => 
    ["10 – dưới 15 triệu", "15 – dưới 20 triệu", "20 – dưới 30 triệu", "Từ 30 triệu trở lên"].includes(r.income)
  ).length;
  const countLezRes = responses.filter(r => r.LEZ_Residence === 1).length;
  const countLezWork = responses.filter(r => r.LEZ_Workplace === 1).length;

  const pct18_24 = Math.round((count18_24 / total) * 100);
  const pct25_30 = Math.round((count25_30 / total) * 100);
  const pctIncome10m = Math.round((countIncome10m / total) * 100);

  return {
    age_18_24: { actual: count18_24, total, pct: pct18_24, targetPct: 40, met: pct18_24 >= 40 },
    age_25_30: { actual: count25_30, total, pct: pct25_30, targetPct: 40, met: pct25_30 >= 40 },
    income_10m_plus: { actual: countIncome10m, total, pct: pctIncome10m, targetPct: 50, met: pctIncome10m >= 50 },
    lez_residence: { count: countLezRes, targetCount: 120, met: countLezRes >= 120 },
    lez_workplace: { count: countLezWork, targetCount: 120, met: countLezWork >= 120 }
  };
}
