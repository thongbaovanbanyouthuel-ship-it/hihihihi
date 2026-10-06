// src/lib/firebase/responses.ts
// Quản lý Dữ liệu phản hồi khảo sát (Responses)
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';
import { SurveyResponse } from '@/types/survey';

export async function getSurveyResponses(projectId: string, surveyId: string): Promise<SurveyResponse[]> {
  try {
    const q = query(
      collection(db, `projects/${projectId}/surveys/${surveyId}/responses`),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        answers: data.answers || {},
        surveyVersion: data.surveyVersion || 1,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        durationSec: data.durationSec || 0,
        meta: data.meta || { device: 'desktop', lang: 'vi' },
        excluded: !!data.excluded,
        excludeReason: data.excludeReason || ''
      };
    });
  } catch (err) {
    console.error(`Lỗi lấy phản hồi cho khảo sát ${surveyId}:`, err);
    throw err;
  }
}

export async function updateResponseExclusion(
  projectId: string,
  surveyId: string,
  responseId: string,
  excluded: boolean,
  excludeReason: string = ''
): Promise<void> {
  const docRef = doc(db, `projects/${projectId}/surveys/${surveyId}/responses`, responseId);
  await updateDoc(docRef, {
    excluded,
    excludeReason
  });
}
