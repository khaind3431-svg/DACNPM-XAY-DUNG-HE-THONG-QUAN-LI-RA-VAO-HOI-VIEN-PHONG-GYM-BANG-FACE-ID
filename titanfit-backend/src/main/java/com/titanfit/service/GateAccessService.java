package com.titanfit.service;

import com.titanfit.dto.request.GateEvaluateRequest;
import com.titanfit.dto.response.GateEvaluationResponse;
import com.titanfit.entity.AccessLog;
import com.titanfit.entity.FaceVector;
import com.titanfit.entity.Member;
import com.titanfit.enums.AccessResult;
import com.titanfit.enums.BiometricModality;
import com.titanfit.enums.Direction;
import com.titanfit.enums.MemberStatus;
import com.titanfit.repository.AccessLogRepository;
import com.titanfit.repository.FaceVectorRepository;
import com.titanfit.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service kiểm soát cổng ra vào — Logic nghiệp vụ cốt lõi
 * Port từ evaluateGateAccess() trong gymLogic.ts
 */
@Service
public class GateAccessService {

    private final FaceVectorRepository faceVectorRepository;
    private final MemberRepository memberRepository;
    private final AccessLogRepository accessLogRepository;
    private final BiometricService biometricService;

    @Value("${app.gym.face-similarity-threshold}")
    private double defaultThreshold;

    @Value("${app.gym.liveness-threshold}")
    private double livenessThreshold;

    @Value("${app.gym.capacity}")
    private int gymCapacity;

    public GateAccessService(FaceVectorRepository faceVectorRepository,
                              MemberRepository memberRepository,
                              AccessLogRepository accessLogRepository,
                              BiometricService biometricService) {
        this.faceVectorRepository = faceVectorRepository;
        this.memberRepository = memberRepository;
        this.accessLogRepository = accessLogRepository;
        this.biometricService = biometricService;
    }

    /**
     * Đánh giá quyền ra/vào qua cổng — THE CORE GATE DECISION
     *
     * Bước 1: Kiểm tra liveness (anti-spoofing) ≥ 80%
     * Bước 2: Nếu có expectedMemberId → 1:1 verification
     * Bước 3: Nếu không → 1:N identification (tìm best match)
     * Bước 4: Kiểm tra trạng thái gói tập (active/expired/frozen)
     */
    @Transactional
    public GateEvaluationResponse evaluate(GateEvaluateRequest request) {
        long startTime = System.currentTimeMillis();
        double threshold = request.getThreshold() != null ? request.getThreshold() : defaultThreshold;

        // === BƯỚC 1: Kiểm tra Liveness ===
        if (request.getLivenessScore() < livenessThreshold) {
            long processingMs = System.currentTimeMillis() - startTime;
            GateEvaluationResponse response = GateEvaluationResponse.builder()
                    .granted(false)
                    .resultStatus(AccessResult.DENIED_LIVENESS.name())
                    .similarityScore(0)
                    .livenessScore(request.getLivenessScore())
                    .reasonVi("Phát hiện ảnh giả / spoofing. Điểm liveness: " +
                            String.format("%.1f%%", request.getLivenessScore()) +
                            " (yêu cầu ≥ " + String.format("%.0f%%", livenessThreshold) + ")")
                    .turnstileAction("LOCK_RED")
                    .processingMs(processingMs)
                    .build();

            recordAccessLog(request, response);
            return response;
        }

        // === BƯỚC 2 & 3: Tìm khuôn mặt khớp ===
        Member matchedMember = null;
        double bestSimilarity = 0;

        if (request.getExpectedMemberId() != null) {
            // Chế độ 1:1 — so khớp với hội viên cụ thể
            FaceVector expectedFv = faceVectorRepository.findByMemberId(request.getExpectedMemberId())
                    .orElse(null);

            if (expectedFv != null) {
                double[] storedVector = biometricService.entityToArray(expectedFv);
                bestSimilarity = biometricService.calculateCosineSimilarity(request.getProbeVector(), storedVector);

                if (bestSimilarity >= threshold) {
                    matchedMember = expectedFv.getMember();
                }
            }
        } else {
            // Chế độ 1:N — quét toàn bộ hội viên đã đăng ký
            List<FaceVector> allVectors = faceVectorRepository.findAllEnrolledVectors();

            for (FaceVector fv : allVectors) {
                double[] storedVector = biometricService.entityToArray(fv);
                double similarity = biometricService.calculateCosineSimilarity(
                        request.getProbeVector(), storedVector);

                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    if (similarity >= threshold) {
                        matchedMember = fv.getMember();
                    }
                }
            }
        }

        // === Không tìm thấy khuôn mặt khớp ===
        if (matchedMember == null) {
            long processingMs = System.currentTimeMillis() - startTime;
            GateEvaluationResponse response = GateEvaluationResponse.builder()
                    .granted(false)
                    .resultStatus(bestSimilarity > 0
                            ? AccessResult.DENIED_FACE_MISMATCH.name()
                            : AccessResult.DENIED_UNRECOGNIZED.name())
                    .similarityScore(bestSimilarity)
                    .livenessScore(request.getLivenessScore())
                    .reasonVi(bestSimilarity > 0
                            ? "Khuôn mặt không đủ tương đồng. Điểm: " +
                              String.format("%.1f%%", bestSimilarity) +
                              " (yêu cầu ≥ " + String.format("%.0f%%", threshold) + ")"
                            : "Không tìm thấy khuôn mặt trong hệ thống. Vui lòng đăng ký tại quầy lễ tân.")
                    .turnstileAction("LOCK_RED")
                    .processingMs(processingMs)
                    .build();

            recordAccessLog(request, response);
            return response;
        }

