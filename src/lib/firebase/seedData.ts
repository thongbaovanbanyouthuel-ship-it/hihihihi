// src/lib/firebase/seedData.ts
// Kịch bản khởi tạo Dữ liệu Mẫu (1 Dự án, 1 Khảo sát 4 Thang đo Likert, 200 Phản hồi giả lập)
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './config';
import { Section, Question, Construct, SurveySettings } from '@/types/survey';

export async function seedDemoData(): Promise<{ projectId: string; surveyId: string }> {
  const projectId = 'demo_tam_project';
  const surveyId = 'demo_tam_survey';

  // 1. Tạo dự án Demo
  await setDoc(doc(db, 'projects', projectId), {
    name: 'Đề tài TAM/UTAUT: Ý định Chấp nhận Công nghệ Số',
    description: 'Dự án mẫu thực nghiệm đo lường các nhân tố ảnh hưởng đến ý định sử dụng công nghệ số của sinh viên và người trẻ.',
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // 2. Định nghĩa 4 thang đo (Constructs)
  const constructs: Construct[] = [
    { id: 'c_pe', code: 'PE', name: 'Kỳ vọng hiệu quả (Performance Expectancy)', description: 'Mức độ tin rằng dùng công nghệ giúp nâng cao hiệu suất học tập/làm việc' },
    { id: 'c_ee', code: 'EE', name: 'Kỳ vọng nỗ lực (Effort Expectancy)', description: 'Mức độ dễ dàng và thuận tiện khi tương tác với công nghệ' },
    { id: 'c_si', code: 'SI', name: 'Ảnh hưởng xã hội (Social Influence)', description: 'Sự ủng hộ của bạn bè, đồng nghiệp và người quan trọng' },
    { id: 'c_bi', code: 'BI', name: 'Ý định hành vi (Behavioral Intention)', description: 'Mức độ sẵn sàng và kế hoạch tiếp tục sử dụng công nghệ trong tương lai' }
  ];

  // 3. Định nghĩa câu hỏi
  const questions: Question[] = [
    // Nhân khẩu học
    {
      id: 'q_gender',
      code: 'GIOITINH',
      title: 'Giới tính của bạn',
      type: 'radio',
      required: true,
      options: [
        { label: 'Nam', value: 1 },
        { label: 'Nữ', value: 2 }
      ]
    },
    {
      id: 'q_age',
      code: 'DOTUOI',
      title: 'Độ tuổi của bạn',
      type: 'radio',
      required: true,
      options: [
        { label: '18 - 22 tuổi', value: 1 },
        { label: '23 - 27 tuổi', value: 2 },
        { label: '28 - 35 tuổi', value: 3 },
        { label: 'Trên 35 tuổi', value: 4 }
      ]
    },
    // Ma trận Likert 16 câu cho 4 thang đo
    {
      id: 'q_matrix_likert',
      code: 'MATRIX_TAM',
      title: 'Đánh giá các phát biểu sau theo mức độ đồng ý của bạn',
      description: 'Thang đo Likert 5 mức độ từ 1 (Hoàn toàn không đồng ý) đến 5 (Hoàn toàn đồng ý)',
      type: 'matrix_likert',
      required: true,
      likertScale: 5,
      likertLabels: {
        1: 'Hoàn toàn không đồng ý',
        2: 'Không đồng ý',
        3: 'Trung lập',
        4: 'Đồng ý',
        5: 'Hoàn toàn đồng ý'
      },
      matrixRows: [
        { code: 'PE1', label: 'Công nghệ này giúp tôi hoàn thành công việc nhanh hơn', constructId: 'c_pe' },
        { code: 'PE2', label: 'Sử dụng công nghệ này nâng cao hiệu quả công việc của tôi', constructId: 'c_pe' },
        { code: 'PE3', label: 'Công nghệ này mang lại nhiều lợi ích thiết thực cho tôi', constructId: 'c_pe' },
        { code: 'PE4', label: 'Tôi thấy công nghệ này rất hữu ích trong công việc/học tập', constructId: 'c_pe' },

        { code: 'EE1', label: 'Giao diện công nghệ này rõ ràng và dễ hiểu', constructId: 'c_ee' },
        { code: 'EE2', label: 'Tôi không mất nhiều thời gian để học cách sử dụng', constructId: 'c_ee' },
        { code: 'EE3', label: 'Các thao tác trên hệ thống rất mượt mà và trực quan', constructId: 'c_ee' },
        { code: 'EE4', label: 'Tôi dễ dàng làm chủ các tính năng của công nghệ này', constructId: 'c_ee' },

        { code: 'SI1', label: 'Những người có ảnh hưởng khuyên tôi nên dùng công nghệ này', constructId: 'c_si' },
        { code: 'SI2', label: 'Bạn bè và đồng nghiệp xung quanh tôi đều đang sử dụng', constructId: 'c_si' },
        { code: 'SI3', label: 'Nhà trường/cơ quan khuyến khích tôi áp dụng công nghệ này', constructId: 'c_si' },
        { code: 'SI4', label: 'Tôi dùng công nghệ này vì thấy xu hướng chung của xã hội', constructId: 'c_si' },

        { code: 'BI1', label: 'Tôi dự định sẽ tiếp tục sử dụng công nghệ này trong tương lai', constructId: 'c_bi' },
        { code: 'BI2', label: 'Tôi sẽ ưu tiên dùng công nghệ này khi có nhu cầu tương tự', constructId: 'c_bi' },
        { code: 'BI3', label: 'Tôi sẵn sàng giới thiệu công nghệ này cho người khác', constructId: 'c_bi' },
        { code: 'BI4', label: 'Tôi có kế hoạch sử dụng công nghệ này thường xuyên hơn', constructId: 'c_bi' }
      ]
    }
  ];

  const sections: Section[] = [
    {
      id: 'sec_1',
      title: 'Phần 1: Thông tin nhân khẩu học',
      description: 'Vui lòng cung cấp một số thông tin cơ bản về bạn.',
      order: 1,
      questionIds: ['q_gender', 'q_age']
    },
    {
      id: 'sec_2',
      title: 'Phần 2: Đánh giá quan điểm & Ý định sử dụng',
      description: 'Xin vui lòng cho biết mức độ đồng ý của bạn với từng phát biểu.',
      order: 2,
      questionIds: ['q_matrix_likert']
    }
  ];

  const settings: SurveySettings = {
    thankYouMessage: 'Xin chân thành cảm ơn bạn đã hoàn thành bảng khảo sát nghiên cứu khoa học!',
    oneResponsePerDevice: false,
    showProgressBar: true,
    shuffleOptions: false
  };

  // Tạo tài liệu Khảo sát
  await setDoc(doc(db, `projects/${projectId}/surveys`, surveyId), {
    title: 'Khảo sát Mô hình Chấp nhận Công nghệ TAM/UTAUT',
    description: 'Nghiên cứu khoa học đo lường các nhân tố tác động đến ý định sử dụng công nghệ số.',
    status: 'open',
    version: 1,
    sections,
    questions,
    constructs,
    settings,
    responseCount: 200,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp()
  });

  // Tạo bản xuất bản công khai
  await setDoc(doc(db, 'publicSurveys', surveyId), {
    projectId,
    surveyId,
    title: 'Khảo sát Mô hình Chấp nhận Công nghệ TAM/UTAUT',
    description: 'Nghiên cứu khoa học đo lường các nhân tố tác động đến ý định sử dụng công nghệ số.',
    status: 'open',
    version: 1,
    sections,
    questions,
    settings,
    publishedAt: serverTimestamp()
  });

  // 4. Sinh 200 phản hồi giả lập thực tế với cấu trúc tương quan cao (để Cronbach > 0.8 & Regression có ý nghĩa)
  const batchSize = 100;
  for (let batchNum = 0; batchNum < 2; batchNum++) {
    const batch = writeBatch(db);
    for (let i = 0; i < batchSize; i++) {
      const idx = batchNum * batchSize + i + 1;
      const respDocRef = doc(collection(db, `projects/${projectId}/surveys/${surveyId}/responses`), `resp_${idx}`);

      // Sinh latent factor score với tương quan thực
      const peBase = 3.5 + (Math.random() - 0.5) * 1.5;
      const eeBase = 3.6 + (Math.random() - 0.5) * 1.4;
      const siBase = 3.3 + (Math.random() - 0.5) * 1.6;
      // BI phụ thuộc vào PE, EE, SI
      const biBase = 0.8 + 0.45 * peBase + 0.25 * eeBase + 0.20 * siBase + (Math.random() - 0.5) * 0.6;

      const clamp = (val: number) => Math.min(5, Math.max(1, Math.round(val)));

      const answers: Record<string, any> = {
        GIOITINH: Math.random() > 0.48 ? 1 : 2,
        DOTUOI: Math.random() < 0.6 ? 1 : (Math.random() < 0.8 ? 2 : (Math.random() < 0.95 ? 3 : 4)),

        PE1: clamp(peBase + (Math.random() - 0.5) * 0.8),
        PE2: clamp(peBase + (Math.random() - 0.5) * 0.8),
        PE3: clamp(peBase + (Math.random() - 0.5) * 0.8),
        PE4: clamp(peBase + (Math.random() - 0.5) * 0.8),

        EE1: clamp(eeBase + (Math.random() - 0.5) * 0.8),
        EE2: clamp(eeBase + (Math.random() - 0.5) * 0.8),
        EE3: clamp(eeBase + (Math.random() - 0.5) * 0.8),
        EE4: clamp(eeBase + (Math.random() - 0.5) * 0.8),

        SI1: clamp(siBase + (Math.random() - 0.5) * 0.8),
        SI2: clamp(siBase + (Math.random() - 0.5) * 0.8),
        SI3: clamp(siBase + (Math.random() - 0.5) * 0.8),
        SI4: clamp(siBase + (Math.random() - 0.5) * 0.8),

        BI1: clamp(biBase + (Math.random() - 0.5) * 0.7),
        BI2: clamp(biBase + (Math.random() - 0.5) * 0.7),
        BI3: clamp(biBase + (Math.random() - 0.5) * 0.7),
        BI4: clamp(biBase + (Math.random() - 0.5) * 0.7)
      };

      batch.set(respDocRef, {
        answers,
        surveyVersion: 1,
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
        durationSec: Math.floor(180 + Math.random() * 400),
        meta: {
          device: Math.random() > 0.35 ? 'mobile' : 'desktop',
          lang: 'vi'
        },
        excluded: false
      });
    }
    await batch.commit();
  }

  return { projectId, surveyId };
}
