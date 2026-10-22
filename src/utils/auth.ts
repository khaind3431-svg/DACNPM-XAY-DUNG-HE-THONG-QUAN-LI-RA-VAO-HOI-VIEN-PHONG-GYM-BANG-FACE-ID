export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  token?: string;
}

const AUTH_STORAGE_KEY = 'titanfit_auth_user';

export const DEMO_ACCOUNTS: { [key: string]: { password: string; user: AuthUser } } = {
  admin: {
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@titanfit.vn',
      role: 'ADMIN',
      token: 'mock-jwt-token-admin',
    },
  },
  staff01: {
    password: 'admin123',
    user: {
      id: 2,
      username: 'staff01',
      fullName: 'Lễ Tân Nguyễn Mai Phương',
      email: 'staff01@titanfit.vn',
      role: 'STAFF',
      token: 'mock-jwt-token-staff',
    },
  },
};

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage quota error
  }
}

export async function loginWithCredentials(
  username: string,
  pass: string
): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Try real Spring Boot API if available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: pass }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const user: AuthUser = {
        id: 1,
        username: data.username || cleanUsername,
        fullName: data.fullName || 'Người Dùng Hệ Thống',
        role: data.role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        token: data.accessToken,
      };
      setStoredUser(user);
      return { success: true, user };
    }
  } catch {
    // Network failure or backend not responding — fall through to local demo verification
  }

  // 2. Demo accounts validation (local fallback for smooth offline / demo experience)
  const matched = DEMO_ACCOUNTS[cleanUsername];
  if (matched && matched.password === pass) {
    setStoredUser(matched.user);
    return { success: true, user: matched.user };
  }

  return {
    success: false,
    message: 'Tên đăng nhập hoặc mật khẩu không chính xác! (Mẹo: admin / admin123 hoặc staff01 / admin123)',
  };
}

export function logoutUser(): void {
  setStoredUser(null);
}
