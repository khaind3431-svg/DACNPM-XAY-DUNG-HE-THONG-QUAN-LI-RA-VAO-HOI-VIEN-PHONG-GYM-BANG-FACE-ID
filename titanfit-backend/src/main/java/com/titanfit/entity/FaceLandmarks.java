package com.titanfit.entity;

import com.titanfit.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

/**
 * Đặc điểm khuôn mặt (landmarks) — tỷ lệ khoảng cách mắt, mũi, hàm...
 * Dùng bổ trợ cho nhận diện khuôn mặt
 */
@Entity
@Table(name = "face_landmarks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceLandmarks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Hội viên sở hữu dữ liệu landmarks */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", unique = true)
    private Member member;

    /** Tỷ lệ khoảng cách giữa hai mắt */
    @Column(name = "eye_distance_ratio")
    private Double eyeDistanceRatio;

    /** Chiều dài sống mũi */
    @Column(name = "nose_bridge_length")
    private Double noseBridgeLength;

    /** Tỷ lệ chiều rộng hàm */
    @Column(name = "jaw_width_ratio")
    private Double jawWidthRatio;

    /** Độ cong lông mày */
    @Column(name = "brow_arch_height")
    private Double browArchHeight;

    /** Tỷ lệ chiều rộng miệng */
    @Column(name = "mouth_width_ratio")
    private Double mouthWidthRatio;

    /** Tỷ lệ khuôn mặt (dài / rộng) */
    @Column(name = "face_aspect")
    private Double faceAspect;

    /** Chỉ số tông da */
    @Column(name = "skin_tone_index")
    private Integer skinToneIndex;

    /** Kiểu tóc */
    @Column(name = "hair_style", length = 30)
    private String hairStyle;

    /** Giới tính nhận diện */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;
}
