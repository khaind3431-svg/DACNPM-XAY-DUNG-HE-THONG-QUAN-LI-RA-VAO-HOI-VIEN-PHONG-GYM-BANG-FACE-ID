package com.titanfit.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request đăng ký / cập nhật khuôn mặt
 */
@Data
public class FaceEnrollRequest {

    /** Vector khuôn mặt 16 chiều */
    @NotNull(message = "Vector khuôn mặt không được để trống")
    private double[] faceVector;

    /** Điểm chất lượng ảnh (0-100) */
    private double qualityScore = 98.0;

    /** Phương thức: THREE_D_TEMPLATE hoặc OPTICAL_PIXEL */
    private String modality = "THREE_D_TEMPLATE";

    /** Base64 data URL ảnh khuôn mặt */
    private String photoDataUrl;
}
