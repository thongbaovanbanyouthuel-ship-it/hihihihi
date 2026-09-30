// src/app/api/analysis/route.ts
import { NextResponse } from 'next/server';
import { getSurveyResponsesWide, getDCECards, getAnalysisComments, saveAnalysisComment, logAuditAction } from '@/lib/storage';
import {
  fetchAnalysisDataQuality,
  fetchAnalysisBWS,
  fetchBWSWave1Selection,
  fetchAnalysisDCE,
  fetchAnalysisHCM,
  fetchAnalysisSimulation
} from '@/lib/analysisEngine';
import fs from 'fs';
import path from 'path';

let EARLY_UNLOCK_ACTIVE = false;

export async function GET() {
  try {
    const wideData = getSurveyResponsesWide();
    const validCount = wideData.filter(d => Number(d.is_valid) === 1).length;

    // Đọc apollo long & bws long
    const dataDir = path.join(process.cwd(), 'data');
    let apolloData: any[] = [];
    let bwsData: any[] = [];

    try {
      const apolloPath = path.join(dataDir, 'survey_data_apollo_long.csv');
      if (fs.existsSync(apolloPath)) {
        const text = fs.readFileSync(apolloPath, 'utf-8');
        const lines = text.trim().split('\n');
        const headers = lines[0].replace(/\r/g, '').split(',');
        apolloData = lines.slice(1, 4801).map(line => {
          const vals = line.replace(/\r/g, '').split(',');
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i]; });
          return obj;
        });
      }

      const bwsPath = path.join(dataDir, 'survey_data_bws_long.csv');
      if (fs.existsSync(bwsPath)) {
        const text = fs.readFileSync(bwsPath, 'utf-8');
        const lines = text.trim().split('\n');
        const headers = lines[0].replace(/\r/g, '').split(',');
        bwsData = lines.slice(1, 7801).map(line => {
          const vals = line.replace(/\r/g, '').split(',');
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i]; });
          return obj;
        });
      }
    } catch (e) {
      console.error('Error reading long datasets:', e);
    }

    // Khóa phân tích chính thức cho tới khi đủ 600 phiếu hợp lệ (Mục 1 & 7)
    const isLocked = validCount < 600 && !EARLY_UNLOCK_ACTIVE;

    // Chạy các khối phân tích
    const [quality, bws, wave1, dce, hcm, simulation] = await Promise.all([
      fetchAnalysisDataQuality(wideData, apolloData, bwsData),
      fetchAnalysisBWS(bwsData, wideData),
      fetchBWSWave1Selection(bwsData),
      fetchAnalysisDCE(apolloData),
      fetchAnalysisHCM(apolloData, wideData),
      fetchAnalysisSimulation(apolloData, wideData)
    ]);

    const comments = getAnalysisComments();

    return NextResponse.json({
      success: true,
      validCount,
      targetCount: 600,
      isLocked,
      isEarlyUnlock: EARLY_UNLOCK_ACTIVE && validCount < 600,
      earlyUnlockBanner: (EARLY_UNLOCK_ACTIVE && validCount < 600)
        ? "KẾT QUẢ SƠ BỘ – KHÔNG DÙNG ĐỂ BÁO CÁO"
        : null,
      results: {
        data_quality: quality,
        bws_models: bws,
        wave1_selection: wave1,
        dce_wtp: dce,
        hcm_models: hcm,
        policy_simulation: simulation
      },
      comments
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, chartId, comment, author, user, unlockState } = body;

    if (action === 'save_comment') {
      saveAnalysisComment(chartId, comment, author || user || 'Nhóm NCKH');
      return NextResponse.json({ success: true, message: 'Đã lưu nhận xét thành công.' });
    }

    if (action === 'toggle_early_unlock') {
      EARLY_UNLOCK_ACTIVE = Boolean(unlockState);
      logAuditAction(
        EARLY_UNLOCK_ACTIVE ? 'MỞ_PHÂN_TÍCH_SỚM' : 'KHÓA_PHÂN_TÍCH',
        `Quản trị viên đã ${EARLY_UNLOCK_ACTIVE ? 'mở khóa phân tích thử nghiệm sớm (gắn nhãn KẾT QUẢ SƠ BỘ)' : 'khóa lại phân tích chính thức cho tới khi đủ 600 phiếu.'}`,
        user || 'admin'
      );
      return NextResponse.json({
        success: true,
        isEarlyUnlock: EARLY_UNLOCK_ACTIVE,
        message: 'Đã cập nhật trạng thái khóa phân tích.'
      });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
