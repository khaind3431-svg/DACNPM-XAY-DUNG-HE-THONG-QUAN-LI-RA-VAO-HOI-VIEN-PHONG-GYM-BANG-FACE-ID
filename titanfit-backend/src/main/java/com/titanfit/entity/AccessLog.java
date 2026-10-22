package com.titanfit.entity;

import com.titanfit.enums.AccessResult;
import com.titanfit.enums.Direction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Nhật ký ra vào cổng — ghi lại mỗi lần quét khuôn mặt tại cổng
 */
@Entity
@Table(name = "access_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thời điểm quét */
    @Column(nullable = false)
    private LocalDateTime timestamp;

    /** ID cổng quét (VD: "GATE-01", "GATE-02") */
    @Column(name = "gate_id", nullable = false, length = 50)
    private String gateId;

    /** Hướng ra vào */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Direction direction;

    /** Hội viên (nullable — nếu không nhận diện được) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    /** Mã hội viên (lưu snapshot tại thời điểm quét) */
    @Column(name = "member_code", length = 20)
    private String memberCode;

    /** Tên hội viên (snapshot) */
    @Column(name = "member_name", length = 100)
    private String memberName;

    /** Tên gói tập (snapshot) */
    @Column(name = "package_name", length = 100)
    private String packageName;

    /** Điểm tương đồng khuôn mặt */
    @Column(name = "similarity_score")
    private Double similarityScore;

    /** Điểm liveness (chống giả mạo) */
    @Column(name = "liveness_score")
    private Double livenessScore;

    /** Kết quả xác thực */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccessResult result;

    /** Lý do từ chối (tiếng Việt) */
    @Column(name = "reason_vi", length = 500)
    private String reasonVi;

    /** Thời gian xử lý (ms) */
    @Column(name = "processing_ms")
    private Integer processingMs;
}
