// src/lib/firebase/auth.ts
// Quản lý xác thực quản trị viên (Admin Auth) qua Firebase Authentication
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import { auth } from './config';
import { useState, useEffect } from 'react';

const ADMIN_DOMAIN = '@nckh-admin.app';

/**
 * Đăng nhập quản trị viên:
 * Chuyển tên đăng nhập (ví dụ: NCKH2627) thành email an toàn (nckh2627@nckh-admin.app)
 * và gọi trực tiếp Firebase Authentication (KHÔNG so sánh mật khẩu trong code trình duyệt).
 */
export async function loginAdmin(usernameInput: string, passwordInput: string): Promise<User> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}${ADMIN_DOMAIN}`;

  // Giữ phiên đăng nhập lâu dài trong trình duyệt
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, passwordInput);
  return userCredential.user;
}

/**
 * Khởi tạo nhanh tài khoản Admin mặc định (nckh2627@nckh-admin.app / NCKH2627)
 * nếu tài khoản chưa được tạo trong Firebase Console.
 */
export async function createDefaultAdmin(): Promise<User> {
  const email = `nckh2627${ADMIN_DOMAIN}`;
  const password = 'NCKH2627';
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Đăng xuất quản trị viên
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Hook theo dõi trạng thái đăng nhập
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, currentUser: user, loading, isAuthenticated: !!user };
}
