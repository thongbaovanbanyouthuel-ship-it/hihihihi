// src/app/api/luckydraw/route.ts
import { NextResponse } from 'next/server';
import { saveLuckyDrawEmail, getLuckyDrawCount } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ.' }, { status: 400 });
    }

    const saved = saveLuckyDrawEmail(email);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Không thể lưu email.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng ký rút thăm thành công. Thông tin email được lưu trữ hoàn toàn độc lập và không liên kết với câu trả lời.',
      totalEntries: getLuckyDrawCount()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
