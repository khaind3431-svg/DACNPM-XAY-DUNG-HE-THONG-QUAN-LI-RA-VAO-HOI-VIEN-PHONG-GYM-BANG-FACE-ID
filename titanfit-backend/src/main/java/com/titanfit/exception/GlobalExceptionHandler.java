package com.titanfit.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Xử lý ngoại lệ toàn cục — trả JSON error response thống nhất
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Cấu trúc JSON error response chuẩn
     */
    private Map<String, Object> buildErrorBody(HttpStatus status, String message, Object details) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        if (details != null) {
            body.put("details", details);
        }
        return body;
    }

    /** 404 — Không tìm thấy tài nguyên */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(buildErrorBody(HttpStatus.NOT_FOUND, ex.getMessage(), null));
    }

    /** 400 — Vi phạm quy tắc nghiệp vụ */
    @ExceptionHandler(BusinessLogicException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessLogic(BusinessLogicException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorBody(HttpStatus.BAD_REQUEST, ex.getMessage(), null));
    }

    /** 400 — Validation errors (từ @Valid) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(buildErrorBody(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", fieldErrors));
    }

    /** 401 — Sai tên đăng nhập hoặc mật khẩu */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(buildErrorBody(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu", null));
    }

    /** 403 — Không có quyền truy cập */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(buildErrorBody(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này", null));
    }

    /** 500 — Lỗi hệ thống không xác định */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorBody(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Lỗi hệ thống. Vui lòng thử lại sau.", ex.getMessage()));
    }
}
