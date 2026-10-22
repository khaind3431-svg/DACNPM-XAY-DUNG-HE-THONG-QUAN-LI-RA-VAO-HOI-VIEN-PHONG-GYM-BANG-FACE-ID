package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response thông tin gói tập
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageResponse {

    private Long id;
    private String name;
    private String targetAudience;
    private Integer durationDays;
    private Long priceVnd;
    private Integer ptSessionsIncluded;
    private String accessHours;
    private Boolean towelLockerIncluded;
    private Integer inbodyScansPerMonth;
    private Boolean isActive;

    /** Số hội viên đang sử dụng gói này */
    private Long subscriberCount;
}
