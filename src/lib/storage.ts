// src/lib/storage.ts
// Quản lý lưu trữ dữ liệu khảo sát, bảo đảm bảo mật, không lưu PII và tách rời bảng bốc thăm quà tặng

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface LuckyDrawEntry {
  id: string;
  email: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

export interface AnalysisComment {
  chartId: string;
  comment: string;
  author: string;
  updatedAt: string;
}

// Hàm đọc file an toàn
function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return fallback;
  }
}

// Hàm ghi file an toàn
function writeJsonFile<T>(filename: string, data: T): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
  }
}

// 1. Phường/xã TP.HCM
export function getWards() {
  return readJsonFile<any[]>('hcmc_wards.json', []);
}

export function saveWards(wards: any[]) {
  writeJsonFile('hcmc_wards.json', wards);
}

// 2. Ngân hàng thuộc tính linh hoạt
export function getFlexibleAttributesBank() {
  return readJsonFile<any[]>('flexible_attributes_bank.json', []);
}

// 3. Cấu hình hệ thống
export interface SystemConfig {
  targetSample: number;
  wave1Mode: boolean;
  selectedFlex1: string; // mã thuộc tính (mặc định station_dist)
  selectedFlex2: string; // mã thuộc tính (mặc định warranty hoặc buyback)
  lezFeeLevels: number[]; // [0, 100, 200]
  quotaTargets: {
    age18_24_pct: number;
    age25_30_pct: number;
    income10m_pct: number;
    lezResidenceCount: number;
    lezWorkplaceCount: number;
  };
}

const DEFAULT_CONFIG: SystemConfig = {
  targetSample: 600,
  wave1Mode: false,
  selectedFlex1: "station_dist",
  selectedFlex2: "buyback",
  lezFeeLevels: [0, 100, 200],
  quotaTargets: {
    age18_24_pct: 40,
    age25_30_pct: 40,
    income10m_pct: 50,
    lezResidenceCount: 120,
    lezWorkplaceCount: 120
  }
};

export function getSystemConfig(): SystemConfig {
  return readJsonFile<SystemConfig>('system_config.json', DEFAULT_CONFIG);
}

export function saveSystemConfig(cfg: SystemConfig) {
  writeJsonFile('system_config.json', cfg);
}

