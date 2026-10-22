package com.titanfit.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request cập nhật thông tin hội viên
 */
@Data
public class UpdateMemberRequest {

    @Size(min = 3, max = 100, message = "Họ tên phải từ 3 đến 100 ký tự")
    private String fullName;

    @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    private String assignedTrainer;
    private String lockerNumber;
}
