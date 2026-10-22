import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ScanFace,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  AlertCircle,
  Camera,
  Upload,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  GymMember,
  GymPackage,
  BiometricModality,
  validateNewMemberInput,
  generateBiometricVectorFromSeed,
  calculateDaysRemaining,
} from '../utils/gymLogic';
import {
  extractVectorFromVideoElement,
  extractVectorFromImageDataUrl,
} from '../utils/canvasBiometrics';
import { BiometricAvatar } from './BiometricFaceGraphic';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: GymPackage[];
  initialPackageId?: string;
  initialOpticalVector?: number[];
  initialPhotoUrl?: string;
  onCreateMember: (newMemberData: {
    fullName: string;
    phone: string;
    email: string;
    packageId: string;
    gender: 'Nam' | 'Nữ';
    enrollFaceNow: boolean;
    assignedTrainer: string;
    customFaceVector?: number[];
    customFaceModality?: BiometricModality;
    enrolledPhotoDataUrl?: string;
  }) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  packages,
  initialPackageId,
  initialOpticalVector,
  initialPhotoUrl,
  onCreateMember,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [packageId, setPackageId] = useState(initialPackageId || packages[1]?.id || 'pkg-3m-pro');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [assignedTrainer, setAssignedTrainer] = useState('HLV Trần Đức Bảo');

  // Mandatory Biometric Face Capture State
  const [capturedVector, setCapturedVector] = useState<number[] | null>(initialOpticalVector || null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(initialPhotoUrl || null);
  const [capturedQuality, setCapturedQuality] = useState<number>(98.6);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize camera as soon as modal opens
  useEffect(() => {
    if (!isOpen) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setCameraStream(null);
      setIsCameraActive(false);
      return;
    }

    // If pre-passed optical vector exists (e.g. from gate quick-add), use it
    if (initialOpticalVector && initialOpticalVector.length === 16) {
      setCapturedVector(initialOpticalVector);
      if (initialPhotoUrl) setCapturedPhotoUrl(initialPhotoUrl);
      return;
    }

    let cancelled = false;
    setCameraError(null);

    const initCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ truy cập camera. Vui lòng tải ảnh từ máy tính.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setCameraStream(stream);
        setIsCameraActive(true);
      } catch {
        if (!cancelled) {
          setIsCameraActive(false);
          setCameraError('Chưa thể mở camera. Vui lòng cho phép quyền truy cập camera trên trình duyệt hoặc chọn tải ảnh từ máy tính.');
        }
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, initialOpticalVector, initialPhotoUrl]);

  // Ensure camera stream is assigned to video element whenever active
  useEffect(() => {
    if (modalVideoRef.current && cameraStream && !capturedPhotoUrl) {
      modalVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive, capturedPhotoUrl]);

  if (!isOpen) return null;

  // Capture face from live webcam
  const handleCaptureFace = () => {
    setFaceError(null);
    if (!modalVideoRef.current || modalVideoRef.current.readyState < 2) {
      setFaceError('Camera đang khởi động. Vui lòng chờ 1-2 giây rồi bấm lại.');
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      if (!modalVideoRef.current) {
        setIsScanning(false);
        return;
      }
      const res = extractVectorFromVideoElement(modalVideoRef.current);
      setIsScanning(false);

      if (res.validFace && res.vector.length === 16) {
        setCapturedVector(res.vector);
        setCapturedPhotoUrl(res.snapshotDataUrl || null);
        setCapturedQuality(res.qualityScore);
        setFaceError(null);
      } else {
        setFaceError('Không nhận diện được khuôn mặt rõ ràng trong khung hình! Vui lòng nhìn thẳng vào camera, đủ sáng và bấm quét lại.');
      }
    }, 200);
  };

  const handleRetakeFace = () => {
    setCapturedVector(null);
    setCapturedPhotoUrl(null);
    setFaceError(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await extractVectorFromImageDataUrl(dataUrl);
      if (res.validFace && res.vector.length === 16) {
        setCapturedVector(res.vector);
        setCapturedPhotoUrl(dataUrl);
        setCapturedQuality(res.qualityScore);
        setFaceError(null);
      } else {
        setFaceError('Ảnh tải lên không phát hiện được khuôn mặt rõ ràng. Vui lòng chọn ảnh chụp rõ mặt.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetryCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Vẫn không thể kết nối camera. Vui lòng kiểm tra quyền camera hoặc tải ảnh từ máy.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateNewMemberInput({ fullName, phone, email, packageId });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    // BẮT BUỘC: Phải có vector khuôn mặt thực tế
    if (!capturedVector || capturedVector.length !== 16) {
      setFaceError('BẮT BUỘC: Bạn phải quét khuôn mặt trước camera thành công trước khi hoàn tất đăng ký!');
      return;
    }

    onCreateMember({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${phone.trim()}@titanfit.vn`,
      packageId,
      gender,
      enrollFaceNow: true,
      assignedTrainer,
      customFaceVector: capturedVector,
      customFaceModality: 'optical_pixel',
      enrolledPhotoDataUrl: capturedPhotoUrl || undefined,
    });

    setFullName('');
    setPhone('');
    setEmail('');
    setCapturedVector(null);
    setCapturedPhotoUrl(null);
    setFaceError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl my-4">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="add-member-modal-title" className="text-base font-bold text-slate-900">
                Đăng Ký Hội Viên & Quét Khuôn Mặt Face ID
              </h2>
              <p className="text-xs text-slate-500">
                Bắt buộc xác thực khuôn mặt qua camera để tự động mở cổng ra vào
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại đăng ký hội viên"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-5">
          {/* Section 1: Member Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>1. Thông tin cá nhân & Gói tập</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="new-member-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên hội viên <span className="text-red-600">*</span>
                </label>
                <input
                  id="new-member-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new-member-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại <span className="text-red-600">*</span>
                </label>
                <input
                  id="new-member-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909123456"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new-member-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới tính
                </label>
                <select
                  id="new-member-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-member-package" className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn gói tập <span className="text-red-600">*</span>
                </label>
                <select
                  id="new-member-package"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationDays} ngày · {new Intl.NumberFormat('vi-VN').format(p.priceVnd)}đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-member-trainer" className="block text-xs font-semibold text-slate-700 mb-1">
                  Huấn luyện viên phụ trách (PT)
                </label>
                <select
                  id="new-member-trainer"
                  value={assignedTrainer}
                  onChange={(e) => setAssignedTrainer(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="HLV Trần Đức Bảo">HLV Trần Đức Bảo (Strength & Conditioning)</option>
                  <option value="HLV Phạm Thu Hà">HLV Phạm Thu Hà (Body Transformation)</option>
                  <option value="HLV Nguyễn Tuấn Kiệt">HLV Nguyễn Tuấn Kiệt (Hypertrophy & Rehab)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: MANDATORY Real Biometric Face Verification */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ScanFace className="w-4 h-4 text-blue-600" />
                <span>2. Xác thực khuôn mặt qua Camera (Bắt buộc)</span>
              </h3>
              {capturedPhotoUrl && (
                <span className="px-2 py-0.5 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã quét hợp lệ
                </span>
              )}
            </div>

            {/* Error Message Banner */}
            {faceError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-800 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{faceError}</span>
              </div>
            )}

            {/* If face has been successfully captured: display success preview */}
            {capturedPhotoUrl && capturedVector ? (
              <div className="p-4 bg-emerald-50/70 border-2 border-emerald-500 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={capturedPhotoUrl}
                      alt="Ảnh khuôn mặt đã quét"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-600 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <strong className="text-sm font-bold text-emerald-900 block flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Đã Xác Thực & Mã Hóa Face ID Thành Công!
                    </strong>
                    <p className="text-emerald-800 font-medium">
                      Vector quang học: <span className="font-mono font-bold">16 chiều (16-D)</span> · Độ chuẩn xác: <span className="font-mono font-bold text-emerald-900">{capturedQuality.toFixed(1)}%</span>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Hội viên này sẽ tự động được nhận diện và mở cửa khi bước vào camera trạm cổng.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRetakeFace}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Quét Lại Khuôn Mặt</span>
                </button>
              </div>
            ) : (
              /* Live Camera Viewfinder for Real-Time Face Verification */
              <div className="space-y-3">
                <div className="relative w-full aspect-[16/9] max-h-[250px] bg-slate-950 rounded-xl overflow-hidden border-2 border-blue-500/40 flex items-center justify-center shadow-inner">
                  {isCameraActive ? (
                    <video
                      ref={modalVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-medium text-slate-300">
                        {cameraError || 'Đang kết nối camera sinh trắc học...'}
                      </p>
                      {cameraError && (
                        <button
                          type="button"
                          onClick={handleRetryCamera}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                        >
                          Thử Lại Camera
                        </button>
                      )}
                    </div>
                  )}

                  {/* Face Target Oval Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-[50%] border-2 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-400/80 animate-ping" />
                      </div>

                      {/* Scanning animation bar */}
                      {isScanning && (
                        <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
                      )}

                      {/* HUD Badge */}
                      <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900/80 backdrop-blur-xs rounded-md text-[10px] font-mono text-sky-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        LIVE CAM · NHÌN THẲNG VÀO KHUNG HÌNH
                      </div>
                    </div>
                  )}
                </div>

                {/* Big Prominent Face Capture Action Button */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCaptureFace}
                    disabled={!isCameraActive || isScanning}
                    className={`flex-1 w-full py-3 px-4 text-xs sm:text-sm font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isCameraActive && !isScanning
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.99]'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4 animate-bounce" />
                    <span>
                      {isScanning
                        ? 'ĐANG PHÂN TÍCH & TRÍCH XUẤT VECTOR 16-D...'
                        : '📸 BẤM ĐỂ QUÉT & CHỤP KHUÔN MẶT (BẮT BUỘC)'}
                    </span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                capturedVector
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
            >
              {capturedVector ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn Tất Đăng Ký (Face ID Đã Sẵn Sàng)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Chưa Quét Khuôn Mặt — Hãy Quét Trước</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FaceEnrollmentModalProps {
  member: GymMember | null;
  onClose: () => void;
  onConfirmEnroll: (
    memberId: string,
    newVector: number[],
    qualityScore: number,
    modality: BiometricModality,
    photoDataUrl?: string
  ) => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  member,
  onClose,
  onConfirmEnroll,
}) => {
  const [enrollSource, setEnrollSource] = useState<'3d_template' | 'webcam' | 'upload'>('webcam');
  const [customVector, setCustomVector] = useState<number[] | null>(null);
  const [customQuality, setCustomQuality] = useState<number>(98.9);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | undefined>(undefined);
  const [webcamStreamActive, setWebcamStreamActive] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically start webcam when FaceEnrollmentModal opens so user can enroll their real face immediately
  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          setEnrollSource('webcam');
          setWebcamStreamActive(true);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }, 50);
        })
        .catch(() => {
          setEnrollSource('3d_template');
          setWebcamStreamActive(false);
        });
    } else {
      setEnrollSource('3d_template');
    }

    return () => {
      cancelled = true;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [member]);

  if (!member) return null;

  const canonical3dVector = generateBiometricVectorFromSeed(
    `${member.memberCode}-${member.fullName.toUpperCase()}`
  );

  const activeVector = customVector || canonical3dVector;

  const handleUploadEnrollPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnrollSource('upload');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await extractVectorFromImageDataUrl(dataUrl);
      if (!res.validFace || res.vector.length === 0) {
        setStatusMsg('Ảnh tải lên không rõ nét. Vui lòng chọn ảnh chân dung rõ mặt.');
        return;
      }
      setCustomVector(res.vector);
      setCustomQuality(res.qualityScore);
      setCapturedPhotoUrl(dataUrl);
      setStatusMsg('Đã trích xuất thành công Vector 16-D từ ảnh chân dung!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFaceId = () => {
    // If webcam is currently active and user clicks Save directly, automatically extract from the live video right now!
    if (enrollSource === 'webcam' && webcamStreamActive && videoRef.current && !customVector) {
      const res = extractVectorFromVideoElement(videoRef.current);
      if (res.validFace && res.vector.length === 16) {
        onConfirmEnroll(
          member.id,
          res.vector,
          res.qualityScore,
          'optical_pixel',
          res.snapshotDataUrl
        );
        onClose();
        return;
      }
    }

    const modality: BiometricModality =
      enrollSource === '3d_template' && !customVector ? '3d_template' : 'optical_pixel';
    onConfirmEnroll(
      member.id,
      activeVector,
      customVector ? customQuality : 98.9,
      modality,
      capturedPhotoUrl
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-face-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanFace className="w-4 h-4 text-blue-600" />
            <h2 id="enroll-face-modal-title" className="text-base font-semibold text-slate-900">
              Đăng Ký / Cập Nhật Khuôn Mặt Cho Hội Viên
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại Face ID"
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <BiometricAvatar
              name={member.fullName}
              landmarks={member.landmarks}
              photoUrl={capturedPhotoUrl || member.enrolledPhotoDataUrl}
              size="lg"
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">{member.fullName}</div>
              <div className="text-xs font-mono tabular-nums text-slate-500">
                {member.memberCode} · {member.packageName}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {webcamStreamActive || customVector
                    ? 'Sẵn sàng lưu khuôn mặt thực tế (Nhìn cam tự mở cửa)'
                    : 'Mẫu sinh trắc học 3D định danh độc lập'}
                </span>
              </div>
            </div>
          </div>

          {webcamStreamActive && (
            <div className="space-y-2">
              <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-600 text-center">
                Nhìn thẳng vào camera và nhấn <strong>"Lưu Khuôn Mặt Vào Hồ Sơ"</strong> bên dưới.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadEnrollPhoto}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Hoặc tải ảnh mẫu từ máy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEnrollSource('3d_template');
                setCustomVector(null);
                setWebcamStreamActive(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Dùng mẫu 3D mặc định
            </button>
          </div>

          {statusMsg && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
              {statusMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveFaceId}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lưu Khuôn Mặt Vào Hồ Sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RenewPackageModalProps {
  member: GymMember | null;
  packages: GymPackage[];
  onClose: () => void;
  onConfirmRenew: (memberId: string, packageId: string) => void;
}

export const RenewPackageModal: React.FC<RenewPackageModalProps> = ({
  member,
  packages,
  onClose,
  onConfirmRenew,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    member?.packageId || packages[1]?.id || 'pkg-3m-pro'
  );

  if (!member) return null;

  const chosenPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
  const currentDays = calculateDaysRemaining(member.endDate, '2026-10-17');

  const handleConfirm = () => {
    onConfirmRenew(member.id, chosenPkg.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="renew-package-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <h2 id="renew-package-modal-title" className="text-base font-semibold text-slate-900">
              Gia Hạn Gói Tập & Mở Khóa Cổng Tự Động
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại gia hạn"
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-900 text-sm">{member.fullName}</div>
            <div className="text-slate-600 font-mono tabular-nums">
              Mã thẻ: {member.memberCode} · Hạn hiện tại: {member.endDate} (
              {currentDays >= 0 ? `Còn ${currentDays} ngày` : `Quá hạn ${Math.abs(currentDays)} ngày`})
            </div>
          </div>

          <div>
            <label htmlFor="renew-pkg-select" className="block text-xs font-medium text-slate-700 mb-1.5">
              Chọn gói tập gia hạn:
            </label>
            <select
              id="renew-pkg-select"
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (+{p.durationDays} ngày ·{' '}
                  {new Intl.NumberFormat('vi-VN').format(p.priceVnd)}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Thời gian cộng thêm:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                +{chosenPkg.durationDays} ngày (+{chosenPkg.ptSessionsIncluded} buổi PT)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Phí gia hạn thanh toán:</span>
              <span className="font-mono tabular-nums font-bold text-blue-700 text-sm">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  chosenPkg.priceVnd
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Xác Nhận Gia Hạn & Kích Hoạt Thẻ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
