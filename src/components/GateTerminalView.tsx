import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanFace,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  UserCheck,
  UserPlus,
  Lock,
  Unlock,
  RefreshCw,
  Sliders,
  Footprints,
  DoorOpen,
} from 'lucide-react';
import {
  GymMember,
  AccessLogEntry,
  GateEvaluationResult,
  BiometricModality,
  evaluateGateAccess,
  perturbVectorForLiveScan,
  generateBiometricVectorFromSeed,
  calculateDaysRemaining,
} from '../utils/gymLogic';
import {
  extractVectorFromVideoElement,
  extractVectorFromImageDataUrl,
} from '../utils/canvasBiometrics';
import { BiometricScannerViewport, BiometricAvatar } from './BiometricFaceGraphic';

interface GateTerminalViewProps {
  members: GymMember[];
  accessLogs: AccessLogEntry[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  onRecordGateScan: (
    evaluation: GateEvaluationResult,
    gateId: AccessLogEntry['gateId'],
    direction: 'IN' | 'OUT',
    processingMs: number
  ) => void;
  onOpenEnrollModal: (member: GymMember) => void;
  onOpenRenewModal: (member: GymMember) => void;
  onQuickBindOpticalFace: (
    memberId: string,
    opticalVector: number[],
    qualityScore: number,
    snapshotDataUrl?: string
  ) => void;
  onOpenAddMemberWithOpticalFace: (
    opticalVector: number[],
    snapshotDataUrl?: string
  ) => void;
  isSuspended?: boolean;
}

export const GateTerminalView: React.FC<GateTerminalViewProps> = ({
  members,
  accessLogs,
  selectedSubjectId,
  onSelectSubject,
  onRecordGateScan,
  onOpenEnrollModal,
  onOpenRenewModal,
  onQuickBindOpticalFace,
  onOpenAddMemberWithOpticalFace,
  isSuspended,
}) => {
  const [gateId, setGateId] = useState<AccessLogEntry['gateId']>('Cổng A1 - Lối Vào Chính');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [thresholdPercent, setThresholdPercent] = useState<number>(84);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanCounter, setScanCounter] = useState<number>(1);

  // Automatic evaluation state (populated automatically by camera without pressing any button!)
  const [lastEvaluation, setLastEvaluation] = useState<GateEvaluationResult | null>(null);

