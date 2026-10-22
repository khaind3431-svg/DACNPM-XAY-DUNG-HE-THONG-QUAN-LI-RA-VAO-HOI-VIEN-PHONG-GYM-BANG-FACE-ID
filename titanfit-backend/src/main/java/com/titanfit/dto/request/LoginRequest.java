package com.titanfit.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body cho đăng nhập
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
