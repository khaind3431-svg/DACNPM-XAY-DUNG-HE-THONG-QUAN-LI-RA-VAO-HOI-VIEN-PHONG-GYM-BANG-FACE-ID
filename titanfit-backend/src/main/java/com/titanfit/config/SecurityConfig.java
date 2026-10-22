package com.titanfit.config;

import com.titanfit.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cấu hình Spring Security — JWT stateless, phân quyền endpoint
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF vì dùng JWT stateless
            .csrf(AbstractHttpConfigurer::disable)

            // Session: STATELESS (không tạo session, dùng JWT)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Phân quyền endpoint
            .authorizeHttpRequests(auth -> auth
                // Public — Đăng nhập, Swagger docs
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/refresh").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // Chỉ ADMIN mới được tạo tài khoản, xóa member, quản lý gói tập
                .requestMatchers("/api/auth/register").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/members/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/packages/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/packages/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/packages/**").hasRole("ADMIN")
                .requestMatchers("/api/members/*/freeze").hasRole("ADMIN")

                // Reports — chỉ ADMIN
                .requestMatchers("/api/reports/**").hasRole("ADMIN")

                // Dashboard — ADMIN và STAFF
                .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "STAFF")

                // Tất cả API khác cần đăng nhập
                .requestMatchers("/api/**").authenticated()

                // Cho phép tất cả request khác (static files, etc.)
                .anyRequest().permitAll()
            )

            // Thêm JWT filter trước UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
