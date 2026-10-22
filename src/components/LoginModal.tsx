import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AuthUser, loginWithCredentials, MAX_ADMIN_COUNT } from '../utils/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginWithCredentials(username, password);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.message || 'Đăng nhập không thành công.');
    }
  };

  // Quick 1-click login for demonstration / defense with fixed 2 admins
  const handleQuickLogin = async (targetUser: 'admin1' | 'admin2' | 'staff01') => {
    const acc = {
      admin1: { u: 'admin1', p: 'admin123' },
      admin2: { u: 'admin2', p: 'admin123' },
      staff01: { u: 'staff01', p: 'admin123' },
    }[targetUser];

    setUsername(acc.u);
    setPassword(acc.p);
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginWithCredentials(acc.u, acc.p);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setErrorMessage(result.message || 'Đăng nhập không thành công.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đăng nhập"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 id="login-modal-title" className="text-lg font-bold text-white tracking-tight">
            Đăng Nhập Quản Trị Hệ Thống
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Chính sách Dual-Admin: Giới hạn tối đa đúng {MAX_ADMIN_COUNT} Quản Trị Viên & Nhân Viên Lễ Tân
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Quick Demo Login Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Đăng nhập 1-Click (Demo đồ án):</span>
              </span>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Tối đa 2 Admin
              </span>
            </div>

            {/* 2 Admins side-by-side */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin1')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Admin 1 (Trưởng)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded font-mono font-bold">
                    ADMIN 1
                  </span>
                </div>
                <p className="text-[10px] text-purple-700 mt-1">admin1 · Toàn quyền</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin2')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    Admin 2 (Phó)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded font-mono font-bold">
                    ADMIN 2
                  </span>
                </div>
                <p className="text-[10px] text-purple-700 mt-1">admin2 · Toàn quyền</p>
              </button>
            </div>

            {/* Staff Button */}
            <button
              type="button"
              onClick={() => handleQuickLogin('staff01')}
              className="w-full p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Nhân Viên Lễ Tân (staff01)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-800 rounded font-mono font-bold">
                  STAFF
                </span>
              </div>
              <p className="text-[10px] text-blue-700 mt-0.5">Tiếp đón khách, đăng ký hội viên & chụp quét Face ID</p>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Hoặc nhập tài khoản
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin1, admin2 hoặc staff01"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Đăng Nhập Hệ Thống</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Roles Policy Info Footer */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Chính sách bảo mật tài khoản:</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium border border-amber-200">
                Chỉ 2 Admin
              </span>
            </div>
            <p>• <strong>ADMIN (Cố định duy nhất 2 tài khoản: admin1 & admin2)</strong>: Toàn quyền cấu hình, phê duyệt thành viên và giám sát doanh thu tài chính.</p>
            <p>• <strong>STAFF (Lễ tân quầy)</strong>: Tiếp đón khách tập, hỗ trợ thu thập sinh trắc học Face ID và quản lý lượt ra vào.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
