package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response KPI Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpiResponse {

    /** Số hội viên đang ở trong phòng */
    private long insideCount;

    /** Sức chứa phòng */
    private int capacity;

    /** Phần trăm công suất */
    private int occupancyPercent;

    /** Tổng số hội viên */
    private long totalMembers;

    /** Số hội viên đã đăng ký khuôn mặt */
    private long faceEnrolledCount;

    /** Phần trăm đã đăng ký khuôn mặt */
    private int faceEnrolledPercent;

    /** Lượt mở cổng hợp lệ */
    private long grantedCount;

    /** Lượt bị từ chối */
    private long deniedCount;

    /** Hội viên sắp hết hạn / đã hết hạn */
    private long expiringOrExpiredCount;

    /** Tổng doanh thu tháng hiện tại (VNĐ) */
    private Long revenueThisMonth;
}
