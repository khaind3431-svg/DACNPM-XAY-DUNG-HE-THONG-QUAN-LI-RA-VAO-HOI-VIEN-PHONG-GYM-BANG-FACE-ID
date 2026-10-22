import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBiometricVectorFromSeed,
  extractBiometricVectorFromPixels,
  perturbVectorForLiveScan,
  calculateCosineSimilarity,
  calculateDaysRemaining,
  computeMemberStatus,
  evaluateGateAccess,
  validateNewMemberInput,
  renewMemberPackage,
  SAMPLE_TEST_MEMBERS,
  INITIAL_PACKAGES,
} from './gymLogic.ts';

test('biometric vector generation produces zero-centered normalized 16-D vector and 100% self-similarity', () => {
  const vec = generateBiometricVectorFromSeed('TF-2026-0891-NGUYEN-MINH-QUAN');
  assert.equal(vec.length, 16);
  const selfSim = calculateCosineSimilarity(vec, vec);
  assert.equal(selfSim, 100);
});

test('two different members have low cosine similarity (< 60%) and cannot impersonate each other', () => {
  const memberA = SAMPLE_TEST_MEMBERS[0]; // Nguyễn Minh Quân
  const memberB = SAMPLE_TEST_MEMBERS[1]; // Lê Hoàng Bảo Trân
  const crossSim = calculateCosineSimilarity(memberA.faceVector, memberB.faceVector);
  assert.ok(crossSim < 60, `Expected distinct members to have similarity < 60%, got ${crossSim}%`);

  // Attempt to use Member B's face to enter under Member A's profile (1:1 verification)
  const probeFromMemberB = perturbVectorForLiveScan(memberB.faceVector, 0.04, 1);
  const impersonationRes = evaluateGateAccess({
    probeVector: probeFromMemberB,
    livenessScore: 98.5,
    members: SAMPLE_TEST_MEMBERS,
    thresholdPercent: 86.0,
    expectedMemberId: memberA.id,
    probeModality: '3d_template',
  });

  assert.equal(impersonationRes.granted, false);
  assert.equal(impersonationRes.resultStatus, 'denied_face_mismatch');
  assert.equal(impersonationRes.turnstileAction, 'LOCK_RED');
});

test('webcam or uploaded photo cannot unlock a member who has not enrolled that optical face', () => {
  const memberA = SAMPLE_TEST_MEMBERS[0]; // Has 3d_template modality, not optical_pixel

  // Create a synthetic RGBA pixel buffer representing an uploaded photo
  const width = 32;
  const height = 32;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = (i * 17) % 255;
    rgba[i * 4 + 1] = (i * 31) % 200;
    rgba[i * 4 + 2] = (i * 13) % 180;
    rgba[i * 4 + 3] = 255;
  }

  const extracted = extractBiometricVectorFromPixels(rgba, width, height);
  assert.equal(extracted.validFace, true);

  // Scanning this optical photo against memberA (who only has 3d_template) MUST be denied
  const mismatchModalityRes = evaluateGateAccess({
    probeVector: extracted.vector,
    livenessScore: 97.5,
    members: SAMPLE_TEST_MEMBERS,
    expectedMemberId: memberA.id,
    probeModality: 'optical_pixel',
  });
  assert.equal(mismatchModalityRes.granted, false);
  assert.equal(mismatchModalityRes.resultStatus, 'denied_face_mismatch');
});

