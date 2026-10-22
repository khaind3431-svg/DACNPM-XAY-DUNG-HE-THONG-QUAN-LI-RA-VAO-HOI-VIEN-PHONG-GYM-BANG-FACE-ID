package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response nhật ký ra vào
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessLogResponse {

    private Long id;
    private String timestamp;
    private String gateId;
    private String direction;
    private Long memberId;
    private String memberCode;
    private String memberName;
    private String packageName;
    private Double similarityScore;
    private Double livenessScore;
    private String result;
    private String reasonVi;
    private Integer processingMs;
}
