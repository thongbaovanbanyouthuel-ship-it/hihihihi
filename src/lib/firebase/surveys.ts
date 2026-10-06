// src/lib/firebase/surveys.ts
// Quản lý Khảo sát (Surveys) và Xuất bản Công khai (Public Surveys)
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment,
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Survey, PublicSurvey, Question, Section, Construct, SurveySettings, SurveyResponse } from '@/types/survey';

export async function getSurveys(projectId: string): Promise<Survey[]> {
  try {
    const q = query(collection(db, `projects/${projectId}/surveys`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        projectId,
        title: data.title || 'Khảo sát chưa đặt tên',
        description: data.description || '',
        status: data.status || 'draft',
        version: data.version || 1,
        sections: data.sections || [],
        questions: data.questions || [],
        constructs: data.constructs || [],
        settings: data.settings || {
          thankYouMessage: 'Cảm ơn bạn đã hoàn thành khảo sát nghiên cứu khoa học!',
          oneResponsePerDevice: false,
          showProgressBar: true,
          shuffleOptions: false
        },
        responseCount: data.responseCount || 0,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        publishedAt: data.publishedAt?.toDate?.() || null
      };
    });
  } catch (err) {
    console.error(`Lỗi khi lấy danh sách khảo sát cho dự án ${projectId}:`, err);
    throw err;
  }
}

export async function getSurvey(projectId: string, surveyId: string): Promise<Survey | null> {
  try {
    const docRef = doc(db, `projects/${projectId}/surveys`, surveyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      projectId,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'draft',
      version: data.version || 1,
      sections: data.sections || [],
      questions: data.questions || [],
      constructs: data.constructs || [],
      settings: data.settings || {
        thankYouMessage: 'Cảm ơn bạn đã tham gia khảo sát!',
        oneResponsePerDevice: false,
        showProgressBar: true,
        shuffleOptions: false
      },
      responseCount: data.responseCount || 0,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      publishedAt: data.publishedAt?.toDate?.() || null
    };
  } catch (err) {
    console.error(`Lỗi khi lấy khảo sát ${surveyId}:`, err);
    throw err;
  }
}