test('enrolling a real pixel face allows that exact face to pass and rejects a different pixel face', () => {
  const width = 32;
  const height = 32;
  const facePhotoA = new Uint8ClampedArray(width * height * 4);
  const facePhotoB = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      // Face A: bright upper-left to lower-right gradient
      facePhotoA[i * 4] = Math.min(255, x * 7 + y * 2);
      facePhotoA[i * 4 + 1] = Math.min(255, x * 3 + 40);
      facePhotoA[i * 4 + 2] = Math.min(255, y * 5 + 20);
      facePhotoA[i * 4 + 3] = 255;

      // Face B: completely different radial/vertical structure
      facePhotoB[i * 4] = Math.min(255, Math.abs(16 - x) * 14);
      facePhotoB[i * 4 + 1] = Math.min(255, (32 - y) * 7);
      facePhotoB[i * 4 + 2] = Math.min(255, ((x * y) % 200) + 30);
      facePhotoB[i * 4 + 3] = 255;
    }
  }

  const enrolledA = extractBiometricVectorFromPixels(facePhotoA, width, height);
  const probeB = extractBiometricVectorFromPixels(facePhotoB, width, height);

  const customMembers = SAMPLE_TEST_MEMBERS.map((m, idx) =>
    idx === 0
      ? {
          ...m,
          faceEnrolled: true,
          faceModality: 'optical_pixel' as const,
          faceVector: enrolledA.vector,
        }
      : m
  );

  // Scanning Face A for Member 0 -> GRANTED
  const resSame = evaluateGateAccess({
    probeVector: perturbVectorForLiveScan(enrolledA.vector, 0.03, 1),
    livenessScore: 98.0,
    members: customMembers,
    expectedMemberId: customMembers[0].id,
    probeModality: 'optical_pixel',
  });
  assert.equal(resSame.granted, true);
  assert.equal(resSame.resultStatus, 'granted');

  // Scanning Face B for Member 0 -> DENIED
  const resDiff = evaluateGateAccess({
    probeVector: probeB.vector,
    livenessScore: 98.0,
    members: customMembers,
    expectedMemberId: customMembers[0].id,
    probeModality: 'optical_pixel',
  });
  assert.equal(resDiff.granted, false);
  assert.equal(resDiff.resultStatus, 'denied_face_mismatch');
});

test('evaluateGateAccess grants active member with matching face and blocks expired or spoofed faces', () => {
  const activeMember = SAMPLE_TEST_MEMBERS[0]; // Nguyễn Minh Quân (active)
  const liveProbe = perturbVectorForLiveScan(activeMember.faceVector, 0.04, 1);

  const grantedRes = evaluateGateAccess({
    probeVector: liveProbe,
    livenessScore: 98.5,
    members: SAMPLE_TEST_MEMBERS,
    thresholdPercent: 86.0,
    referenceDateStr: '2026-10-17',
    expectedMemberId: activeMember.id,
    probeModality: '3d_template',
  });
  assert.equal(grantedRes.granted, true);
  assert.equal(grantedRes.resultStatus, 'granted');
  assert.equal(grantedRes.matchedMember?.id, activeMember.id);

  // Expired member (Vũ Thị Khánh Linh - mem-04) scanning her own face
  const expiredMember = SAMPLE_TEST_MEMBERS.find((m) => m.id === 'mem-04')!;
  const expiredProbe = perturbVectorForLiveScan(expiredMember.faceVector, 0.04, 1);
  const expiredRes = evaluateGateAccess({
    probeVector: expiredProbe,
    livenessScore: 97.0,
    members: SAMPLE_TEST_MEMBERS,
    thresholdPercent: 86.0,
    referenceDateStr: '2026-10-17',
    expectedMemberId: expiredMember.id,
    probeModality: '3d_template',
  });
  assert.equal(expiredRes.granted, false);
  assert.equal(expiredRes.resultStatus, 'denied_expired');
});

test('membership status, renewal, and input validation work accurately', () => {
  assert.equal(computeMemberStatus('2026-12-31', false, '2026-10-17'), 'active');
  assert.equal(calculateDaysRemaining('2026-10-20', '2026-10-17'), 3);

  const expiredMember = SAMPLE_TEST_MEMBERS.find((m) => m.id === 'mem-04')!;
  const pkg3M = INITIAL_PACKAGES.find((p) => p.id === 'pkg-3m-pro')!;
  const renewed = renewMemberPackage(expiredMember, pkg3M, '2026-10-17');
  assert.equal(renewed.status, 'active');

  const valid = validateNewMemberInput({
    fullName: 'Trần Quang Minh',
    phone: '0909123456',
    email: 'minh.tran@example.com',
    packageId: 'pkg-3m-pro',
  });
  assert.equal(valid.valid, true);
});
