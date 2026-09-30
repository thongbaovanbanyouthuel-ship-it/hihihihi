// src/app/api/admin/config/route.ts
import { NextResponse } from 'next/server';
import { getSystemConfig, saveSystemConfig, getWards, saveWards, getFlexibleAttributesBank, getDCECards, logAuditAction } from '@/lib/storage';

export async function GET() {
  try {
    const config = getSystemConfig();
    const wards = getWards();
    const flexBank = getFlexibleAttributesBank();
    const dceCards = getDCECards();

    // Kiểm tra tính hợp lệ của file thiết kế DCE (mục 5.6):
    // 24 thẻ, mỗi khối 8 thẻ, mỗi khối đúng 1 thẻ kiểm tra phương án bị trội
    const k1 = dceCards.filter(c => c.block === 'K1');
    const k2 = dceCards.filter(c => c.block === 'K2');
    const k3 = dceCards.filter(c => c.block === 'K3');

    const domK1 = new Set(k1.filter(c => Number(c.is_dominance_check) === 1).map(c => c.card)).size;
    const domK2 = new Set(k2.filter(c => Number(c.is_dominance_check) === 1).map(c => c.card)).size;
    const domK3 = new Set(k3.filter(c => Number(c.is_dominance_check) === 1).map(c => c.card)).size;

    const dceValidation = {
      totalCards: dceCards.length / 3, // 3 alts per card
      k1Count: k1.length / 3,
      k2Count: k2.length / 3,
      k3Count: k3.length / 3,
      hasDominanceK1: domK1 === 1,
      hasDominanceK2: domK2 === 1,
      hasDominanceK3: domK3 === 1,
      isValidDesign: (dceCards.length / 3 === 24) && (domK1 === 1) && (domK2 === 1) && (domK3 === 1)
    };

    return NextResponse.json({
      success: true,
      config,
      wards,
      flexBank,
      dceValidation
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, config, wardId, inLez, user } = body;

    if (action === 'update_ward_lez') {
      const wards = getWards();
      const updated = wards.map(w => w.id === wardId ? { ...w, in_lez: Boolean(inLez) } : w);
      saveWards(updated);
      logAuditAction('CẬP_NHẬT_LEZ', `Cập nhật trạng thái LEZ phường ${wardId} thành ${inLez ? 'TRONG LEZ' : 'NGOÀI LEZ'}`, user);
      return NextResponse.json({ success: true, message: 'Đã cập nhật ranh giới LEZ phường/xã.' });
    }

    if (action === 'update_config') {
      saveSystemConfig(config);
      logAuditAction('CẬP_NHẬT_CẤU_HÌNH', `Thay đổi cấu hình khảo sát (Đợt 1: ${config.wave1Mode ? 'BẬT' : 'TẮT'}, Thuộc tính: ${config.selectedFlex1}, ${config.selectedFlex2})`, user);
      return NextResponse.json({ success: true, message: 'Đã lưu cấu hình hệ thống thành công.' });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
