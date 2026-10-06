// src/lib/firebase/config.ts
// Khởi tạo kết nối Firebase Web Client SDK
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPlaceholderForLocalSetup",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nckh-d7e67.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nckh-d7e67",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nckh-d7e67.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100000000000:web:abcdef123456"
};

// Khởi tạo Singleton App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function isFirebaseConfigured(): boolean {
  return !!import.meta.env.VITE_FIREBASE_API_KEY && 
         import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDemoPlaceholderForLocalSetup" &&
         !import.meta.env.VITE_FIREBASE_API_KEY.includes("CHANGE_ME");
}
