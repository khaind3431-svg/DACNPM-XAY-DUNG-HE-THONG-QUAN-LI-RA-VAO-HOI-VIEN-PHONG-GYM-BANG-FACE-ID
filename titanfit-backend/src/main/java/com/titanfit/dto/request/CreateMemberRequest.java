package com.titanfit.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request tạo hội viên mới
 */
@Data
public class CreateMemberRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 3, max = 100, message = "Họ tên phải từ 3 đến 100 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại không hợp lệ (VD: 0901234567)")
    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Giới tính không được để trống")
    private String gender; // "NAM" hoặc "NU"

    @NotNull(message = "Vui lòng chọn gói tập")
    private Long packageId;

    private String assignedTrainer;

    /** Đăng ký khuôn mặt ngay khi tạo */
    private boolean enrollFaceNow = false;

    /** Vector khuôn mặt 16-D (nếu enrollFaceNow = true) */
    private double[] faceVector;

    /** Phương thức: THREE_D_TEMPLATE hoặc OPTICAL_PIXEL */
    private String faceModality;

    /** Base64 data URL ảnh khuôn mặt */
    private String enrolledPhotoUrl;
}
