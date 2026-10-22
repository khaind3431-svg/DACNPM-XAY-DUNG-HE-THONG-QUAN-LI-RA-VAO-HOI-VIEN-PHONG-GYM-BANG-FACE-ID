package com.titanfit.service;

import com.titanfit.dto.request.LoginRequest;
import com.titanfit.dto.request.RegisterRequest;
import com.titanfit.dto.response.AuthResponse;
import com.titanfit.dto.response.UserResponse;
import com.titanfit.entity.User;
import com.titanfit.enums.UserRole;
import com.titanfit.exception.BusinessLogicException;
import com.titanfit.exception.ResourceNotFoundException;
import com.titanfit.repository.UserRepository;
import com.titanfit.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service xử lý đăng nhập, đăng ký, refresh token
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Đăng nhập — xác thực username/password, trả JWT tokens
     */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()
                )
        );

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .expiresIn(86400L) // 24 giờ
                .build();
    }

    /**
     * Đăng ký tài khoản mới (chỉ ADMIN)
     */
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessLogicException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại");
        }

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessLogicException("Email '" + request.getEmail() + "' đã được sử dụng");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessLogicException("Vai trò không hợp lệ: " + request.getRole());
        }

        // Chính sách an ninh: Giới hạn tối đa đúng 2 tài khoản Quản Trị Viên (Admin)
        if (role == UserRole.ADMIN) {
            Long currentAdminCount = userRepository.countByRole(UserRole.ADMIN);
            if (currentAdminCount != null && currentAdminCount >= 2) {
                throw new BusinessLogicException("Hệ thống chỉ cho phép tối đa 2 tài khoản Quản Trị Viên (Admin). Đã đạt giới hạn tối đa (2/2)!");
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(role)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .isActive(savedUser.getIsActive())
                .build();
    }

    /**
     * Refresh access token từ refresh token
     */
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessLogicException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String newAccessToken = jwtTokenProvider.generateAccessToken(username);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .expiresIn(86400L)
                .build();
    }

    /**
     * Lấy thông tin user hiện tại từ username
     */
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .build();
    }
}
