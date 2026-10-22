import React from 'react';
import { GymPackage, GymMember } from '../utils/gymLogic';
import { Check, Users, Clock, Calendar } from 'lucide-react';

interface PackagesAnalyticsViewProps {
  packages: GymPackage[];
  members: GymMember[];
  onSelectPackageForNewMember: (packageId: string) => void;
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
}) => {
  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Membership Tier Cards */}
      <section aria-label="Danh Mục Gói Tập Phòng Gym" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Cấu Trúc Gói Tập & Quyền Truy Cập Cổng Khuôn Mặt
            </h2>
            <p className="text-xs text-slate-500">
              Mỗi gói tập được phân quyền khung giờ mở cổng tự động và số buổi huấn luyện viên cá nhân (PT)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => {
            const subscribedCount = members.filter((m) => m.packageId === pkg.id).length;
            const perDayCost = Math.round(pkg.priceVnd / pkg.durationDays);

            return (
              <div
                key={pkg.id}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">{pkg.targetAudience}</p>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{pkg.name}</h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {formatVnd(pkg.priceVnd)}
                    </div>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      Thời hạn {pkg.durationDays} ngày · ~{formatVnd(perDayCost)}/ngày
                    </p>
                  </div>

                  <ul className="space-y-2 pt-2 text-xs text-slate-700">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Khung giờ mở cổng</span>
                      </span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {pkg.accessHours}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Buổi tập cùng PT</span>
                      </span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {pkg.ptSessionsIncluded} buổi 1-kèm-1
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đo chỉ số InBody</span>
                      </span>
                      <span className="font-mono tabular-nums font-medium text-slate-900">
                        {pkg.inbodyScansPerMonth} lần/tháng
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tủ đồ & Khăn tập</span>
                      </span>
                      <span className="font-medium text-slate-900">
                        {pkg.towelAndLockerIncluded ? 'Miễn phí' : 'Thuê theo tháng'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hội viên đang đăng ký</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {subscribedCount} hội viên
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectPackageForNewMember(pkg.id)}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Đăng Ký Hội Viên Với Gói Này
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hourly Occupancy & Capacity Distribution */}
      <section
        aria-label="Mật Độ Hội Viên Theo Khung Giờ"
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Lưu Lượng Hội Viên Qua Cổng Khuôn Mặt Theo Khung Giờ (Sức Chứa Tối Đa: 80 Người)
            </h3>
            <p className="text-xs text-slate-500">
              Thống kê từ cảm biến cổng xoay A1 & A2 giúp điều phối huấn luyện viên trực sàn
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            Cao điểm: 17:30 – 19:30 (90% công suất)
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
                      isPeak ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="w-full h-24 bg-slate-200/80 rounded overflow-hidden flex items-end">
                  <div
                    className={`w-full transition-all ${
                      isPeak ? 'bg-amber-600' : 'bg-blue-600'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>

                <div className="text-xs font-mono tabular-nums text-slate-700 text-center">
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
