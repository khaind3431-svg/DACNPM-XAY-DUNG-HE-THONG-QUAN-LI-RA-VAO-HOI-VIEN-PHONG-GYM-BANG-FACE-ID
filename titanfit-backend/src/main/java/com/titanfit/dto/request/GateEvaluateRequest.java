package com.titanfit.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request đánh giá quyền ra/vào qua cổng
 */
@Data
public class GateEvaluateRequest {

    /** Vector khuôn mặt 16-D từ camera/sensor */
    @NotNull(message = "Vector khuôn mặt không được để trống")
    private double[] probeVector;

    /** Điểm liveness anti-spoofing (0-100) */
    private double livenessScore = 95.0;

    /** ID cổng: "Cổng A1 - Lối Vào Chính", "Cổng A2 - Khu VIP & PT", "Cổng B1 - Lối Ra" */
    private String gateId = "Cổng A1 - Lối Vào Chính";

    /** Hướng: IN hoặc OUT */
    private String direction = "IN";

    /** Ngưỡng tương đồng (tùy chỉnh, mặc định dùng config) */
    private Double threshold;

    /** ID hội viên cụ thể (chế độ 1:1 verification) — nullable */
    private Long expectedMemberId;

    /** Phương thức probe: THREE_D_TEMPLATE hoặc OPTICAL_PIXEL */
    private String probeModality;
}
