import { extractBiometricVectorFromPixels } from './gymLogic';

const SAMPLE_SIZE = 32;

/**
 * Extracts a 16-D biometric vector from a live HTMLVideoElement frame (central face region crop).
 */
export function extractVectorFromVideoElement(videoEl: HTMLVideoElement): {
  vector: number[];
  qualityScore: number;
  validFace: boolean;
  snapshotDataUrl: string;
} {
  const vw = videoEl.videoWidth || 640;
  const vh = videoEl.videoHeight || 480;

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { vector: [], qualityScore: 0, validFace: false, snapshotDataUrl: '' };
  }

  // Crop central 60% where the user's face is positioned
  const cropW = vw * 0.6;
  const cropH = vh * 0.7;
  const sx = (vw - cropW) / 2;
  const sy = (vh - cropH) / 2;

  ctx.drawImage(videoEl, sx, sy, cropW, cropH, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const result = extractBiometricVectorFromPixels(imageData.data, SAMPLE_SIZE, SAMPLE_SIZE);

  // Also capture a 160x160 thumbnail for member profile display
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 160;
  thumbCanvas.height = 160;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(videoEl, sx, sy, cropW, cropH, 0, 0, 160, 160);
  }

  return {
    ...result,
    snapshotDataUrl: thumbCanvas.toDataURL('image/jpeg', 0.85),
  };
}

/**
 * Extracts a 16-D biometric vector from an image data URL or URL string.
 */
export function extractVectorFromImageDataUrl(dataUrl: string): Promise<{
  vector: number[];
  qualityScore: number;
  validFace: boolean;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const iw = img.naturalWidth || img.width || 200;
      const ih = img.naturalHeight || img.height || 200;

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ vector: [], qualityScore: 0, validFace: false });
        return;
      }

      // Crop central 70% of portrait
      const cropW = iw * 0.7;
      const cropH = ih * 0.75;
      const sx = (iw - cropW) / 2;
      const sy = (ih - cropH) / 2;

      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const res = extractBiometricVectorFromPixels(imageData.data, SAMPLE_SIZE, SAMPLE_SIZE);
      resolve(res);
    };
    img.onerror = () => {
      resolve({ vector: [], qualityScore: 0, validFace: false });
    };
    img.src = dataUrl;
  });
}