        // === BƯỚC 4: Kiểm tra trạng thái hội viên ===
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, matchedMember.getEndDate());

        // Cập nhật status tự động
        MemberStatus currentStatus = computeMemberStatus(matchedMember.getEndDate(),
                matchedMember.getStatus() == MemberStatus.FROZEN, today);
        matchedMember.setStatus(currentStatus);

        GateEvaluationResponse response;
        long processingMs = System.currentTimeMillis() - startTime;

        switch (currentStatus) {
            case FROZEN:
                response = buildDeniedResponse(matchedMember, bestSimilarity, request.getLivenessScore(),
                        AccessResult.DENIED_FROZEN,
                        "Tài khoản hội viên đang bị đóng băng. Liên hệ quầy lễ tân để mở lại.",
                        "LOCK_RED", (int) daysRemaining, processingMs);
                break;

            case EXPIRED:
                response = buildDeniedResponse(matchedMember, bestSimilarity, request.getLivenessScore(),
                        AccessResult.DENIED_EXPIRED,
                        "Gói tập đã hết hạn từ " + Math.abs(daysRemaining) + " ngày. Vui lòng gia hạn tại quầy.",
                        "LOCK_RED", (int) daysRemaining, processingMs);
                break;

            case EXPIRING_SOON:
                response = buildGrantedResponse(matchedMember, bestSimilarity, request.getLivenessScore(),
                        "Xác thực thành công — Gói tập còn " + daysRemaining + " ngày. Hãy gia hạn sớm!",
                        (int) daysRemaining, processingMs);
                // Cập nhật check-in
                updateMemberCheckIn(matchedMember, request.getDirection());
                break;

            default: // ACTIVE
                response = buildGrantedResponse(matchedMember, bestSimilarity, request.getLivenessScore(),
                        "Xác thực thành công — Chào mừng " + matchedMember.getFullName() + "!",
                        (int) daysRemaining, processingMs);
                updateMemberCheckIn(matchedMember, request.getDirection());
                break;
        }

        memberRepository.save(matchedMember);
        recordAccessLog(request, response);
        return response;
    }

    /**
     * Tính trạng thái hội viên dựa trên ngày hết hạn
     */
    public MemberStatus computeMemberStatus(LocalDate endDate, boolean isFrozen, LocalDate refDate) {
        if (isFrozen) return MemberStatus.FROZEN;
        long days = ChronoUnit.DAYS.between(refDate, endDate);
        if (days < 0) return MemberStatus.EXPIRED;
        if (days <= 7) return MemberStatus.EXPIRING_SOON;
        return MemberStatus.ACTIVE;
    }

    private void updateMemberCheckIn(Member member, String direction) {
        if ("IN".equals(direction)) {
            member.setTotalCheckIns(member.getTotalCheckIns() + 1);
            member.setCurrentlyInside(true);
        } else {
            member.setCurrentlyInside(false);
        }
        member.setLastCheckIn(LocalDateTime.now());
    }

    private GateEvaluationResponse buildGrantedResponse(Member m, double sim, double liveness,
                                                         String reason, int daysRemaining, long procMs) {
        return GateEvaluationResponse.builder()
                .granted(true)
                .resultStatus(AccessResult.GRANTED.name())
                .matchedMemberId(m.getId())
                .matchedMemberCode(m.getMemberCode())
                .matchedMemberName(m.getFullName())
                .matchedPackageName(m.getGymPackage() != null ? m.getGymPackage().getName() : null)
                .similarityScore(sim)
                .livenessScore(liveness)
                .reasonVi(reason)
                .turnstileAction("OPEN_GREEN")
                .daysRemaining(daysRemaining)
                .processingMs(procMs)
                .build();
    }

    private GateEvaluationResponse buildDeniedResponse(Member m, double sim, double liveness,
                                                        AccessResult result, String reason,
                                                        String turnstile, int daysRemaining, long procMs) {
        return GateEvaluationResponse.builder()
                .granted(false)
                .resultStatus(result.name())
                .matchedMemberId(m.getId())
                .matchedMemberCode(m.getMemberCode())
                .matchedMemberName(m.getFullName())
                .matchedPackageName(m.getGymPackage() != null ? m.getGymPackage().getName() : null)
                .similarityScore(sim)
                .livenessScore(liveness)
                .reasonVi(reason)
                .turnstileAction(turnstile)
                .daysRemaining(daysRemaining)
                .processingMs(procMs)
                .build();
    }

    private void recordAccessLog(GateEvaluateRequest request, GateEvaluationResponse response) {
        AccessLog log = AccessLog.builder()
                .timestamp(LocalDateTime.now())
                .gateId(request.getGateId())
                .direction(Direction.valueOf(request.getDirection()))
                .memberCode(response.getMatchedMemberCode() != null
                        ? response.getMatchedMemberCode() : "KHÁCH VÃNG LAI")
                .memberName(response.getMatchedMemberName() != null
                        ? response.getMatchedMemberName() : "Khuôn mặt chưa đăng ký")
                .packageName(response.getMatchedPackageName() != null
                        ? response.getMatchedPackageName() : "—")
                .similarityScore(response.getSimilarityScore())
                .livenessScore(response.getLivenessScore())
                .result(AccessResult.valueOf(response.getResultStatus()))
                .reasonVi(response.getReasonVi())
                .processingMs((int) response.getProcessingMs())
                .build();

        // Set member reference nếu có
        if (response.getMatchedMemberId() != null) {
            memberRepository.findById(response.getMatchedMemberId())
                    .ifPresent(log::setMember);
        }

        accessLogRepository.save(log);
    }
}
