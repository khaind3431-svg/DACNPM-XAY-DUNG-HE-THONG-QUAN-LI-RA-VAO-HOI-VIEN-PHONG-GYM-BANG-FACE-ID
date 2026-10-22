import React, { useState } from 'react';
import { GymPackage, GymMember } from '../utils/gymLogic';
import {
  Check,
  X,
  Users,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Crown,
  Lock,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';
import { AuthUser } from '../utils/auth';

interface PackagesAnalyticsViewProps {
  packages: GymPackage[];
  members: GymMember[];
  onSelectPackageForNewMember: (packageId: string) => void;
  currentUser?: AuthUser | null;
  onOpenLoginModal?: () => void;
}

const HOURLY_OCCUPANCY = [
  { hour: '05:30', count: 18, capacity: 80 },
  { hour: '07:00', count: 44, capacity: 80 },
  { hour: '09:00', count: 26, capacity: 80 },
  { hour: '12:00', count: 21, capacity: 80 },
  { hour: '15:00', count: 32, capacity: 80 },
  { hour: '17:30', count: 72, capacity: 80 },
  { hour: '19:00', count: 68, capacity: 80 },
  { hour: '21:00', count: 29, capacity: 80 },
];

export const PackagesAnalyticsView: React.FC<PackagesAnalyticsViewProps> = ({
  packages,
  members,
  onSelectPackageForNewMember,
  currentUser,
  onOpenLoginModal,
}) => {
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Handle register action with auth protection
  const handleRegisterWithPackage = (pkgId: string) => {
    if (!currentUser) {
      if (onOpenLoginModal) onOpenLoginModal();
      return;
    }
    onSelectPackageForNewMember(pkgId);
  };

  // Compute total potential revenue from subscribed members
  const totalSubscribedMembers = members.length;
  const totalEstimatedRevenue = members.reduce((sum, m) => {
    const pkg = packages.find((p) => p.id === m.packageId);
    return sum + (pkg ? pkg.priceVnd : 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Admin Status Banner */}
      {isAdmin && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Chế độ {currentUser?.adminIndex ? `Quản Trị Viên ${currentUser.adminIndex}` : 'Quản Trị Viên'} (ADMIN) — Quản lý danh mục & phân tích doanh thu
              </p>
              <p className="text-purple-700">
                Chính sách Dual-Admin: Cố định 2 tài khoản Quản trị viên · Báo cáo doanh thu theo gói, bảng ma trận quyền lợi và tỷ lệ chuyển đổi hội viên.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono font-bold text-sm">
            <span>Tổng Doanh Thu Gói: <strong className="text-purple-900">{formatVnd(totalEstimatedRevenue)}</strong></span>
          </div>
        </div>
      )}

      {/* Section 1: Detailed Package Tier Cards */}
      <section aria-label="Danh Mục Gói Tập Phòng Gym" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Bảng Giá & Danh Mục Gói Tập TitanFit</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                {packages.length} gói tiêu chuẩn
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tất cả các gói đều tích hợp mở cổng nhận diện Face ID tự động. Gói càng cao quyền lợi PT và khung giờ càng mở rộng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg, idx) => {
            const subscribedCount = members.filter((m) => m.packageId === pkg.id).length;
            const perDayCost = Math.round(pkg.priceVnd / pkg.durationDays);
            const isVip = pkg.id.includes('vip') || idx === 3;
            const isTransformation = pkg.id.includes('transformation') || idx === 2;

            return (
              <div
                key={pkg.id}
                className={`bg-white border rounded-xl p-5 flex flex-col justify-between space-y-5 transition-all hover:shadow-lg relative overflow-hidden ${
                  isVip
                    ? 'border-purple-300 ring-2 ring-purple-500/20 shadow-purple-50/50'
                    : isTransformation
                    ? 'border-blue-300 ring-2 ring-blue-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Popularity Badge */}
                {isTransformation && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-sky-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg flex items-center gap-1 shadow-xs">
                    <Flame className="w-3 h-3" />
                    <span>Phổ Biến Nhất</span>
                  </div>
                )}
                {isVip && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-bl-lg flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3" />
                    <span>Đặc Quyền VIP</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {pkg.targetAudience}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                      <span>{pkg.name}</span>
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                        {formatVnd(pkg.priceVnd)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1 flex items-center justify-between">
                      <span>Thời hạn: <strong>{pkg.durationDays} ngày</strong></span>
                      <span className="text-emerald-700 font-semibold">~{formatVnd(perDayCost)}/ngày</span>
                    </p>
                  </div>

                  {/* Complete Features Checklist */}
                  <ul className="space-y-2.5 pt-2 text-xs text-slate-700 border-t border-slate-100">
                    <li className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Giờ mở cổng:</span>
                      </span>
                      <span className={`font-mono font-bold text-right ${pkg.accessHours === '24/7' ? 'text-purple-700' : 'text-slate-900'}`}>
                        {pkg.accessHours}
                      </span>
                    </li>

                    <li className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Buổi tập PT:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {pkg.ptSessionsIncluded} buổi 1-kèm-1
                      </span>
                    </li>

                    <li className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Đo InBody:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {pkg.inbodyScansPerMonth} lần/tháng
                      </span>
                    </li>

                    <li className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tủ locker & Khăn:</span>
                      </span>
                      <span className={`font-semibold ${pkg.towelAndLockerIncluded ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {pkg.towelAndLockerIncluded ? 'Miễn phí kèm thẻ' : 'Thuê theo tháng'}
                      </span>
                    </li>

                    <li className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Phòng xông hơi:</span>
                      </span>
                      <span className={`font-semibold ${isVip || isTransformation ? 'text-purple-700' : 'text-slate-400'}`}>
                        {isVip ? 'Sauna VIP không giới hạn' : isTransformation ? '2 lần/tuần' : 'Không hỗ trợ'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hội viên đang dùng:</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {subscribedCount} người
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRegisterWithPackage(pkg.id)}
                    className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                      currentUser
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {currentUser ? (
                      <>
                        <span>Đăng Ký Hội Viên Gói Này</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Đăng Nhập Để Đăng Ký Gói</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: FULL FEATURE COMPARISON MATRIX (BẢNG ĐỐI CHIẾU QUYỀN LỢI CHI TIẾT) */}
      <section aria-label="Bảng So Sánh Quyền Lợi Chi Tiết" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Bảng Đối Chiếu Quyền Lợi Toàn Diện Giữa Các Gói Tập</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh chi tiết 8 tiêu chí dịch vụ giúp nhân viên tư vấn chính xác nhu cầu của khách hàng
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            Cập nhật theo biểu phí 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="py-3 px-4 font-bold">Tiêu Chí Dịch Vụ</th>
                <th className="py-3 px-3 font-bold text-center">Gói 1 Tháng (Cơ Bản)</th>
                <th className="py-3 px-3 font-bold text-center">Gói 3 Tháng (Nâng Cao)</th>
                <th className="py-3 px-3 font-bold text-center bg-blue-50/50 text-blue-900">Gói 6 Tháng + PT</th>
                <th className="py-3 px-3 font-bold text-center bg-purple-50/50 text-purple-900">Gói 12 Tháng VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">1. Giá niêm yết (VNĐ)</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">850,000đ</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">2,250,000đ</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/20">4,200,000đ</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-purple-900 bg-purple-50/20">7,500,000đ</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">2. Thời hạn kích hoạt</td>
                <td className="py-3 px-3 text-center font-mono">30 ngày</td>
                <td className="py-3 px-3 text-center font-mono">90 ngày</td>
                <td className="py-3 px-3 text-center font-mono font-semibold text-blue-900 bg-blue-50/20">180 ngày (6 tháng)</td>
                <td className="py-3 px-3 text-center font-mono font-semibold text-purple-900 bg-purple-50/20">365 ngày (1 năm)</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">3. Khung giờ mở cổng Face ID</td>
                <td className="py-3 px-3 text-center text-slate-700">05:00 - 22:00</td>
                <td className="py-3 px-3 text-center text-slate-700">05:00 - 22:00</td>
                <td className="py-3 px-3 text-center font-bold text-blue-700 bg-blue-50/20">24/7 Bất kỳ lúc nào</td>
                <td className="py-3 px-3 text-center font-bold text-purple-700 bg-purple-50/20">24/7 Lối đi riêng VIP</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">4. Số buổi tập cùng HLV riêng (PT 1-1)</td>
                <td className="py-3 px-3 text-center text-slate-600">1 buổi định hướng</td>
                <td className="py-3 px-3 text-center text-slate-800 font-semibold">4 buổi</td>
                <td className="py-3 px-3 text-center font-bold text-blue-900 bg-blue-50/20">12 buổi lộ trình riêng</td>
                <td className="py-3 px-3 text-center font-bold text-purple-900 bg-purple-50/20">24 buổi Master PT</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">5. Đo & phân tích chỉ số InBody</td>
                <td className="py-3 px-3 text-center">1 lần / tháng</td>
                <td className="py-3 px-3 text-center">2 lần / tháng</td>
                <td className="py-3 px-3 text-center font-semibold text-blue-900 bg-blue-50/20">4 lần / tháng (Mỗi tuần)</td>
                <td className="py-3 px-3 text-center font-semibold text-purple-900 bg-purple-50/20">Không giới hạn</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">6. Tủ đồ cá nhân Locker & Khăn tập</td>
                <td className="py-3 px-3 text-center text-slate-400">Thuê riêng</td>
                <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                  <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Miễn phí</span>
                </td>
                <td className="py-3 px-3 text-center text-emerald-700 font-semibold bg-blue-50/20">
                  <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" /> Locker riêng</span>
                </td>
                <td className="py-3 px-3 text-center text-purple-900 font-bold bg-purple-50/20">
                  <span className="flex items-center justify-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /> Locker VIP cố định</span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">7. Phòng xông hơi khô/ướt Sauna</td>
                <td className="py-3 px-3 text-center text-slate-400">Không có</td>
                <td className="py-3 px-3 text-center text-slate-400">Không có</td>
                <td className="py-3 px-3 text-center text-blue-800 font-semibold bg-blue-50/20">2 lần / tuần</td>
                <td className="py-3 px-3 text-center text-purple-800 font-bold bg-purple-50/20">Không giới hạn Sauna VIP</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800">8. Quyền đóng băng / bảo lưu thẻ</td>
                <td className="py-3 px-3 text-center text-slate-400">Không hỗ trợ</td>
                <td className="py-3 px-3 text-center text-slate-700">Tối đa 15 ngày</td>
                <td className="py-3 px-3 text-center font-semibold text-blue-800 bg-blue-50/20">Tối đa 30 ngày</td>
                <td className="py-3 px-3 text-center font-bold text-purple-800 bg-purple-50/20">Tối đa 60 ngày linh hoạt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Hourly Occupancy Chart */}
      <section
        aria-label="Mật Độ Hội Viên Theo Khung Giờ"
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Lưu Lượng Hội Viên Qua Cổng Khuôn Mặt Theo Khung Giờ (Sức Chứa: 80 Người)
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu cảm biến cổng A1 & A2 hỗ trợ phân bổ PT và điều phối công suất phòng tập
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            Khung giờ cao điểm: 17:30 – 19:30 (90% công suất)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          {HOURLY_OCCUPANCY.map((slot) => {
            const pct = Math.round((slot.count / slot.capacity) * 100);
            const isPeak = pct >= 80;
            return (
              <div
                key={slot.hour}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {slot.hour}
                  </span>
                  <span
                    className={`font-mono tabular-nums font-medium ${
                      isPeak ? 'text-amber-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="w-full h-24 bg-slate-200/80 rounded-md overflow-hidden flex items-end">
                  <div
                    className={`w-full transition-all ${
                      isPeak ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>

                <div className="text-xs font-mono tabular-nums text-slate-700 text-center font-medium">
                  {slot.count}/{slot.capacity} người
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
