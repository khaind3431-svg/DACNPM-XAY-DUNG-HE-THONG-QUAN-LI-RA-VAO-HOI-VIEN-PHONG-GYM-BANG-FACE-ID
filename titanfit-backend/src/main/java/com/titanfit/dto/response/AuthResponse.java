package com.titanfit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Response trả về sau khi đăng nhập thành công
 */
@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String username;
    private String fullName;
    private String role;
    private Long expiresIn;

    public AuthResponse() {
        this.tokenType = "Bearer";
    }
}
