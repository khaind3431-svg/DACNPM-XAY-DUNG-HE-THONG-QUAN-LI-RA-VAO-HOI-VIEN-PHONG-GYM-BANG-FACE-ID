package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response thông tin hội viên
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {

    private Long id;
    private String memberCode;
    private String fullName;
    private String phone;
    private String email;
    private String gender;

    // Gói tập
    private Long packageId;
    private String packageName;
    private String startDate;
    private String endDate;
    private String status;
    private Integer daysRemaining;

    // Sinh trắc học
    private Boolean faceEnrolled;
    private String faceModality;
    private String enrolledPhotoUrl;
    private String faceEnrolledAt;
    private Double faceQualityScore;
    private double[] faceVector;

    // Hoạt động
    private Integer ptSessionsRemaining;
    private Integer totalCheckIns;
    private String lastCheckIn;
    private String lockerNumber;
    private String assignedTrainer;
    private Boolean currentlyInside;

    // Face Landmarks (cho SVG avatar)
    private FaceLandmarksDto landmarks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceLandmarksDto {
        private Double eyeDistanceRatio;
        private Double noseBridgeLength;
        private Double jawWidthRatio;
        private Double browArchHeight;
        private Double mouthWidthRatio;
        private Double faceAspect;
        private Integer skinToneIndex;
        private String hairStyle;
        private String gender;
    }
}
