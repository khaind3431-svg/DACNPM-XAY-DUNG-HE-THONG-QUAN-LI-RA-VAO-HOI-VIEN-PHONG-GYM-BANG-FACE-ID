package com.titanfit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Vector đặc trưng khuôn mặt — 16 chiều (v0..v15)
 * Dùng để so khớp khuôn mặt khi hội viên check-in
 */
@Entity
@Table(name = "face_vectors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Hội viên sở hữu vector khuôn mặt */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", unique = true)
    private Member member;

    @Column(nullable = false)
    @Builder.Default
    private Double v0 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v1 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v2 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v3 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v4 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v5 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v6 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v7 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v8 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v9 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v10 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v11 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v12 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v13 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v14 = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Double v15 = 0.0;

    @Column(name = "enrolled_at", updatable = false)
    private LocalDateTime enrolledAt;

    @PrePersist
    protected void onCreate() {
        if (enrolledAt == null) {
            enrolledAt = LocalDateTime.now();
        }
    }
}
