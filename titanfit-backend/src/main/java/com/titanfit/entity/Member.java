package com.titanfit.entity;

import com.titanfit.enums.BiometricModality;
import com.titanfit.enums.Gender;
import com.titanfit.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Hội viên phòng gym — thông tin cá nhân, gói tập, trạng thái sinh trắc học
 */
@Entity
@Table(name = "members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã hội viên — định dạng "TF-2026-XXXX" */
    @Column(name = "member_code", unique = true, nullable = false, length = 20)
    private String memberCode;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    /** Gói tập đăng ký */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private GymPackage gymPackage;

    /** Ngày bắt đầu gói tập */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Ngày hết hạn gói tập */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Trạng thái hội viên — mặc định ACTIVE */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MemberStatus status = MemberStatus.ACTIVE;

    /** Đã đăng ký khuôn mặt chưa */
    @Column(name = "face_enrolled")
    @Builder.Default
    private Boolean faceEnrolled = false;

    /** Phương thức sinh trắc học đã dùng */
    @Enumerated(EnumType.STRING)
    @Column(name = "face_modality", length = 20)
    private BiometricModality faceModality;

    /** URL ảnh đã đăng ký khuôn mặt */
    @Column(name = "enrolled_photo_url", columnDefinition = "TEXT")
    private String enrolledPhotoUrl;

    /** Thời điểm đăng ký khuôn mặt */
    @Column(name = "face_enrolled_at")
    private LocalDateTime faceEnrolledAt;

    /** Điểm chất lượng ảnh khuôn mặt (0.0 - 1.0) */
    @Column(name = "face_quality_score")
    @Builder.Default
    private Double faceQualityScore = 0.0;

    /** Số buổi PT còn lại */
    @Column(name = "pt_sessions_remaining")
    @Builder.Default
    private Integer ptSessionsRemaining = 0;

    /** Tổng số lần check-in */
    @Column(name = "total_check_ins")
    @Builder.Default
    private Integer totalCheckIns = 0;

    /** Lần check-in gần nhất */
    @Column(name = "last_check_in")
    private LocalDateTime lastCheckIn;

    /** Số tủ đồ được gán */
    @Column(name = "locker_number", length = 10)
    private String lockerNumber;

    /** Tên PT được phân công */
    @Column(name = "assigned_trainer", length = 100)
    private String assignedTrainer;

    /** Hội viên hiện đang ở trong phòng gym */
    @Column(name = "currently_inside")
    @Builder.Default
    private Boolean currentlyInside = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
