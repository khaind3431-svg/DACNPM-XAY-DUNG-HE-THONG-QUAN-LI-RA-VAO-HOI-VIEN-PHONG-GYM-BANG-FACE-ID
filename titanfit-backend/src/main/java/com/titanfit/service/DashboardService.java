package com.titanfit.service;

import com.titanfit.dto.response.DashboardKpiResponse;
import com.titanfit.enums.AccessResult;
import com.titanfit.enums.MemberStatus;
import com.titanfit.repository.AccessLogRepository;
import com.titanfit.repository.MemberRepository;
import com.titanfit.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;

/**
 * Service Dashboard — tính KPI tổng quan
 */
@Service
public class DashboardService {

    private final MemberRepository memberRepository;
    private final AccessLogRepository accessLogRepository;
    private final PaymentRepository paymentRepository;

    @Value("${app.gym.capacity}")
    private int gymCapacity;

    public DashboardService(MemberRepository memberRepository,
                             AccessLogRepository accessLogRepository,
                             PaymentRepository paymentRepository) {
        this.memberRepository = memberRepository;
        this.accessLogRepository = accessLogRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Tính các chỉ số KPI tổng quan cho Dashboard
     */
    public DashboardKpiResponse getKpis() {
        long insideCount = memberRepository.countByCurrentlyInside(true);
        long totalMembers = memberRepository.count();
        long faceEnrolledCount = memberRepository.countByFaceEnrolled(true);
        long grantedCount = accessLogRepository.countByResult(AccessResult.GRANTED);
        long totalLogs = accessLogRepository.count();
        long deniedCount = totalLogs - grantedCount;

        long expiringCount = memberRepository.countByStatus(MemberStatus.EXPIRING_SOON);
        long expiredCount = memberRepository.countByStatus(MemberStatus.EXPIRED);

        // Doanh thu tháng hiện tại
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime monthStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = currentMonth.atEndOfMonth().atTime(23, 59, 59);
        Long revenueThisMonth = paymentRepository.sumAmountByDateRange(monthStart, monthEnd);

        return DashboardKpiResponse.builder()
                .insideCount(insideCount)
                .capacity(gymCapacity)
                .occupancyPercent(totalMembers > 0 ? (int) ((insideCount * 100) / gymCapacity) : 0)
                .totalMembers(totalMembers)
                .faceEnrolledCount(faceEnrolledCount)
                .faceEnrolledPercent(totalMembers > 0 ? (int) ((faceEnrolledCount * 100) / totalMembers) : 0)
                .grantedCount(grantedCount)
                .deniedCount(deniedCount)
                .expiringOrExpiredCount(expiringCount + expiredCount)
                .revenueThisMonth(revenueThisMonth != null ? revenueThisMonth : 0L)
                .build();
    }
}
