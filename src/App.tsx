import React, { useState, useMemo } from 'react';
import {
  INITIAL_MEMBERS,
  INITIAL_PACKAGES,
  INITIAL_ACCESS_LOGS,
  GymMember,
  GymPackage,
  AccessLogEntry,
  GateEvaluationResult,
  generateBiometricVectorFromSeed,
  computeMemberStatus,
  renewMemberPackage,
} from './utils/gymLogic';
import { GateTerminalView } from './components/GateTerminalView';
import { MemberDirectoryView } from './components/MemberDirectoryView';
import { AccessLogsView } from './components/AccessLogsView';
import { PackagesAnalyticsView } from './components/PackagesAnalyticsView';
import {
  AddMemberModal,
  FaceEnrollmentModal,
  RenewPackageModal,
} from './components/MemberModals';

type ActiveTab = 'gate' | 'members' | 'logs' | 'packages';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gate');
  const [members, setMembers] = useState<GymMember[]>(INITIAL_MEMBERS);
  const [packages] = useState<GymPackage[]>(INITIAL_PACKAGES);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>(INITIAL_ACCESS_LOGS);
  const [selectedGateSubjectId, setSelectedGateSubjectId] = useState<string>('preset-stranger');

  // Modals state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [preselectedPkgId, setPreselectedPkgId] = useState<string | undefined>(undefined);
  const [pendingOpticalFace, setPendingOpticalFace] = useState<{
    vector: number[];
    snapshotUrl?: string;
  } | null>(null);
  const [enrollingMember, setEnrollingMember] = useState<GymMember | null>(null);
  const [renewingMember, setRenewingMember] = useState<GymMember | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBannerMessage(msg);
  };

  // Record a gate scan event and update member check-in count / occupancy
  const handleRecordGateScan = (
    evaluation: GateEvaluationResult,
    gateId: AccessLogEntry['gateId'],
    direction: 'IN' | 'OUT',
    processingMs: number
  ) => {
    const now = new Date('2026-10-17T08:15:30');
    const pad = (n: number) => String(n).padStart(2, '0');
    const secondsOffset = (accessLogs.length * 13) % 60;
    const formattedTime = `08:${pad(15 + (accessLogs.length % 40))}:${pad(secondsOffset)} 17/10/2026`;

    const matched = evaluation.matchedMember;
    const newEntry: AccessLogEntry = {
      id: `log-${100 + accessLogs.length + 1}`,
      timestamp: formattedTime,
      isoTime: now.toISOString(),
      gateId,
      direction,
      memberId: matched ? matched.id : null,
      memberCode: matched ? matched.memberCode : 'KHÁCH VÃNG LAI',
      memberName: matched ? matched.fullName : 'Khuôn mặt chưa đăng ký',
      packageName: matched ? matched.packageName : '—',
      similarityScore: evaluation.similarityScore,
      livenessScore: evaluation.livenessScore,
      result: evaluation.resultStatus,
      reasonVi: evaluation.reasonVi,
      processingMs,
    };

    setAccessLogs((prev) => [newEntry, ...prev]);

    if (evaluation.granted && matched) {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== matched.id) return m;
          return {
            ...m,
            totalCheckIns: direction === 'IN' ? m.totalCheckIns + 1 : m.totalCheckIns,
            lastCheckIn: `17/10/2026 08:${pad(15 + (accessLogs.length % 40))}`,
            currentlyInside: direction === 'IN',
          };
        })
      );
    }
  };

  // Add a new gym member
  const handleCreateMember = (data: {
    fullName: string;
    phone: string;
    email: string;
    packageId: string;
    gender: 'Nam' | 'Nữ';
    enrollFaceNow: boolean;
    assignedTrainer: string;
    customFaceVector?: number[];
    customFaceModality?: '3d_template' | 'optical_pixel';
    enrolledPhotoDataUrl?: string;
  }) => {
    const pkg = packages.find((p) => p.id === data.packageId) || packages[0];
    const start = new Date('2026-10-17T00:00:00Z');
    const end = new Date(start.getTime());
    end.setUTCDate(end.getUTCDate() + pkg.durationDays);
    const endDateStr = end.toISOString().slice(0, 10);

    const nextNum = 1025 + members.length;
    const memberCode = `TF-2026-${nextNum}`;
    const newId = `mem-new-${Date.now()}`;

    const newMember: GymMember = {
      id: newId,
      memberCode,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      packageId: pkg.id,
      packageName: pkg.name,
      startDate: '2026-10-17',
      endDate: endDateStr,
      status: 'active',
      faceEnrolled: data.enrollFaceNow,
      faceModality: data.customFaceModality || '3d_template',
      enrolledPhotoDataUrl: data.enrolledPhotoDataUrl,
      faceVector: data.enrollFaceNow
        ? data.customFaceVector ||
          generateBiometricVectorFromSeed(`${memberCode}-${data.fullName.toUpperCase()}`)
        : [],
      faceEnrolledAt: data.enrollFaceNow ? '17/10/2026 08:20' : undefined,
      faceQualityScore: data.enrollFaceNow ? 98.7 : 0,
      ptSessionsRemaining: pkg.ptSessionsIncluded,
      totalCheckIns: 0,
      assignedTrainer: data.assignedTrainer,
      currentlyInside: false,
      landmarks: {
        eyeDistanceRatio: data.gender === 'Nữ' ? 0.40 : 0.43,
        noseBridgeLength: data.gender === 'Nữ' ? 0.33 : 0.37,
        jawWidthRatio: data.gender === 'Nữ' ? 0.72 : 0.81,
        browArchHeight: data.gender === 'Nữ' ? 0.34 : 0.28,
        mouthWidthRatio: data.gender === 'Nữ' ? 0.43 : 0.46,
        faceAspect: 1.26,
        skinToneIndex: members.length % 3,
        hairStyle: data.gender === 'Nữ' ? 'bun_athletic' : 'short_fade',
        gender: data.gender,
      },
    };

    setMembers((prev) => [newMember, ...prev]);
    setSelectedGateSubjectId(newMember.id);
    setActiveTab('gate');
    showNotification(
      `Đã tạo hồ sơ hội viên ${newMember.fullName} (${newMember.memberCode}) kèm Face ID thực tế! Hệ thống đã tự động chuyển sang Trạm Kiểm Soát để bạn đứng trước camera mở cửa.`
    );
  };

  // Enroll / Re-calibrate member's 16-D face vector
  const handleConfirmEnroll = (
    memberId: string,
    newVector: number[],
    qualityScore: number,
    modality: '3d_template' | 'optical_pixel' = '3d_template',
    photoDataUrl?: string
  ) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          faceEnrolled: true,
          faceVector: newVector,
          faceQualityScore: qualityScore,
          faceModality: modality,
          enrolledPhotoDataUrl: photoDataUrl ?? m.enrolledPhotoDataUrl,
          faceEnrolledAt: '17/10/2026 08:25',
        };
      })
    );
    const target = members.find((m) => m.id === memberId);
    if (target) {
      showNotification(
        `Đã lưu Vector Khuôn Mặt 16-D (${
          modality === 'optical_pixel' ? 'Ảnh/Webcam thực tế' : 'Mẫu 3D riêng'
        }) cho hội viên ${target.fullName}.`
      );
    }
  };

  // Renew a member's package
  const handleConfirmRenew = (memberId: string, packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId) || packages[0];
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        return renewMemberPackage(m, pkg, '2026-10-17');
      })
    );
    const target = members.find((m) => m.id === memberId);
    if (target) {
      showNotification(
        `Đã gia hạn thành công ${pkg.name} cho hội viên ${target.fullName}. Quyền mở cổng tự động đã được kích hoạt.`
      );
    }
  };

  // Toggle Freeze / Unfreeze membership
  const handleToggleFreezeMember = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const willFreeze = m.status !== 'frozen';
        const nextStatus = computeMemberStatus(m.endDate, willFreeze, '2026-10-17');
        return {
          ...m,
          status: nextStatus,
        };
      })
    );
  };

  // Computed KPI Metrics
  const kpis = useMemo(() => {
    const insideCount = members.filter((m) => m.currentlyInside).length;
    const faceEnrolledCount = members.filter((m) => m.faceEnrolled).length;
    const grantedLogsCount = accessLogs.filter((l) => l.result === 'granted').length;
    const deniedLogsCount = accessLogs.filter((l) => l.result !== 'granted').length;
    const expiringOrExpiredCount = members.filter(
      (m) => m.status === 'expiring_soon' || m.status === 'expired'
    ).length;

    return {
      insideCount,
      faceEnrolledCount,
      grantedLogsCount,
      deniedLogsCount,
      expiringOrExpiredCount,
    };
  }, [members, accessLogs]);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('gate');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          TitanFit Biometrics
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveTab('gate')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'gate'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Trạm Kiểm Soát
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'members'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Hội Viên ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Nhật Ký Ra Vào ({accessLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'packages'
                ? 'border-blue-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Gói Tập & Lưu Lượng
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPreselectedPkgId(undefined);
              setIsAddMemberOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đăng Ký Hội Viên
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (visible only below md breakpoint, non-sticky to respect 15% mobile cap) */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto"
      >
        <button
          type="button"
          onClick={() => setActiveTab('gate')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'gate' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Trạm Kiểm Soát
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'members' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Hội Viên ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'logs' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Nhật Ký ({accessLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'packages' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Gói Tập
        </button>
      </nav>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Contextual Breadcrumb & Page Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Hệ Thống Quản Trị Phòng Gym</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-800 font-medium">
                {activeTab === 'gate' && 'Trạm Kiểm Soát Khuôn Mặt 3D'}
                {activeTab === 'members' && 'Hồ Sơ Hội Viên & Dữ Liệu Sinh Trắc Học'}
                {activeTab === 'logs' && 'Nhật Ký Kiểm Soát Cổng Tự Động'}
                {activeTab === 'packages' && 'Cấu Hình Gói Tập & Phân Tích Lưu Lượng'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {activeTab === 'gate' && 'Trạm Kiểm Soát Ra Vào Bằng Nhận Diện Khuôn Mặt'}
              {activeTab === 'members' && 'Quản Lý Hội Viên & Mã Hóa Sinh Trắc Học Face ID'}
              {activeTab === 'logs' && 'Nhật Ký Xác Thực Ra Vào & Giám Sát An Ninh Cổng'}
              {activeTab === 'packages' && 'Danh Mục Gói Tập & Thống Kê Công Suất Phòng Tập'}
            </h1>
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Cơ sở Quận 1, TP.HCM · Ngày hệ thống: 17/10/2026
          </div>
        </div>

        {/* Action Notification Banner if present */}
        {bannerMessage && (
          <div
            role="status"
            className="px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-4 text-xs text-emerald-950"
          >
            <span className="font-medium">{bannerMessage}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-emerald-800 hover:underline font-semibold whitespace-nowrap shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Full-Width 4-Column Operational KPI Strip */}
        <section
          aria-label="Chỉ Số Vận Hành Thời Gian Thực"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 block">
              Hội Viên Đang Tập Trong Phòng
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {kpis.insideCount} / 80
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                Công suất <span className="font-mono tabular-nums">{Math.round((kpis.insideCount / 80) * 100)}%</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tính theo lượt Check-In qua cổng xoay A1 & A2
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 block">
              Tỷ Lệ Đã Đăng Ký Khuôn Mặt 16-D
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {kpis.faceEnrolledCount} / {members.length}
              </span>
              <span className="text-xs text-blue-700 font-medium">
                <span className="font-mono tabular-nums">{Math.round((kpis.faceEnrolledCount / members.length) * 100)}%</span> hoàn tất
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-mono tabular-nums">{members.length - kpis.faceEnrolledCount}</span> hội viên cần thu thập mẫu khuôn mặt
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 block">
              Lượt Mở Cổng Hợp Lệ / Bị Chặn
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-display">
                <span className="font-mono tabular-nums">{kpis.grantedLogsCount}</span> hợp lệ
              </span>
              <span className="text-xs text-red-700 font-medium">
                <span className="font-mono tabular-nums">{kpis.deniedLogsCount}</span> từ chối
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thời gian nhận diện trung bình: <span className="font-mono tabular-nums">118 ms</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <span className="text-xs text-slate-500 block">
              Hội Viên Sắp Hết Hạn / Quá Hạn
            </span>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-700 font-display">
                <span className="font-mono tabular-nums">{kpis.expiringOrExpiredCount}</span> hồ sơ
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className="text-xs text-blue-700 hover:underline font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Xem & Gia hạn →
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tự động khóa cổng xoay khi quá hạn gói tập
            </p>
          </div>
        </section>

        {/* Active View Content */}
        {activeTab === 'gate' && (
          <GateTerminalView
            members={members}
            accessLogs={accessLogs}
            selectedSubjectId={selectedGateSubjectId}
            onSelectSubject={(id) => setSelectedGateSubjectId(id)}
            onRecordGateScan={handleRecordGateScan}
            onOpenEnrollModal={(member) => setEnrollingMember(member)}
            onOpenRenewModal={(member) => setRenewingMember(member)}
            onQuickBindOpticalFace={(memberId, opticalVector, qualityScore, snapshotUrl) => {
              handleConfirmEnroll(memberId, opticalVector, qualityScore, 'optical_pixel', snapshotUrl);
            }}
            onOpenAddMemberWithOpticalFace={(opticalVector, snapshotUrl) => {
              setPendingOpticalFace({ vector: opticalVector, snapshotUrl });
              setPreselectedPkgId(undefined);
              setIsAddMemberOpen(true);
            }}
            isSuspended={isAddMemberOpen || !!enrollingMember || !!renewingMember}
          />
        )}

        {activeTab === 'members' && (
          <MemberDirectoryView
            members={members}
            onOpenAddMember={() => {
              setPendingOpticalFace(null);
              setPreselectedPkgId(undefined);
              setIsAddMemberOpen(true);
            }}
            onOpenEnrollModal={(member) => setEnrollingMember(member)}
            onOpenRenewModal={(member) => setRenewingMember(member)}
            onToggleFreezeMember={handleToggleFreezeMember}
            onSendToGateScanner={(memberId) => {
              setSelectedGateSubjectId(memberId);
              setActiveTab('gate');
            }}
          />
        )}

        {activeTab === 'logs' && <AccessLogsView accessLogs={accessLogs} />}

        {activeTab === 'packages' && (
          <PackagesAnalyticsView
            packages={packages}
            members={members}
            onSelectPackageForNewMember={(pkgId) => {
              setPendingOpticalFace(null);
              setPreselectedPkgId(pkgId);
              setIsAddMemberOpen(true);
            }}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            TitanFit Biometrics — Hệ Thống Quản Lý Hội Viên & Kiểm Soát Ra Vào Khuôn Mặt
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setMembers(INITIAL_MEMBERS);
                setAccessLogs(INITIAL_ACCESS_LOGS);
                setSelectedGateSubjectId('preset-stranger');
                showNotification('Đã làm mới dữ liệu.');
              }}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Khôi phục dữ liệu mẫu
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => {
          setIsAddMemberOpen(false);
          setPendingOpticalFace(null);
        }}
        packages={packages}
        initialPackageId={preselectedPkgId}
        initialOpticalVector={pendingOpticalFace?.vector}
        initialPhotoUrl={pendingOpticalFace?.snapshotUrl}
        onCreateMember={handleCreateMember}
      />

      <FaceEnrollmentModal
        member={enrollingMember}
        onClose={() => setEnrollingMember(null)}
        onConfirmEnroll={handleConfirmEnroll}
      />

      <RenewPackageModal
        member={renewingMember}
        packages={packages}
        onClose={() => setRenewingMember(null)}
        onConfirmRenew={handleConfirmRenew}
      />
    </div>
  );
}
