package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response đánh giá quyền ra/vào cổng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateEvaluationResponse {

    /** Có được phép qua cổng không */
    private boolean granted;

    /** Kết quả chi tiết */
    private String resultStatus;

    /** Hội viên khớp (nếu có) */
    private Long matchedMemberId;
    private String matchedMemberCode;
    private String matchedMemberName;
    private String matchedPackageName;

    /** Điểm tương đồng khuôn mặt (0-100%) */
    private double similarityScore;

    /** Điểm liveness (0-100%) */
    private double livenessScore;

    /** Lý do (tiếng Việt) */
    private String reasonVi;

    /** Hành động cổng xoay */
    private String turnstileAction;

    /** Số ngày còn lại gói tập */
    private Integer daysRemaining;

    /** Thời gian xử lý (ms) */
    private long processingMs;
}