// 4. Bảng rút thăm trúng thưởng (Hoàn toàn ẩn danh, KHÔNG LIÊN KẾT với câu trả lời khảo sát)
export function saveLuckyDrawEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const entries = readJsonFile<LuckyDrawEntry[]>('lucky_draw_entries.json', []);
  entries.push({
    id: `DRAW_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email,
    created_at: new Date().toISOString()
  });
  writeJsonFile('lucky_draw_entries.json', entries);
  return true;
}

export function getLuckyDrawCount(): number {
  const entries = readJsonFile<LuckyDrawEntry[]>('lucky_draw_entries.json', []);
  return entries.length;
}

// 5. Nhật ký thao tác (Audit Logs)
export function logAuditAction(action: string, details: string, user = 'admin') {
  const logs = readJsonFile<AuditLogEntry[]>('audit_logs.json', []);
  logs.unshift({
    id: `LOG_${Date.now()}`,
    action,
    details,
    user,
    timestamp: new Date().toISOString()
  });
  writeJsonFile('audit_logs.json', logs.slice(0, 500)); // Giữ 500 log gần nhất
}

export function getAuditLogs(): AuditLogEntry[] {
  return readJsonFile<AuditLogEntry[]>('audit_logs.json', []);
}

// 6. Nhận xét của nhóm nghiên cứu cho từng biểu đồ
export function getAnalysisComments(): Record<string, AnalysisComment> {
  return readJsonFile<Record<string, AnalysisComment>>('analysis_comments.json', {});
}

export function saveAnalysisComment(chartId: string, comment: string, author = 'Nhóm NCKH'): void {
  const allComments = getAnalysisComments();
  allComments[chartId] = {
    chartId,
    comment,
    author,
    updatedAt: new Date().toISOString()
  };
  writeJsonFile('analysis_comments.json', allComments);
}

// 7. Đọc tập dữ liệu khảo sát (CSV Wide)
export function getSurveyResponsesWide(): any[] {
  try {
    const csvPath = path.join(DATA_DIR, 'survey_responses_wide.csv');
    if (!fs.existsSync(csvPath)) return [];
    const text = fs.readFileSync(csvPath, 'utf-8');
    const lines = text.trim().split('\n');
    if (lines.length <= 1) return [];
    const headers = lines[0].replace(/\r/g, '').split(',');
    
    const responses: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r/g, '');
      if (!line) continue;
      // CSV parsing handling commas within quotes or plain values
      const values: string[] = [];
      let inQuotes = false;
      let currentVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const obj: any = {};
      headers.forEach((h, idx) => {
        let val: any = values[idx];
        if (val === undefined) val = '';
        // Parse numbers if applicable
        if (['age', 'monthly_fuel_cost', 'duration_seconds', 'flag_attention', 'flag_dominant', 'flag_speeder', 'flag_straightline', 'flag_duplicate', 'is_valid', 'LEZ_Residence', 'LEZ_Workplace', 'RD1', 'RD2', 'RD3', 'RD4', 'RD5', 'SK1', 'SK2', 'SK3', 'SK4', 'SK5', 'SK6', 'FR1', 'FR2', 'FR3', 'FR4', 'SD1', 'SD2', 'SD3', 'SD4', 'attention_check_passed', 'D10_realism'].includes(h)) {
          val = Number(val);
        }
        obj[h] = val;
      });
      responses.push(obj);
    }
    return responses;
  } catch (err) {
    console.error('Error reading survey_responses_wide.csv:', err);
    return [];
  }
}

// 8. Đọc DCE Cards từ CSV
export function getDCECards(): any[] {
  try {
    const csvPath = path.join(DATA_DIR, 'dce_design_blocks.csv');
    if (!fs.existsSync(csvPath)) return [];
    const text = fs.readFileSync(csvPath, 'utf-8');
    const lines = text.trim().split('\n');
    const headers = lines[0].replace(/\r/g, '').split(',');
    const cards: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r/g, '');
      if (!line) continue;
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx]?.trim();
      });
      cards.push(obj);
    }
    return cards;
  } catch (err) {
    console.error('Error reading dce_design_blocks.csv:', err);
    return [];
  }
}

// 9. Lưu một phiếu khảo sát mới
export function appendSurveyResponse(responseObj: any, apolloCards: any[], bwsSets: any[]): void {
  try {
    // 1. Thêm vào CSV Wide
    const widePath = path.join(DATA_DIR, 'survey_responses_wide.csv');
    let exists = fs.existsSync(widePath);
    let headers: string[] = [];
    if (exists) {
      const firstLine = fs.readFileSync(widePath, 'utf-8').split('\n')[0].replace(/\r/g, '');
      headers = firstLine.split(',');
    } else {
      headers = Object.keys(responseObj);
      fs.writeFileSync(widePath, headers.join(',') + '\n', 'utf-8');
    }
    const rowValues = headers.map(h => {
      let val = responseObj[h];
      if (val === undefined || val === null) val = '';
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes(';')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    fs.appendFileSync(widePath, rowValues.join(',') + '\n', 'utf-8');

    // 2. Thêm vào Apollo Long nếu có
    if (apolloCards && apolloCards.length > 0) {
      const apolloPath = path.join(DATA_DIR, 'survey_data_apollo_long.csv');
      let apolloHeaders: string[] = [];
      if (fs.existsSync(apolloPath)) {
        apolloHeaders = fs.readFileSync(apolloPath, 'utf-8').split('\n')[0].replace(/\r/g, '').split(',');
      } else {
        apolloHeaders = Object.keys(apolloCards[0]);
        fs.writeFileSync(apolloPath, apolloHeaders.join(',') + '\n', 'utf-8');
      }
      for (const card of apolloCards) {
        const cRow = apolloHeaders.map(h => {
          let val = card[h];
          if (val === undefined || val === null) val = '';
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        });
        fs.appendFileSync(apolloPath, cRow.join(',') + '\n', 'utf-8');
      }
    }

    // 3. Thêm vào BWS Long nếu có
    if (bwsSets && bwsSets.length > 0) {
      const bwsPath = path.join(DATA_DIR, 'survey_data_bws_long.csv');
      let bwsHeaders: string[] = [];
      if (fs.existsSync(bwsPath)) {
        bwsHeaders = fs.readFileSync(bwsPath, 'utf-8').split('\n')[0].replace(/\r/g, '').split(',');
      } else {
        bwsHeaders = Object.keys(bwsSets[0]);
        fs.writeFileSync(bwsPath, bwsHeaders.join(',') + '\n', 'utf-8');
      }
      for (const s of bwsSets) {
        const sRow = bwsHeaders.map(h => {
          let val = s[h];
          if (val === undefined || val === null) val = '';
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        });
        fs.appendFileSync(bwsPath, sRow.join(',') + '\n', 'utf-8');
      }
    }

  } catch (err) {
    console.error('Error appending survey response:', err);
  }
}