export async function createSurvey(projectId: string, initialData?: Partial<Survey>): Promise<string> {
  const defaultSections: Section[] = [
    {
      id: 'sec_1',
      title: 'Phần 1: Thông tin chung',
      description: 'Vui lòng cung cấp một số thông tin cơ bản trước khi bắt đầu khảo sát.',
      order: 1,
      questionIds: ['q_1']
    }
  ];

  const defaultQuestions: Question[] = [
    {
      id: 'q_1',
      code: 'GIOITINH',
      title: 'Giới tính của bạn là gì?',
      type: 'radio',
      required: true,
      options: [
        { label: 'Nam', value: 1 },
        { label: 'Nữ', value: 2 },
        { label: 'Khác', value: 3 }
      ]
    }
  ];

  const docRef = await addDoc(collection(db, `projects/${projectId}/surveys`), {
    title: initialData?.title || 'Khảo sát nghiên cứu mới',
    description: initialData?.description || 'Bảng câu hỏi phục vụ đề tài nghiên cứu khoa học.',
    status: 'draft',
    version: 1,
    sections: initialData?.sections || defaultSections,
    questions: initialData?.questions || defaultQuestions,
    constructs: initialData?.constructs || [],
    settings: initialData?.settings || {
      thankYouMessage: 'Xin chân thành cảm ơn anh/chị đã dành thời gian quý báu tham gia khảo sát!',
      oneResponsePerDevice: false,
      showProgressBar: true,
      shuffleOptions: false
    },
    responseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function saveSurveyDraft(
  projectId: string, 
  surveyId: string, 
  data: Partial<Survey>
): Promise<void> {
  const docRef = doc(db, `projects/${projectId}/surveys`, surveyId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Xuất bản khảo sát (Publish):
 * - Tăng version của bản nháp
 * - Chuyển trạng thái sang 'open'
 * - Sao chép phiên bản công khai sang publicSurveys/{surveyId}
 */
export async function publishSurvey(projectId: string, surveyId: string): Promise<number> {
  const survey = await getSurvey(projectId, surveyId);
  if (!survey) throw new Error('Không tìm thấy khảo sát để xuất bản.');

  const nextVersion = (survey.version || 0) + 1;
  const batch = writeBatch(db);

  // 1. Cập nhật bản nháp nội bộ
  const surveyDocRef = doc(db, `projects/${projectId}/surveys`, surveyId);
  batch.update(surveyDocRef, {
    status: 'open',
    version: nextVersion,
    updatedAt: serverTimestamp(),
    publishedAt: serverTimestamp()
  });

  // 2. Xuất bản sang publicSurveys/{surveyId}
  const publicDocRef = doc(db, 'publicSurveys', surveyId);
  const publicPayload: PublicSurvey = {
    projectId,
    surveyId,
    title: survey.title,
    description: survey.description,
    status: 'open',
    version: nextVersion,
    sections: survey.sections,
    questions: survey.questions,
    settings: survey.settings,
    publishedAt: serverTimestamp()
  };

  batch.set(publicDocRef, publicPayload);
  await batch.commit();

  return nextVersion;
}

export async function closeSurvey(projectId: string, surveyId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, `projects/${projectId}/surveys`, surveyId), {
    status: 'closed',
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'publicSurveys', surveyId), {
    status: 'closed'
  });
  await batch.commit();
}

export async function deleteSurvey(projectId: string, surveyId: string): Promise<void> {
  // 1. Xóa toàn bộ responses
  const responsesSnap = await getDocs(collection(db, `projects/${projectId}/surveys/${surveyId}/responses`));
  const batch = writeBatch(db);
  responsesSnap.docs.forEach(r => batch.delete(r.ref));

  // 2. Xóa publicSurveys/{surveyId}
  try {
    batch.delete(doc(db, 'publicSurveys', surveyId));
  } catch {}

  // 3. Xóa chính khảo sát
  batch.delete(doc(db, `projects/${projectId}/surveys`, surveyId));

  await batch.commit();
}

/**
 * Đọc bản khảo sát công khai (Public - 1 lượt đọc)
 */
export async function getPublicSurvey(surveyId: string): Promise<PublicSurvey | null> {
  try {
    const docRef = doc(db, 'publicSurveys', surveyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PublicSurvey;
  } catch (err) {
    console.error(`Lỗi đọc khảo sát công khai ${surveyId}:`, err);
    throw err;
  }
}

/**
 * Nộp bài khảo sát từ trang công khai (Public - 1 lượt ghi)
 */
export async function submitPublicSurveyResponse(
  projectId: string,
  surveyId: string,
  payload: {
    answers: Record<string, any>;
    surveyVersion: number;
    durationSec: number;
    meta: {
      device: 'mobile' | 'desktop';
      lang: string;
      userAgent?: string;
    };
  }
): Promise<string> {
  const responseRef = doc(collection(db, `projects/${projectId}/surveys/${surveyId}/responses`));
  const responseData = {
    answers: payload.answers,
    surveyVersion: payload.surveyVersion,
    submittedAt: serverTimestamp(),
    durationSec: payload.durationSec,
    meta: payload.meta,
    excluded: false
  };

  try {
    const batch = writeBatch(db);
    batch.set(responseRef, responseData);
    const surveyRef = doc(db, `projects/${projectId}/surveys`, surveyId);
    batch.update(surveyRef, {
      responseCount: increment(1),
      updatedAt: serverTimestamp()
    });
    await batch.commit();
  } catch (err) {
    console.warn('Batch submit failed, falling back to direct response creation:', err);
    await setDoc(responseRef, responseData);
  }

  return responseRef.id;
}

/**
 * Nhân bản khảo sát: Sao chép cấu trúc câu hỏi, phần, thang đo,
 * KHÔNG sao chép phản hồi.
 */
export async function cloneSurvey(projectId: string, surveyId: string): Promise<string> {
  const original = await getSurvey(projectId, surveyId);
  if (!original) throw new Error('Không tìm thấy khảo sát nguồn');

  const docRef = await addDoc(collection(db, `projects/${projectId}/surveys`), {
    title: `[Bản sao] ${original.title}`,
    description: original.description || '',
    status: 'draft',
    version: 1,
    sections: original.sections || [],
    questions: original.questions || [],
    constructs: original.constructs || [],
    settings: original.settings || {},
    responseCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

