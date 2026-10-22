package com.titanfit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Gói tập gym — định nghĩa thời hạn, giá, quyền lợi
 */
@Entity
@Table(name = "packages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GymPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** Đối tượng mục tiêu (VD: "Sinh viên", "Người đi làm") */
    @Column(name = "target_audience", length = 200)
    private String targetAudience;

    /** Thời hạn gói tập (ngày) */
    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    /** Giá gói tập (VNĐ) */
    @Column(name = "price_vnd", nullable = false)
    private Long priceVnd;

    /** Số buổi PT đi kèm */
    @Column(name = "pt_sessions_included")
    @Builder.Default
    private Integer ptSessionsIncluded = 0;

    /** Khung giờ ra vào — VD: "24/7", "05:00-22:00", "08:00-16:00 Off-Peak" */
    @Column(name = "access_hours", nullable = false, length = 50)
    private String accessHours;

    /** Có bao gồm khăn & tủ đồ không */
    @Column(name = "towel_locker_included")
    @Builder.Default
    private Boolean towelLockerIncluded = false;

    /** Số lần quét InBody mỗi tháng */
    @Column(name = "inbody_scans_per_month")
    @Builder.Default
    private Integer inbodyScansPerMonth = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