  // Webcam & Uploaded Image states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Last captured optical vector & snapshot (so if unrecognized, user can 1-click enroll/bind it!)
  const [lastOpticalCapture, setLastOpticalCapture] = useState<{
    vector: number[];
    qualityScore: number;
    snapshotUrl: string;
  } | null>(null);
  const [bindTargetMemberId, setBindTargetMemberId] = useState<string>(members[0]?.id || '');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track last logged member & timestamp so continuous auto-scan doesn't duplicate logs every second
  const lastLoggedRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });
  const scanCounterRef = useRef<number>(1);
  const membersRef = useRef<GymMember[]>(members);
  membersRef.current = members;

  const steppingMember = members.find((m) => m.id === selectedSubjectId) || null;
  const isStrangerStepping = selectedSubjectId === 'preset-stranger';
  const isSpoofStepping = selectedSubjectId === 'preset-spoof';

  // Helper to run 1:N automatic verification and immediately open/lock the door
  const triggerAutomaticGateDecision = useCallback(
    (
      probeVector: number[],
      livenessScore: number,
      probeModality: BiometricModality,
      currentCount: number
    ) => {
      const evaluation = evaluateGateAccess({
        probeVector,
        livenessScore,
        members: membersRef.current,
        thresholdPercent,
        referenceDateStr: '2026-10-17',
        expectedMemberId: null, // Pure 1:N hands-free identification
        probeModality,
      });

      setLastEvaluation(evaluation);

      // Record log automatically if this is a new person/outcome or > 8 seconds since last log for same person
      const logKey = `${evaluation.resultStatus}-${evaluation.matchedMember?.id || 'unknown'}-${direction}`;
      const nowMs = Date.now();
      if (
        lastLoggedRef.current.key !== logKey ||
        nowMs - lastLoggedRef.current.time > 8000
      ) {
        lastLoggedRef.current = { key: logKey, time: nowMs };
        const processingMs = 95 + ((currentCount * 17) % 35);
        onRecordGateScan(evaluation, gateId, direction, processingMs);
      }
    },
    [thresholdPercent, gateId, direction, onRecordGateScan]
  );

  // Run 3D simulation scan automatically for a person stepping in front of the sensor
  const runSimulatedSensorAutoScan = useCallback(
    (subjectId: string) => {
      setIsScanning(true);
      const nextCount = scanCounterRef.current + 1;
      scanCounterRef.current = nextCount;
      setScanCounter(nextCount);

      let probeVector: number[] = [];
      let livenessScore = 98.6;
      let probeModality: BiometricModality = '3d_template';

      const targetMember = membersRef.current.find((m) => m.id === subjectId) || null;

      if (subjectId === 'preset-spoof') {
        probeVector = perturbVectorForLiveScan(membersRef.current[0].faceVector, 0.04, nextCount);
        livenessScore = 58.4;
      } else if (subjectId === 'preset-stranger') {
        probeVector = generateBiometricVectorFromSeed(`STRANGER-UNREGISTERED-${nextCount}`);
        livenessScore = 96.2;
      } else if (targetMember) {
        probeModality = targetMember.faceModality || '3d_template';
        if (!targetMember.faceEnrolled || targetMember.faceVector.length === 0) {
          probeVector = generateBiometricVectorFromSeed(`UNENROLLED-${targetMember.id}`);
          livenessScore = 97.4;
        } else {
          probeVector = perturbVectorForLiveScan(targetMember.faceVector, 0.03, nextCount);
          livenessScore = Number((97.6 + ((nextCount * 7) % 20) * 0.1).toFixed(1));
        }
      }

      triggerAutomaticGateDecision(probeVector, livenessScore, probeModality, nextCount);
    },
    [triggerAutomaticGateDecision]
  );

  // AUTO-START WEBCAM ON INITIAL MOUNT! If no physical webcam is available, auto-run sensor on current subject!
  useEffect(() => {
    if (isSuspended) {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
      return;
    }

    let cancelled = false;
    let activeStream: MediaStream | null = null;

    const initHandsFreeCamera = async () => {
      const isHeadless =
        navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

      if (!isHeadless && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          activeStream = stream;
          setCameraActive(true);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }, 50);
          return;
        } catch {
          // Fallback to automatic 3D sensor if physical webcam unavailable or denied
        }
      }

      if (!cancelled) {
        setCameraActive(false);
      }
    };

    initHandsFreeCamera();

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isSuspended]); // Re-init when modal closes

  // CONTINUOUS REAL-TIME AUTO-VERIFICATION LOOP WHEN WEBCAM IS ACTIVE (Every 750ms — ZERO BUTTON CLICKS!)
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const liveExtract = extractVectorFromVideoElement(videoRef.current);
        if (liveExtract.validFace && liveExtract.vector.length === 16) {
          setLastOpticalCapture({
            vector: liveExtract.vector,
            qualityScore: liveExtract.qualityScore,
            snapshotUrl: liveExtract.snapshotDataUrl,
          });
          const nextCount = scanCounterRef.current + 1;
          scanCounterRef.current = nextCount;
          setScanCounter(nextCount);
          triggerAutomaticGateDecision(
            liveExtract.vector,
            liveExtract.qualityScore,
            'optical_pixel',
            nextCount
          );
        }
      }
    }, 750);
    return () => clearInterval(interval);
  }, [cameraActive, triggerAutomaticGateDecision]);

  // Signature of member biometric/contract state so renewing a package or enrolling Face ID immediately opens the door!
  const biometricRegistrySignature = members
    .map(
      (m) =>
        `${m.id}:${m.status}:${m.endDate}:${m.faceEnrolled}:${m.faceModality || '3d'}:${
          m.faceVector[0] ?? 0
        }`
    )
    .join('|');

  useEffect(() => {
    if (cameraActive) return;
    if (uploadedImageUrl && lastOpticalCapture) {
      triggerAutomaticGateDecision(
        lastOpticalCapture.vector,
        lastOpticalCapture.qualityScore,
        'optical_pixel',
        scanCounterRef.current
      );
    } else {
      runSimulatedSensorAutoScan(selectedSubjectId);
    }
  }, [biometricRegistrySignature, thresholdPercent, selectedSubjectId, cameraActive]);

  const handleToggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      setCameraActive(true);
      setUploadedImageUrl(null);
      setLastEvaluation(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (cameraActive && videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        setCameraActive(false);
      }
      setUploadedImageUrl(dataUrl);
      const extracted = await extractVectorFromImageDataUrl(dataUrl);
      const nextCount = scanCounterRef.current + 1;
      scanCounterRef.current = nextCount;
      setScanCounter(nextCount);
      if (extracted.validFace && extracted.vector.length === 16) {
        setLastOpticalCapture({
          vector: extracted.vector,
          qualityScore: extracted.qualityScore,
          snapshotUrl: dataUrl,
        });
        triggerAutomaticGateDecision(
          extracted.vector,
          extracted.qualityScore,
          'optical_pixel',
          nextCount
        );
      } else {
        triggerAutomaticGateDecision([], 85.0, 'optical_pixel', nextCount);
      }
    };
    reader.readAsDataURL(file);
  };

  // Stepping in front of the sensor immediately triggers automatic recognition & door opening (zero extra buttons!)
  const handlePersonStepsIntoCamera = (subjectId: string) => {
    if (cameraActive && videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    }
    setUploadedImageUrl(null);
    setLastOpticalCapture(null);
    if (selectedSubjectId === subjectId) {
      runSimulatedSensorAutoScan(subjectId);
    } else {
      onSelectSubject(subjectId);
    }
  };

  // Bind the currently captured webcam/photo face to an existing member -> door opens immediately!
  const handleBindOpticalFaceNow = () => {
    if (!lastOpticalCapture) return;
    onQuickBindOpticalFace(
      bindTargetMemberId,
      lastOpticalCapture.vector,
      lastOpticalCapture.qualityScore,
      lastOpticalCapture.snapshotUrl
    );
    const updatedMembers = members.map((m) =>
      m.id === bindTargetMemberId
        ? {
            ...m,
            faceEnrolled: true,
            faceModality: 'optical_pixel' as const,
            faceVector: lastOpticalCapture.vector,
            faceQualityScore: lastOpticalCapture.qualityScore,
            enrolledPhotoDataUrl: lastOpticalCapture.snapshotUrl,
          }
        : m
    );
    const evaluation = evaluateGateAccess({
      probeVector: lastOpticalCapture.vector,
      livenessScore: lastOpticalCapture.qualityScore,
      members: updatedMembers,
      thresholdPercent,
      referenceDateStr: '2026-10-17',
      expectedMemberId: null,
      probeModality: 'optical_pixel',
    });
    setLastEvaluation(evaluation);
    onRecordGateScan(evaluation, gateId, direction, 108);
  };

  const identifiedMember: GymMember | null = lastEvaluation?.matchedMember || null;

  const viewportDisplayName = identifiedMember
    ? lastEvaluation?.granted
      ? `${identifiedMember.fullName} — CỬA MỞ TỰ ĐỘNG`
      : `${identifiedMember.fullName} — CỬA KHÓA`
    : lastEvaluation && !lastEvaluation.granted
    ? 'CHƯA ĐĂNG KÝ FACE ID — CỬA KHÓA'
    : 'ĐANG QUÉT TỰ ĐỘNG...';

  const viewportDisplayCode = identifiedMember
    ? identifiedMember.memberCode
    : lastEvaluation && !lastEvaluation.granted
    ? 'DOOR LOCKED'
    : 'AUTO-GATE 24/7';

  const previewSimilarity = lastEvaluation ? lastEvaluation.similarityScore : 0.0;
  const previewLiveness = lastEvaluation ? lastEvaluation.livenessScore : 98.8;

  const scanVisualState: 'idle' | 'granted' | 'denied' = !lastEvaluation
    ? 'idle'
    : lastEvaluation.granted
    ? 'granted'
    : 'denied';

  const displayVector =
    lastOpticalCapture?.vector.length === 16
      ? lastOpticalCapture.vector.slice(0, 8)
      : identifiedMember?.faceVector.length === 16
      ? identifiedMember.faceVector.slice(0, 8)
      : steppingMember?.faceVector.length === 16
      ? steppingMember.faceVector.slice(0, 8)
      : generateBiometricVectorFromSeed('STANDBY-VECTOR').slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Main 2-Column Split: Continuous Hands-Free Camera Gate (Left 7 cols) + Automatic Door & Member Output (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Hands-Free Continuous Biometric Camera */}
        <section
          aria-label="Trạm Camera Nhận Diện Khuôn Mặt Tự Động"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Cổng Camera Nhận Diện Tự Động Liên Tục (Không Chạm · Không Bấm Nút)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hội viên bước vào vùng Camera là hệ thống tự nhận diện khuôn mặt và mở cửa ngay lập tức
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleCamera}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  cameraActive
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{cameraActive ? 'Webcam Đang Quét Tự Động' : 'Bật Lại Webcam Thực'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Đưa ảnh khuôn mặt vào vùng quét tự động"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Đưa Ảnh Vào Cam</span>
              </button>
            </div>
          </div>

          {/* Gate & Direction Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="gate-lane-select" className="block text-xs font-medium text-slate-700 mb-1">
                Làn Cổng Kiểm Soát
              </label>
              <select
                id="gate-lane-select"
                value={gateId}
                onChange={(e) => setGateId(e.target.value as AccessLogEntry['gateId'])}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Cổng A1 - Lối Vào Chính">Cổng A1 - Lối Vào Chính</option>
                <option value="Cổng A2 - Khu VIP & PT">Cổng A2 - Khu VIP & PT</option>
                <option value="Cổng B1 - Lối Ra">Cổng B1 - Lối Ra</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Chiều Lưu Thông
              </span>
              <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-md">
                <button
                  type="button"
                  onClick={() => setDirection('IN')}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    direction === 'IN'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Check-In (Vào)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('OUT')}
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    direction === 'OUT'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Check-Out (Ra)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="threshold-slider" className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-500" />
                  <span>Ngưỡng Mở Cửa</span>
                </span>
                <span className="font-mono tabular-nums text-blue-700 font-semibold">{thresholdPercent}%</span>
              </label>
              <input
                id="threshold-slider"
                type="range"
                min={75}
                max={96}
                step={1}
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer mt-1.5"
              />
            </div>
          </div>

          {/* Biometric Viewport */}
          <BiometricScannerViewport
            subjectName={viewportDisplayName}
            memberCode={viewportDisplayCode}
            landmarks={steppingMember?.landmarks}
            isScanning={isScanning}
            scanResult={scanVisualState}
            similarityScore={previewSimilarity}
            livenessScore={previewLiveness}
            isSpoofTest={isSpoofStepping}
            uploadedImageUrl={uploadedImageUrl || steppingMember?.enrolledPhotoDataUrl}
            videoRef={videoRef}
            cameraActive={cameraActive}
          />

          {/* Hands-Free Simulation Walk-Up Strip: Stepping in front of camera immediately opens/locks door with ZERO extra buttons */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  Giả Lập Người Đi Ngang Qua Camera (Đi vào vùng quét là Cửa tự mở/khóa ngay — Không cần bấm nút):
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.slice(0, 6).map((person, idx) => {
                const isCurrentWalker =
                  !cameraActive && !uploadedImageUrl && selectedSubjectId === person.id;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handlePersonStepsIntoCamera(person.id)}
                    className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      isCurrentWalker
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <BiometricAvatar
                      name={person.fullName}
                      landmarks={person.landmarks}
                      photoUrl={person.enrolledPhotoDataUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">
                        Khách #{idx + 1} đi qua
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isCurrentWalker ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {person.faceEnrolled
                          ? person.fullName.split(' ').slice(-2).join(' ')
                          : 'Chưa có Face ID'}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePersonStepsIntoCamera('preset-stranger')}
                className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  !cameraActive && !uploadedImageUrl && isStrangerStepping
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-mono shrink-0">
                  ?
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">Người lạ đi qua</div>
                  <div
                    className={`text-[11px] truncate ${
                      !cameraActive && !uploadedImageUrl && isStrangerStepping
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Chưa đăng ký
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePersonStepsIntoCamera('preset-spoof')}
                className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  !cameraActive && !uploadedImageUrl && isSpoofStepping
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-red-950 text-red-200 flex items-center justify-center text-xs font-mono shrink-0">
                  IR
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">Giơ ảnh điện thoại</div>
                  <div
                    className={`text-[11px] truncate ${
                      !cameraActive && !uploadedImageUrl && isSpoofStepping
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    Chống giả mạo
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Automatic Door Mechanism & Identified Member Dossier */}
        <section
          aria-label="Trạng Thái Cửa Tự Động & Hồ Sơ Hội Viên"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between divide-y divide-slate-200"
        >
          {/* Zone 1: Physical Turnstile Door Status (Opens automatically on valid scan!) */}
          <div className="pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Cửa Tự Động & Hồ Sơ Nhận Diện Tức Thì
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {gateId} · Tự động xác thực và kích hoạt chốt cửa trong 0.1 giây
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
                CSDL: {members.filter((m) => m.faceEnrolled).length} Face ID
              </span>
            </div>

            {/* Automatic Door Relay Status Banner */}
            <div
              data-testid="gate-decision-banner"
              className={`p-4 rounded-lg ${
                !lastEvaluation
                  ? 'bg-slate-100 text-slate-800'
                  : lastEvaluation.granted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              <div className="flex items-start gap-3">
                {!lastEvaluation ? (
                  <ScanFace className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" />
                ) : lastEvaluation.granted ? (
                  <DoorOpen className="w-6 h-6 text-white shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-6 h-6 text-white shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-base font-bold tracking-tight">
                    {!lastEvaluation
                      ? 'CỬA ĐANG ĐÓNG — ĐANG QUÉT TÌM KHUÔN MẶT TỰ ĐỘNG'
                      : lastEvaluation.granted
                      ? 'CỬA ĐÃ MỞ TỰ ĐỘNG — MỜI HỘI VIÊN QUA!'
                      : 'CỬA KHÓA TỰ ĐỘNG — TỪ CHỐI MỞ CỬA'}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      !lastEvaluation ? 'text-slate-600' : 'text-white/95'
                    }`}
                  >
                    {!lastEvaluation
                      ? 'Chỉ cần nhìn thẳng vào camera, hệ thống tự động so khớp khuôn mặt và mở cửa ngay mà không cần nhấn nút.'
                      : lastEvaluation.reasonVi}
                  </p>
                </div>
              </div>

              {/* Biometric Telemetry Metrics Row */}
              <div
                className={`grid grid-cols-3 gap-3 mt-3.5 pt-2.5 border-t text-xs ${
                  !lastEvaluation ? 'border-slate-200' : 'border-white/25'
                }`}
              >
                <div>
                  <span className={!lastEvaluation ? 'text-slate-500 block' : 'text-white/80 block'}>
                    Độ Khớp Face ID
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-sm">
                    {lastEvaluation ? `${lastEvaluation.similarityScore.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div>
                  <span className={!lastEvaluation ? 'text-slate-500 block' : 'text-white/80 block'}>
                    Thực Thể (IR)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-sm">
                    {lastEvaluation ? `${lastEvaluation.livenessScore.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div>
                  <span className={!lastEvaluation ? 'text-slate-500 block' : 'text-white/80 block'}>
                    Chốt Cửa Từ
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-sm">
                    {!lastEvaluation
                      ? 'ĐANG CHỜ'
                      : lastEvaluation.turnstileAction === 'OPEN_GREEN'
                      ? 'ĐÃ MỞ CỬA'
                      : 'ĐÃ KHÓA'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone 2: Auto-Discovered Member Dossier */}
          <div className="py-4">
            {identifiedMember ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-emerald-800">
                  Thông Tin Hội Viên Vừa Quét Qua Cổng:
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <BiometricAvatar
                      name={identifiedMember.fullName}
                      landmarks={identifiedMember.landmarks}
                      photoUrl={identifiedMember.enrolledPhotoDataUrl}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {identifiedMember.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono tabular-nums">
                        <span>{identifiedMember.memberCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{identifiedMember.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Unboxed clean semantic status text */}
                  <div className="text-right shrink-0">
                    {identifiedMember.status === 'active' && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Đang hoạt động</span>
                      </span>
                    )}
                    {identifiedMember.status === 'expiring_soon' && (
                      <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 justify-end">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Sắp hết hạn</span>
                      </span>
                    )}
                    {identifiedMember.status === 'expired' && (
                      <span className="text-xs font-semibold text-red-700 flex items-center gap-1 justify-end">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Đã hết hạn</span>
                      </span>
                    )}
                    {identifiedMember.status === 'frozen' && (
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Đang bảo lưu</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-mono tabular-nums block mt-0.5">
                      Hạn: {identifiedMember.endDate}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-2 text-xs">
                  <div>
                    <span className="text-slate-500">Gói đăng ký:</span>
                    <p className="font-medium text-slate-900 mt-0.5">{identifiedMember.packageName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Thời hạn còn lại:</span>
                    <p className="font-mono tabular-nums font-medium text-slate-900 mt-0.5">
                      {calculateDaysRemaining(identifiedMember.endDate, '2026-10-17') >= 0
                        ? `Còn ${calculateDaysRemaining(identifiedMember.endDate, '2026-10-17')} ngày`
                        : `Quá hạn ${Math.abs(calculateDaysRemaining(identifiedMember.endDate, '2026-10-17'))} ngày`}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Buổi PT & Lượt tập:</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      <span className="font-mono tabular-nums">{identifiedMember.ptSessionsRemaining}</span> buổi PT ·{' '}
                      <span className="font-mono tabular-nums">{identifiedMember.totalCheckIns}</span> lượt tập
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Huấn luyện viên & Tủ đồ:</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {identifiedMember.assignedTrainer || 'Tự tập'} · Tủ {identifiedMember.lockerNumber || 'Tự chọn'}
                    </p>
                  </div>
                </div>

                {/* Contextual Remedial Actions right inside the Gate Verification Panel */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {(identifiedMember.status === 'expired' || identifiedMember.status === 'expiring_soon') && (
                    <button
                      type="button"
                      onClick={() => onOpenRenewModal(identifiedMember)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gia Hạn Gói Tập Ngay</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenEnrollModal(identifiedMember)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Cập Nhật Lại Mẫu Face ID</span>
                  </button>
                </div>
              </div>
            ) : lastOpticalCapture && lastEvaluation && !lastEvaluation.granted ? (
              /* REAL WEBCAM / PHOTO UNRECOGNIZED FACE -> Strict Block + 1-Click Admin Enrollment */
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {lastOpticalCapture.snapshotUrl && (
                    <img
                      src={lastOpticalCapture.snapshotUrl}
                      alt="Khuôn mặt vừa thu từ camera"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-red-700">
                      Đã chặn: Khuôn mặt trước Camera chưa có trong danh sách Face ID
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Nếu đây là hội viên mới hoặc cần gán khuôn mặt thực tế này vào hồ sơ, lễ tân chọn bên dưới để lưu. Ngay khi lưu xong, mỗi lần nhìn vào Cam cửa sẽ tự mở!
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg space-y-2.5 text-xs">
                  <label htmlFor="quick-bind-member-select" className="block font-medium text-slate-800">
                    Gán khuôn mặt đang nhìn Cam cho hội viên:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="quick-bind-member-select"
                      value={bindTargetMemberId}
                      onChange={(e) => setBindTargetMemberId(e.target.value)}
                      className="min-w-0 flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.memberCode})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleBindOpticalFaceNow}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Lưu Mặt Này & Mở Cửa Luôn
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Hoặc đăng ký hội viên mới:</span>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenAddMemberWithOpticalFace(
                          lastOpticalCapture.vector,
                          lastOpticalCapture.snapshotUrl
                        )
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tạo Hội Viên Mới Với Mặt Này</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-600 space-y-2">
                <div className="font-semibold text-slate-900">
                  {lastEvaluation && !lastEvaluation.granted
                    ? 'Đã khóa cửa tự động: Khuôn mặt không hợp lệ hoặc chưa đăng ký'
                    : 'Cảm biến cổng đang hoạt động tự động 100%'}
                </div>
                <p className="leading-relaxed">
                  Hội viên đi qua trước Camera sẽ được tự động nhận diện khuôn mặt và mở cửa ngay lập tức mà không cần bấm bất kỳ nút xác thực nào.
                </p>
              </div>
            )}
          </div>

          {/* Zone 3: 16-D Biometric Feature Vector Telemetry Strip */}
          <div className="pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Vector Khuôn Mặt Thu Từ Cảm Biến (8/16 Chiều Chính)</span>
              <span className="font-mono tabular-nums">Auto-Trigger 0.1s</span>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {displayVector.map((val, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded p-1.5 text-center"
                >
                  <span className="block text-[10px] text-slate-400 font-mono">D{idx + 1}</span>
                  <span className="block text-xs font-mono tabular-nums font-medium text-slate-800 mt-0.5">
                    {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Recent Real-Time Gate Access Stream */}
      <section
        aria-label="Nhật Ký Quét Cổng Gần Đây"
        className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Luồng Sự Kiện Mở / Khóa Cửa Tự Động Thời Gian Thực
            </h3>
            <p className="text-xs text-slate-500">
              Tự động ghi nhận khi có người đi qua vùng quét Camera · Hiển thị 6 lượt gần nhất
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Tổng sự kiện hôm nay: {accessLogs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Thời Gian</th>
                <th className="py-2.5 px-4">Cổng & Chiều</th>
                <th className="py-2.5 px-4">Hội Viên Nhận Diện</th>
                <th className="py-2.5 px-4 text-right">Độ Khớp Face ID</th>
                <th className="py-2.5 px-4 text-right">Thực Thể IR</th>
                <th className="py-2.5 px-4">Quyết Định Cửa Tự Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {accessLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                    <span>{log.gateId}</span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="font-mono font-medium">
                      {log.direction === 'IN' ? 'VÀO' : 'RA'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-slate-900">{log.memberName}</div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      {log.memberCode} · {log.packageName}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {log.similarityScore.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                    {log.livenessScore.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {log.result === 'granted' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span
                        className={`font-medium ${
                          log.result === 'granted' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {log.reasonVi}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
