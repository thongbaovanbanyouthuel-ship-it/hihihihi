// src/types/survey.ts
// Định nghĩa kiểu dữ liệu cho Hệ thống Khảo sát Nghiên cứu Khoa học (NCKH)

export type QuestionType = 
  | 'short_text'      // Trả lời ngắn
  | 'paragraph'       // Đoạn văn
  | 'number'          // Số
  | 'date'            // Ngày
  | 'radio'           // Một lựa chọn
  | 'checkbox'        // Nhiều lựa chọn
  | 'dropdown'        // Danh sách thả xuống
  | 'likert'          // Thang Likert (5 hoặc 7 mức)
  | 'matrix_likert'   // Ma trận Likert (nhiều phát biểu)
  | 'rating';         // Đánh giá sao (1..5)

export interface QuestionOption {
  label: string;
  value: string | number;
  isOther?: boolean;  // Tùy chọn "Khác (ghi rõ)"
}

export interface MatrixRow {
  code: string;       // Mã biến từng hàng, ví dụ PE1, PE2
  label: string;      // Nội dung phát biểu
  constructId?: string; // Gán thang đo
  reverseCoded?: boolean; // Cờ mã hóa ngược
}

export interface Question {
  id: string;
  code: string;       // Mã biến duy nhất (ví dụ GT1, PE1, GIOITINH)
  title: string;      // Nội dung câu hỏi
  description?: string; // Mô tả phụ / hướng dẫn
  type: QuestionType;
  required: boolean;
  constructId?: string; // Gán vào thang đo / biến tiềm ẩn
  reverseCoded?: boolean; // Cờ mã hóa ngược
  options?: QuestionOption[];
  matrixRows?: MatrixRow[]; // Dành riêng cho ma trận Likert
  likertScale?: 5 | 7; // Thang đo 5 hoặc 7 mức
  likertLabels?: { [score: number]: string }; // Nhãn tùy chỉnh
  min?: number;
  max?: number;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  questionIds: string[];
}

export interface Construct {
  id: string;
  code: string;       // Mã thang đo, ví dụ: PE, EE, SI, FC, BI
  name: string;       // Tên thang đo: Kỳ vọng hiệu quả, Ý định hành vi...
  description?: string;
}

export interface SurveySettings {
  thankYouMessage: string;
  openAt?: string;    // ISO timestamp
  closeAt?: string;   // ISO timestamp
  maxResponses?: number;
  oneResponsePerDevice: boolean;
  showProgressBar: boolean;
  shuffleOptions: boolean;
}

export interface Survey {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed';
  version: number;    // Tăng mỗi lần xuất bản lại
  sections: Section[];
  questions: Question[];
  constructs: Construct[];
  settings: SurveySettings;
  responseCount: number;
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
}

export interface PublicSurvey {
  projectId: string;
  surveyId: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed';
  version: number;
  sections: Section[];
  questions: Question[];
  settings: {
    thankYouMessage: string;
    openAt?: string;
    closeAt?: string;
    maxResponses?: number;
    oneResponsePerDevice: boolean;
    showProgressBar: boolean;
    shuffleOptions: boolean;
  };
  publishedAt: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: any;
  updatedAt: any;
  archived: boolean;
  surveyCount?: number;
  totalResponses?: number;
}

export interface SurveyResponse {
  id: string;
  answers: Record<string, any>; // Khóa theo MÃ BIẾN (question.code)
  surveyVersion: number;
  submittedAt: any;
  durationSec: number;
  meta: {
    device: 'mobile' | 'desktop';
    lang: string;
    userAgent?: string;
  };
  excluded?: boolean; // Cờ loại khỏi phân tích
  excludeReason?: string;
}

export interface AnalysisConfig {
  id: string;
  name: string;
  type: 'descriptive' | 'cronbach' | 'efa' | 'correlation' | 'regression' | 'ttest' | 'anova';
  config: any;
  createdAt: any;
}
