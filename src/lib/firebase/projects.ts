// src/lib/firebase/projects.ts
// Quản lý Dự án Nghiên cứu Khoa học (Projects)
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Project } from '@/types/survey';

export async function getProjects(): Promise<Project[]> {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const projects: Project[] = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      // Đếm số lượng khảo sát con
      const surveysSnap = await getDocs(collection(db, `projects/${d.id}/surveys`));
      let totalResponses = 0;
      surveysSnap.docs.forEach(sd => {
        totalResponses += (sd.data().responseCount || 0);
      });

      projects.push({
        id: d.id,
        name: data.name || '',
        description: data.description || '',
        archived: !!data.archived,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        surveyCount: surveysSnap.size,
        totalResponses
      });
    }
    return projects;
  } catch (err) {
    console.error('Lỗi khi lấy danh sách dự án:', err);
    throw err;
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const docRef = doc(db, 'projects', projectId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name || '',
      description: data.description || '',
      archived: !!data.archived,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  } catch (err) {
    console.error(`Lỗi khi lấy thông tin dự án ${projectId}:`, err);
    throw err;
  }
}

export async function createProject(name: string, description: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'projects'), {
    name,
    description,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateProject(projectId: string, data: { name?: string; description?: string }): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function archiveProject(projectId: string, archived: boolean): Promise<void> {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, {
    archived,
    updatedAt: serverTimestamp()
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  // Xóa toàn bộ khảo sát và phản hồi bên trong dự án
  const surveysSnap = await getDocs(collection(db, `projects/${projectId}/surveys`));
  for (const sDoc of surveysSnap.docs) {
    const responsesSnap = await getDocs(collection(db, `projects/${projectId}/surveys/${sDoc.id}/responses`));
    const batch = writeBatch(db);
    responsesSnap.docs.forEach(r => batch.delete(r.ref));
    await batch.commit();

    // Xóa publicSurvey nếu có
    try {
      await deleteDoc(doc(db, 'publicSurveys', sDoc.id));
    } catch {}

    await deleteDoc(sDoc.ref);
  }

  // Cuối cùng xóa dự án
  await deleteDoc(doc(db, 'projects', projectId));
}

/**
 * Nhân bản dự án: Sao chép toàn bộ khảo sát (cấu trúc câu hỏi, thang đo),
 * KHÔNG sao chép phản hồi.
 */
export async function cloneProject(projectId: string): Promise<string> {
  const original = await getProject(projectId);
  if (!original) throw new Error('Không tìm thấy dự án nguồn');

  const newProjectId = await createProject(`[Bản sao] ${original.name}`, original.description);
  
  // Lấy các khảo sát con
  const surveysSnap = await getDocs(collection(db, `projects/${projectId}/surveys`));
  for (const sDoc of surveysSnap.docs) {
    const sData = sDoc.data();
    await addDoc(collection(db, `projects/${newProjectId}/surveys`), {
      title: sData.title || '',
      description: sData.description || '',
      status: 'draft',
      version: 1,
      sections: sData.sections || [],
      questions: sData.questions || [],
      constructs: sData.constructs || [],
      settings: sData.settings || {},
      responseCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return newProjectId;
}
