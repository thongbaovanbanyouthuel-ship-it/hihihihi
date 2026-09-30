// src/app/api/admin/export/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'wide'; // 'wide', 'apollo', 'bws', 'excel', 'codebook'
    const dataDir = path.join(process.cwd(), 'data');

    if (format === 'wide') {
      const filePath = path.join(dataDir, 'survey_responses_wide.csv');
      const csv = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="survey_responses_wide.csv"'
        }
      });
    }

    if (format === 'apollo') {
      const filePath = path.join(dataDir, 'survey_data_apollo_long.csv');
      const csv = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="survey_data_apollo_long.csv"'
        }
      });
    }

    if (format === 'bws') {
      const filePath = path.join(dataDir, 'survey_data_bws_long.csv');
      const csv = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="survey_data_bws_long.csv"'
        }
      });
    }

    if (format === 'codebook') {
      const filePath = path.join(process.cwd(), 'CODEBOOK.md');
      const md = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="CODEBOOK.md"'
        }
      });
    }

    if (format === 'excel') {
      // Đọc các file CSV và gộp thành nhiều sheet trong 1 workbook Excel (.xlsx)
      const wideText = fs.readFileSync(path.join(dataDir, 'survey_responses_wide.csv'), 'utf-8');
      const apolloText = fs.readFileSync(path.join(dataDir, 'survey_data_apollo_long.csv'), 'utf-8');
      const bwsText = fs.readFileSync(path.join(dataDir, 'survey_data_bws_long.csv'), 'utf-8');

      const wb = XLSX.utils.book_new();

      const wsWide = XLSX.utils.csv_to_sheet(wideText);
      XLSX.utils.book_append_sheet(wb, wsWide, 'Responses_Wide');

      const wsApollo = XLSX.utils.csv_to_sheet(apolloText);
      XLSX.utils.book_append_sheet(wb, wsApollo, 'DCE_Apollo_Long');

      const wsBWS = XLSX.utils.csv_to_sheet(bwsText);
      XLSX.utils.book_append_sheet(wb, wsBWS, 'BWS_Long');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="Du_lieu_Khao_sat_NCKH_EV_HCM.xlsx"'
        }
      });
    }

    return NextResponse.json({ error: 'Định dạng không được hỗ trợ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
