import React from 'react';
import { FaceLandmarks } from '../utils/gymLogic';

interface AvatarProps {
  landmarks?: FaceLandmarks;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  enrolled?: boolean;
  photoUrl?: string;
}

const SKIN_TONES = [
  { fill: '#F4D5C6', shadow: '#E2B8A4', nose: '#D4A590' },
  { fill: '#EAC0A8', shadow: '#D4A389', nose: '#C38E72' },
  { fill: '#DDA88B', shadow: '#C68C6D', nose: '#B27858' },
];

export const BiometricAvatar: React.FC<AvatarProps> = ({
  landmarks,
  name,
  size = 'md',
  photoUrl,
}) => {
  const dimensions =
    size === 'sm' ? 'w-9 h-9' : size === 'md' ? 'w-11 h-11' : 'w-16 h-16';

  if (photoUrl) {
    return (
      <div
        className={`${dimensions} relative rounded-lg bg-slate-900 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center`}
        title={`Ảnh sinh trắc học: ${name}`}
      >
        <img
          src={photoUrl}
          alt={`Chân dung sinh trắc học của ${name}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const tone = SKIN_TONES[(landmarks?.skinToneIndex ?? 0) % SKIN_TONES.length];
  const isFemale = landmarks?.gender === 'Nữ';
  const eyeDist = (landmarks?.eyeDistanceRatio ?? 0.41) * 36;
  const jawW = (landmarks?.jawWidthRatio ?? 0.78) * 28;

  return (
    <div
      className={`${dimensions} relative rounded-lg bg-slate-900 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center`}
      title={`Ảnh sinh trắc học: ${name}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        role="img"
        aria-label={`Chân dung sinh trắc học của ${name}`}
      >
        <defs>
          <linearGradient id={`bg-${name.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#bg-${name.replace(/\s+/g, '')})`} />

        {/* Subtle Biometric Grid Lines */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="0" y1="46" x2="100" y2="46" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

        {/* Shoulders / Athletic Top */}
        <path
          d="M15,100 C18,80 32,75 50,75 C68,75 82,80 85,100 Z"
          fill={isFemale ? '#1d4ed8' : '#334155'}
        />
        <path
          d="M38,75 L50,87 L62,75"
          fill={tone.shadow}
        />

        {/* Neck */}
        <rect x="42" y="64" width="16" height="15" rx="4" fill={tone.shadow} />

        {/* Back hair for female */}
        {isFemale && (
          <ellipse cx="50" cy="48" rx="26" ry="28" fill="#171717" />
        )}

        {/* Head contour */}
        <path
          d={`M${50 - jawW},38 C${50 - jawW},20 ${50 + jawW},20 ${50 + jawW},38 C${50 + jawW},56 ${50 + jawW * 0.65},70 50,71 C${50 - jawW * 0.65},70 ${50 - jawW},56 ${50 - jawW},38 Z`}
          fill={tone.fill}
        />

        {/* Hair top */}
        {isFemale ? (
          <path
            d="M25,40 C25,18 75,18 75,40 C70,28 58,26 50,27 C40,26 30,29 25,40 Z"
            fill="#171717"
          />
        ) : (
          <path
            d="M27,37 C26,18 74,18 73,37 C69,26 31,26 27,37 Z"
            fill="#1e1b18"
          />
        )}

        {/* Eyebrows */}
        <path
          d={`M${50 - eyeDist - 5},40 Q${50 - eyeDist},37 ${50 - eyeDist + 5},40`}
          stroke="#1e1b18"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M${50 + eyeDist - 5},40 Q${50 + eyeDist},37 ${50 + eyeDist + 5},40`}
          stroke="#1e1b18"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyes */}
        <circle cx={50 - eyeDist} cy="45" r="2.3" fill="#0f172a" />
        <circle cx={50 + eyeDist} cy="45" r="2.3" fill="#0f172a" />

        {/* Nose */}
        <path
          d="M50,44 L48.5,54 L52,54.5"
          stroke={tone.nose}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth */}
        <path
          d="M44,61 Q50,64 56,61"
          stroke={isFemale ? '#be123c' : '#9a3412'}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Corner framing brackets */}
        <path d="M8,18 L8,8 L18,8" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M82,8 L92,8 L92,18" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M8,82 L8,92 L18,92" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M82,92 L92,92 L92,82" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.7" />
      </svg>
    </div>
  );
};

interface ScannerCanvasProps {
  subjectName: string;
  memberCode: string;
  landmarks?: FaceLandmarks;
  isScanning: boolean;
  scanResult: 'idle' | 'granted' | 'denied';
  similarityScore: number;
  livenessScore: number;
  isSpoofTest?: boolean;
  uploadedImageUrl?: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  cameraActive?: boolean;
}

export const BiometricScannerViewport: React.FC<ScannerCanvasProps> = ({
  subjectName,
  memberCode,
  landmarks,
  isScanning,
  scanResult,
  similarityScore,
  livenessScore,
  isSpoofTest = false,
  uploadedImageUrl,
  videoRef,
  cameraActive = false,
}) => {
  const tone = SKIN_TONES[(landmarks?.skinToneIndex ?? 1) % SKIN_TONES.length];
  const isFemale = landmarks?.gender === 'Nữ';
  const eyeDist = (landmarks?.eyeDistanceRatio ?? 0.42) * 85;
  const jawW = (landmarks?.jawWidthRatio ?? 0.8) * 68;
  const noseLen = (landmarks?.noseBridgeLength ?? 0.36) * 70;
  const mouthW = (landmarks?.mouthWidthRatio ?? 0.45) * 58;

  const meshColor =
    scanResult === 'granted'
      ? '#22c55e'
      : scanResult === 'denied'
      ? '#ef4444'
      : '#38bdf8';

  // Key landmark coordinates on 360x280 canvas
  const cx = 180;
  const cy = 132;
  const leftEyeX = cx - eyeDist;
  const rightEyeX = cx + eyeDist;
  const eyeY = cy - 12;
  const noseTipY = eyeY + noseLen;
  const mouthY = noseTipY + 24;

  const landmarkPoints: [number, number][] = [
    // Brow arch
    [leftEyeX - 16, eyeY - 14],
    [leftEyeX, eyeY - 18],
    [leftEyeX + 14, eyeY - 13],
    [rightEyeX - 14, eyeY - 13],
    [rightEyeX, eyeY - 18],
    [rightEyeX + 16, eyeY - 14],
    // Eyes
    [leftEyeX - 10, eyeY],
    [leftEyeX, eyeY],
    [leftEyeX + 10, eyeY],
    [rightEyeX - 10, eyeY],
    [rightEyeX, eyeY],
    [rightEyeX + 10, eyeY],
    // Nose bridge & tip
    [cx, eyeY - 4],
    [cx, eyeY + noseLen * 0.5],
    [cx - 9, noseTipY],
    [cx, noseTipY + 2],
    [cx + 9, noseTipY],
    // Mouth
    [cx - mouthW, mouthY],
    [cx, mouthY - 4],
    [cx + mouthW, mouthY],
    [cx, mouthY + 6],
    // Jawline contour
    [cx - jawW, eyeY + 4],
    [cx - jawW * 0.85, noseTipY + 14],
    [cx - jawW * 0.48, mouthY + 26],
    [cx, mouthY + 34],
    [cx + jawW * 0.48, mouthY + 26],
    [cx + jawW * 0.85, noseTipY + 14],
    [cx + jawW, eyeY + 4],
  ];

  return (
    <div
      data-testid="biometric-scanner-viewport"
      className="relative w-full aspect-[16/9] max-h-[300px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden select-none flex items-center justify-center"
    >
      {/* Live Camera Video if active */}
      {cameraActive && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      )}

      {/* Uploaded custom photo if provided */}
      {!cameraActive && uploadedImageUrl && (
        <img
          src={uploadedImageUrl}
          alt={`Ảnh tải lên: ${subjectName}`}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
      )}

      {/* Interactive 3D Biometric Vector & Landmark SVG Viewport */}
      <svg
        viewBox="0 0 360 260"
        className="relative z-10 w-full h-full"
        role="img"
        aria-label={`Khung quét nhận diện khuôn mặt cho ${subjectName}`}
      >
        <defs>
          <radialGradient id="scanner-vignette" cx="50%" cy="48%" r="60%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity={cameraActive || uploadedImageUrl ? '0.15' : '0.95'} />
            <stop offset="100%" stopColor="#020617" stopOpacity={cameraActive || uploadedImageUrl ? '0.55' : '1'} />
          </radialGradient>
          <pattern id="biometric-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.7" />
          </pattern>
        </defs>

        <rect width="360" height="260" fill="url(#scanner-vignette)" />
        {!cameraActive && !uploadedImageUrl && (
          <rect width="360" height="260" fill="url(#biometric-grid)" opacity="0.65" />
        )}

        {/* Render anatomical portrait subject when not using external camera/photo */}
        {!cameraActive && !uploadedImageUrl && (
          <g>
            {/* If spoof test is active, draw a phone bezel frame holding the face */}
            {isSpoofTest && (
              <rect
                x="92"
                y="18"
                width="176"
                height="226"
                rx="14"
                fill="#090d16"
                stroke="#64748b"
                strokeWidth="3"
              />
            )}

            {/* Shoulders */}
            <path
              d="M90,255 C98,205 132,194 180,194 C228,194 262,205 270,255 Z"
              fill={isFemale ? '#1e3a8a' : '#1e293b'}
            />

            {/* Neck */}
            <rect x="160" y="168" width="40" height="34" rx="8" fill={tone.shadow} />

            {/* Female back hair */}
            {isFemale && <ellipse cx="180" cy="122" rx="64" ry="68" fill="#18181b" />}

            {/* Ears */}
            <ellipse cx={cx - jawW - 4} cy={eyeY + 8} rx="7" ry="14" fill={tone.shadow} />
            <ellipse cx={cx + jawW + 4} cy={eyeY + 8} rx="7" ry="14" fill={tone.shadow} />

            {/* Head shape */}
            <path
              d={`M${cx - jawW},${eyeY - 12} C${cx - jawW},48 ${cx + jawW},48 ${cx + jawW},${eyeY - 12} C${cx + jawW},${noseTipY + 14} ${cx + jawW * 0.62},${mouthY + 34} ${cx},${mouthY + 36} C${cx - jawW * 0.62},${mouthY + 34} ${cx - jawW},${noseTipY + 14} ${cx - jawW},${eyeY - 12} Z`}
              fill={tone.fill}
            />

            {/* Hair */}
            {isFemale ? (
              <path
                d={`M${cx - jawW - 2},${eyeY - 6} C${cx - jawW},42 ${cx + jawW},42 ${cx + jawW + 2},${eyeY - 6} C${cx + 42},68 ${cx - 42},68 ${cx - jawW - 2},${eyeY - 6} Z`}
                fill="#18181b"
              />
            ) : (
              <path
                d={`M${cx - jawW},${eyeY - 10} C${cx - jawW},44 ${cx + jawW},44 ${cx + jawW},${eyeY - 10} C${cx + 44},66 ${cx - 44},66 ${cx - jawW},${eyeY - 10} Z`}
                fill="#1c1917"
              />
            )}

            {/* Eyebrows */}
            <path
              d={`M${leftEyeX - 15},${eyeY - 13} Q${leftEyeX},${eyeY - 19} ${leftEyeX + 14},${eyeY - 13}`}
              stroke="#1c1917"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M${rightEyeX - 14},${eyeY - 13} Q${rightEyeX},${eyeY - 19} ${rightEyeX + 15},${eyeY - 13}`}
              stroke="#1c1917"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Eyes */}
            <ellipse cx={leftEyeX} cy={eyeY} rx="9" ry="5" fill="#ffffff" />
            <circle cx={leftEyeX} cy={eyeY} r="4.2" fill="#0f172a" />
            <circle cx={leftEyeX - 1.5} cy={eyeY - 1.5} r="1.2" fill="#ffffff" />

            <ellipse cx={rightEyeX} cy={eyeY} rx="9" ry="5" fill="#ffffff" />
            <circle cx={rightEyeX} cy={eyeY} r="4.2" fill="#0f172a" />
            <circle cx={rightEyeX - 1.5} cy={eyeY - 1.5} r="1.2" fill="#ffffff" />

            {/* Nose */}
            <path
              d={`M${cx},${eyeY - 2} L${cx - 4},${noseTipY} L${cx + 6},${noseTipY + 1}`}
              stroke={tone.nose}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Mouth */}
            <path
              d={`M${cx - mouthW},${mouthY} Q${cx},${mouthY + 6} ${cx + mouthW},${mouthY}`}
              stroke={isFemale ? '#be123c' : '#9a3412'}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Biometric Triangulation Mesh Connections */}
        <g stroke={meshColor} strokeWidth="0.85" opacity="0.65">
          {/* Inter-pupillary distance line */}
          <line x1={leftEyeX} y1={eyeY} x2={rightEyeX} y2={eyeY} strokeDasharray="3 2" />
          {/* Eyes to nose bridge & tip */}
          <line x1={leftEyeX} y1={eyeY} x2={cx} y2={eyeY - 4} />
          <line x1={rightEyeX} y1={eyeY} x2={cx} y2={eyeY - 4} />
          <line x1={leftEyeX} y1={eyeY} x2={cx - 9} y2={noseTipY} />
          <line x1={rightEyeX} y1={eyeY} x2={cx + 9} y2={noseTipY} />
          {/* Nose to mouth corners */}
          <line x1={cx - 9} y1={noseTipY} x2={cx - mouthW} y2={mouthY} />
          <line x1={cx + 9} y1={noseTipY} x2={cx + mouthW} y2={mouthY} />
          <line x1={cx} y1={noseTipY + 2} x2={cx} y2={mouthY - 4} />
          {/* Jawline polygon */}
          <polyline
            fill="none"
            points={`${cx - jawW},${eyeY + 4} ${cx - jawW * 0.85},${noseTipY + 14} ${cx - jawW * 0.48},${mouthY + 26} ${cx},${mouthY + 34} ${cx + jawW * 0.48},${mouthY + 26} ${cx + jawW * 0.85},${noseTipY + 14} ${cx + jawW},${eyeY + 4}`}
          />
          {/* Cheekbone triangulation */}
          <line x1={leftEyeX - 10} y1={eyeY} x2={cx - jawW * 0.85} y2={noseTipY + 14} />
          <line x1={rightEyeX + 10} y1={eyeY} x2={cx + jawW * 0.85} y2={noseTipY + 14} />
          <line x1={cx - mouthW} y1={mouthY} x2={cx - jawW * 0.48} y2={mouthY + 26} />
          <line x1={cx + mouthW} y1={mouthY} x2={cx + jawW * 0.48} y2={mouthY + 26} />
        </g>

        {/* Landmark Nodes */}
        {landmarkPoints.map(([px, py], idx) => (
          <circle
            key={idx}
            cx={px}
            cy={py}
            r="2.1"
            fill={meshColor}
          />
        ))}

        {/* Target Bounding Box */}
        <g stroke={meshColor} strokeWidth="2" fill="none">
          <path d="M102,56 L102,38 L122,38" />
          <path d="M238,38 L258,38 L258,56" />
          <path d="M102,194 L102,212 L122,212" />
          <path d="M238,212 L258,212 L258,194" />
        </g>

        {/* Horizontal laser scan line when actively scanning */}
        {isScanning && (
          <line
            x1="96"
            y1="126"
            x2="264"
            y2="126"
            stroke="#38bdf8"
            strokeWidth="2.5"
            opacity="0.9"
          />
        )}

        {/* HUD Overlay Metadata inside SVG */}
        <text x="14" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          ID: {memberCode}
        </text>
        <text x="14" y="36" fill="#e2e8f0" fontSize="10.5" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
          {subjectName}
        </text>

        <text x="242" y="22" fill="#94a3b8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          KHỚP: {similarityScore.toFixed(1)}%
        </text>
        <text x="242" y="36" fill="#94a3b8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
          THỰC THỂ: {livenessScore.toFixed(1)}%
        </text>

        <text x="14" y="246" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace">
          IPD: {(eyeDist * 0.74).toFixed(1)}mm · 16-D COSINE EMBEDDING
        </text>
      </svg>
    </div>
  );
};
