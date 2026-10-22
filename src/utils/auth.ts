export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  adminIndex?: 1 | 2; // Giới hạn cố định chỉ có Admin 1 hoặc Admin 2
  token?: string;
}

const AUTH_STORAGE_KEY = 'titanfit_auth_user';

/**
 * Quy định bảo mật hệ thống:
 * Giới hạn tối đa đúng 02 tài khoản Quản Trị Viên (Admin)
 */
export const MAX_ADMIN_COUNT = 2;

export const ADMIN_SECURITY_POLICY = {
  maxAdmins: MAX_ADMIN_COUNT,
  description: 'Hệ thống áp dụng chính sách Dual-Admin: Giới hạn cố định tối đa 02 tài khoản Quản Trị Viên (Admin 1 & Admin 2) để đảm bảo an ninh vận hành.',
};

export const DEMO_ACCOUNTS: { [key: string]: { password: string; user: AuthUser } } = {
  admin1: {
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin1',
      fullName: 'Quản Trị Viên 1 (Trưởng)',
      email: 'admin1@titanfit.vn',
      role: 'ADMIN',
      adminIndex: 1,
      token: 'mock-jwt-token-admin1',
    },
  },
  admin: {
    // Bí danh nhanh trỏ về Admin 1
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin1',
      fullName: 'Quản Trị Viên 1 (Trưởng)',
      email: 'admin1@titanfit.vn',
      role: 'ADMIN',
      adminIndex: 1,
      token: 'mock-jwt-token-admin1',
    },
  },
  admin2: {
    password: 'admin123',
    user: {
      id: 2,
      username: 'admin2',
      fullName: 'Quản Trị Viên 2 (Phó)',
      email: 'admin2@titanfit.vn',
      role: 'ADMIN',
      adminIndex: 2,
      token: 'mock-jwt-token-admin2',
    },
  },
  staff01: {
    password: 'admin123',
    user: {
      id: 3,
      username: 'staff01',
      fullName: 'Lễ Tân Nguyễn Mai Phương',
      email: 'staff01@titanfit.vn',
      role: 'STAFF',
      token: 'mock-jwt-token-staff',
    },
  },
};

export function getAdminAccounts(): AuthUser[] {
  return [DEMO_ACCOUNTS.admin1.user, DEMO_ACCOUNTS.admin2.user];
}

export function canCreateAdmin(currentAdminCount: number): boolean {
  return currentAdminCount < MAX_ADMIN_COUNT;
}

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

  // 1. Thử gọi API Spring Boot backend nếu server đang chạy
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
      const isAdmin = data.role === 'ADMIN';
      const adminIdx: 1 | 2 | undefined = cleanUsername === 'admin2' ? 2 : (isAdmin ? 1 : undefined);
      const user: AuthUser = {
        id: data.id || (adminIdx === 2 ? 2 : 1),
        username: data.username || cleanUsername,
        fullName: data.fullName || (adminIdx ? `Quản Trị Viên ${adminIdx}` : 'Người Dùng Hệ Thống'),
        role: isAdmin ? 'ADMIN' : 'STAFF',
        adminIndex: isAdmin ? adminIdx : undefined,
        token: data.accessToken,
      };
      setStoredUser(user);
      return { success: true, user };
    }
  } catch {
    // Network failure hoặc backend không phản hồi — chuyển sang xác thực demo offline
  }

  // 2. Xác thực tài khoản demo (hỗ trợ bảo vệ đồ án mượt mà không phụ thuộc backend)
  const matched = DEMO_ACCOUNTS[cleanUsername];
  if (matched && matched.password === pass) {
    setStoredUser(matched.user);
    return { success: true, user: matched.user };
  }

  return {
    success: false,
    message: 'Tên đăng nhập hoặc mật khẩu không chính xác! (Hệ thống có đúng 2 Admin: admin1 / admin123, admin2 / admin123 và Lễ tân: staff01 / admin123)',
  };
}

export function logoutUser(): void {
  setStoredUser(null);
}
