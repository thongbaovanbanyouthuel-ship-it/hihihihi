// src/app/api/survey/route.ts
import { NextResponse } from 'next/server';
import { getWards, getSystemConfig, getSurveyResponsesWide, getDCECards, appendSurveyResponse } from '@/lib/storage';
import { allocateOrderVersion, allocateDCEBlock, evaluateQualityFlags } from '@/lib/qualityControl';
import { BWS_BIBD_SETS } from '@/lib/surveyData';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('ch') || 'online';
    const wave = searchParams.get('wave') || '2';

    const config = getSystemConfig();
    const wards = getWards();
    const existing = getSurveyResponsesWide();

    // Tính toán phân bổ cân bằng
    const countA = existing.filter(r => r.order_version === 'A').length;
    const countB = existing.filter(r => r.order_version === 'B').length;
    const assignedOrder = allocateOrderVersion(countA, countB);

    const blockCounts = {
      K1: existing.filter(r => r.dce_block === 'K1').length,
      K2: existing.filter(r => r.dce_block === 'K2').length,
      K3: existing.filter(r => r.dce_block === 'K3').length
    };
    const assignedBlock = allocateDCEBlock(blockCounts);

    // Lấy danh sách 8 thẻ DCE của khối được gán
    const allDceCards = getDCECards();
    const blockCards = allDceCards.filter(c => c.block === assignedBlock);

    return NextResponse.json({
      success: true,
      config: {
        wave1Mode: config.wave1Mode || wave === '1',
        channel,
        assignedOrder,
        assignedBlock,
        targetSample: config.targetSample
      },
      wards,
      bwsSets: BWS_BIBD_SETS,
      dceCards: blockCards
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const existing = getSurveyResponsesWide();

    // Tính thời gian trung vị để gắn cờ speeder
    const durations = existing.map(r => Number(r.duration_seconds)).filter(d => d > 0);
    durations.sort((a, b) => a - b);
    const medianDuration = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 1150;

    // Bộ vân tay để kiểm tra trùng
    const fingerprints = new Set<string>(existing.map(r => r.fingerprint_hash || ''));

    // Gắn cờ tự động
    const flags = evaluateQualityFlags({
      attentionAnswer: body.attentionAnswer,
      dceBlock: body.dceBlock,
      dceChoices: body.dceChoices || [],
      totalDurationSeconds: body.durationSeconds,
      medianDurationSeconds: medianDuration,
      likertAnswers14: body.likertAnswers14 || [],
      fingerprintHash: body.fingerprintHash || '',
      existingFingerprints: fingerprints
    });

    const respId = `RESP_${Date.now().toString().slice(-6)}_${Math.floor(Math.random() * 1000)}`;

    const wideRow = {
      respondent_id: respId,
      order_version: body.orderVersion,
      dce_block: body.dceBlock,
      channel: body.channel || 'online',
      duration_seconds: body.durationSeconds,
      ...flags,
      age_group: body.ageGroup,
      age: body.age,
      gender: body.gender,
      education: body.education,
      occupation: body.occupation,
      income: body.income,
      residual_income: body.residualIncome,
      daily_km: body.dailyKm,
      monthly_fuel_cost: body.monthlyFuelCost,
      home_charging: body.homeCharging,
      residence_ward: body.residenceWard,
      workplace_ward: body.workplaceWard,
      LEZ_Residence: body.lezResidence ? 1 : 0,
      LEZ_Workplace: body.lezWorkplace ? 1 : 0,
      A6_news: body.a6News,
      A7_lez_knowledge: body.a7LezKnow,
      A8_lez_response: body.a8LezResponse,
      RD1: body.rdScores?.RD1 || 3,
      RD2: body.rdScores?.RD2 || 3,
      RD3: body.rdScores?.RD3 || 3,
      RD4: body.rdScores?.RD4 || 3,
      RD5: body.rdScores?.RD5 || 5,
      SK1: body.skScores?.SK1 || 3,
      SK2: body.skScores?.SK2 || 3,
      SK3: body.skScores?.SK3 || 3,
      SK4: body.skScores?.SK4 || 3,
      SK5: body.skScores?.SK5 || 3,
      SK6: body.skScores?.SK6 || 3,
      FR1: body.frScores?.FR1 || 3,
      FR2: body.frScores?.FR2 || 3,
      FR3: body.frScores?.FR3 || 3,
      FR4: body.frScores?.FR4 || 3,
      SD1: body.sdScores?.SD1 || 3,
      SD2: body.sdScores?.SD2 || 3,
      SD3: body.sdScores?.SD3 || 3,
      SD4: body.sdScores?.SD4 || 3,
      attention_check_passed: flags.flag_attention === 0 ? 1 : 0,
      D9_attribute_non_attendance: body.d9Ana || '',
      D10_realism: body.d10Realism || 4,
      D11_optout_reason: body.d11Reason || '',
      F1_support_policies: Array.isArray(body.f1Policies) ? body.f1Policies.join('; ') : '',
      F7_max_ev_budget: body.f7Budget || ''
    };

    // Chuẩn bị hàng Apollo Long (8 hàng)
    const apolloRows = (body.dceCardResults || []).map((card: any) => ({
      respondent_id: respId,
      block: body.dceBlock,
      order_version: body.orderVersion,
      card_num: card.cardNum,
      display_pos: card.displayPos,
      is_dominance_check: card.isDominanceCheck || 0,
      choice: card.choice,
      price_A: card.priceA,
      battery_A: card.batteryA,
      energy_A: card.energyA,
      recycle_A: card.recycleA,
      flex1_A: card.flex1A,
      flex2_A: card.flex2A,
      price_B: card.priceB,
      battery_B: card.batteryB,
      energy_B: card.energyB,
      recycle_B: card.recycleB,
      flex1_B: card.flex1B,
      flex2_B: card.flex2B,
      fuel_cost_OPT: body.monthlyFuelCost,
      lez_fee_OPT: card.lezFee,
      certainty: card.certainty,
      peer_choice: card.peerChoice || '',
      LEZ_Residence: body.lezResidence ? 1 : 0,
      LEZ_Workplace: body.lezWorkplace ? 1 : 0,
      SK_mean: body.skMean || 3.0,
      FR_mean: body.frMean || 3.0,
      SD_mean: body.sdMean || 3.0,
      channel: body.channel || 'online'
    }));

    // Chuẩn bị hàng BWS Long (13 hàng)
    const bwsRows = (body.bwsResults || []).map((set: any, idx: number) => ({
      respondent_id: respId,
      set_id: set.setId,
      display_order: idx + 1,
      item_1: set.items[0],
      item_2: set.items[1],
      item_3: set.items[2],
      item_4: set.items[3],
      best_item: set.bestItem,
      worst_item: set.worstItem
    }));

    // Lưu dữ liệu
    appendSurveyResponse(wideRow, apolloRows, bwsRows);

    return NextResponse.json({
      success: true,
      respondentId: respId,
      isValid: flags.is_valid === 1
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
