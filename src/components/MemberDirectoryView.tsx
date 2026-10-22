import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  ScanFace,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GymMember, calculateDaysRemaining } from '../utils/gymLogic';
import { BiometricAvatar } from './BiometricFaceGraphic';

interface MemberDirectoryViewProps {
  members: GymMember[];
  onOpenAddMember: () => void;
  onOpenEnrollModal: (member: GymMember) => void;
  onOpenRenewModal: (member: GymMember) => void;
  onToggleFreezeMember: (memberId: string) => void;
  onSendToGateScanner: (memberId: string) => void;
}

type FilterTab = 'all' | 'active' | 'expiring_soon' | 'expired' | 'unenrolled';

export const MemberDirectoryView: React.FC<MemberDirectoryViewProps> = ({
  members,
  onOpenAddMember,
  onOpenEnrollModal,
  onOpenRenewModal,
  onToggleFreezeMember,
  onSendToGateScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const counts = useMemo(() => {
    return {
      all: members.length,
      active: members.filter((m) => m.status === 'active').length,
      expiring_soon: members.filter((m) => m.status === 'expiring_soon').length,
      expired: members.filter((m) => m.status === 'expired').length,
      unenrolled: members.filter((m) => !m.faceEnrolled).length,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (activeFilter === 'active' && m.status !== 'active') return false;
      if (activeFilter === 'expiring_soon' && m.status !== 'expiring_soon') return false;
      if (activeFilter === 'expired' && m.status !== 'expired') return false;
      if (activeFilter === 'unenrolled' && m.faceEnrolled) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.packageName.toLowerCase().includes(q)
      );
    });
  }, [members, activeFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Toolbar: Search + Segmented Status Filter + Add Member Button */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="member-search-input" className="sr-only">
              Tìm kiếm hội viên theo họ tên hoặc mã thẻ
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="member-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, mã hội viên (TF-2026-...), số điện thoại..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Filter Controls */}
            <div
              role="group"
              aria-label="Lọc danh sách hội viên theo trạng thái"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
            >
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFilter === 'active'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang hoạt động ({counts.active})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('expiring_soon')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFilter === 'expiring_soon'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sắp hết hạn ({counts.expiring_soon})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('expired')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFilter === 'expired'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã hết hạn ({counts.expired})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('unenrolled')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeFilter === 'unenrolled'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chưa có Face ID ({counts.unenrolled})
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAddMember}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Hội Viên Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Không tìm thấy hội viên phù hợp với bộ lọc hiện tại
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thử xóa từ khóa tìm kiếm hoặc chuyển sang bộ lọc "Tất cả" để xem toàn bộ danh sách hội viên phòng gym.
            </p>
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Xóa Bộ Lọc
              </button>
              <button
                type="button"
                onClick={onOpenAddMember}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Đăng Ký Hội Viên Mới
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-3 px-4">Hội Viên & Liên Hệ</th>
                  <th className="py-3 px-4">Gói Tập & Huấn Luyện Viên</th>
                  <th className="py-3 px-4">Thời Hạn Gói</th>
                  <th className="py-3 px-4">Sinh Trắc Học (Face ID)</th>
                  <th className="py-3 px-4 text-right">Lượt Tập</th>
                  <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredMembers.map((member) => {
                  const daysLeft = calculateDaysRemaining(member.endDate, '2026-10-17');

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* Member Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <BiometricAvatar
                            name={member.fullName}
                            landmarks={member.landmarks}
                            photoUrl={member.enrolledPhotoDataUrl}
                            size="sm"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {member.fullName}
                            </div>
                            <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                              {member.memberCode} · {member.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Package & PT */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{member.packageName}</div>
                        <div className="text-slate-500 mt-0.5">
                          <span>PT còn: </span>
                          <span className="font-mono tabular-nums font-medium text-slate-700">
                            {member.ptSessionsRemaining} buổi
                          </span>
                          {member.lockerNumber && (
                            <>
                              <span className="mx-1.5">·</span>
                              <span>Tủ: {member.lockerNumber}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status & Expiration (Unboxed semantic text, zero pills) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {member.status === 'active' && (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700">Đang hoạt động</span>
                            </>
                          )}
                          {member.status === 'expiring_soon' && (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-amber-700">Sắp hết hạn ({daysLeft} ngày)</span>
                            </>
                          )}
                          {member.status === 'expired' && (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span className="text-red-700">
                                Đã hết hạn ({Math.abs(daysLeft)} ngày)
                              </span>
                            </>
                          )}
                          {member.status === 'frozen' && (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-600">Đang bảo lưu</span>
                            </>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                          {member.startDate} → {member.endDate}
                        </div>
                      </td>

                      {/* Face Biometric Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {member.faceEnrolled ? (
                          <div>
                            <div className="flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Đã mã hóa 16-D</span>
                              <span className="text-slate-400">·</span>
                              <span className="font-mono tabular-nums">
                                {member.faceQualityScore.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                              Cập nhật: {member.faceEnrolledAt || '15/10/2026'}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Chưa trích xuất khuôn mặt</span>
                          </div>
                        )}
                      </td>

                      {/* Total Check-ins */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono tabular-nums font-semibold text-slate-900">
                          {member.totalCheckIns} lượt
                        </div>
                        <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                          {member.currentlyInside ? 'Đang trong phòng tập' : 'Ngoài phòng tập'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSendToGateScanner(member.id)}
                            aria-label={`Quét thử tại cổng cho ${member.fullName}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <ScanFace className="w-3.5 h-3.5" />
                            <span>Quét Cổng</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEnrollModal(member)}
                            aria-label={`Cập nhật Face ID cho ${member.fullName}`}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              member.faceEnrolled
                                ? 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'
                                : 'text-amber-900 bg-amber-50 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {member.faceEnrolled ? 'Face ID' : 'Đăng Ký Face ID'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenRenewModal(member)}
                            aria-label={`Gia hạn gói tập cho ${member.fullName}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Gia Hạn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleFreezeMember(member.id)}
                            aria-label={
                              member.status === 'frozen'
                                ? `Kích hoạt lại gói tập cho ${member.fullName}`
                                : `Bảo lưu gói tập cho ${member.fullName}`
                            }
                            className="px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            title={member.status === 'frozen' ? 'Mở lại gói tập' : 'Bảo lưu tạm thời'}
                          >
                            {member.status === 'frozen' ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
