package com.titanfit.enums;

/**
 * Kết quả xác thực ra vào cổng
 * - GRANTED: Cho phép vào
 * - DENIED_EXPIRED: Từ chối — gói tập đã hết hạn
 * - DENIED_UNRECOGNIZED: Từ chối — không nhận diện được khuôn mặt
 * - DENIED_FACE_MISMATCH: Từ chối — khuôn mặt không khớp
 * - DENIED_LIVENESS: Từ chối — không vượt qua kiểm tra liveness
 * - DENIED_FROZEN: Từ chối — tài khoản đang bị đóng băng
 * - DENIED_TIME_WINDOW: Từ chối — ngoài khung giờ cho phép
 */
public enum AccessResult {
    GRANTED,
    DENIED_EXPIRED,
    DENIED_UNRECOGNIZED,
    DENIED_FACE_MISMATCH,
    DENIED_LIVENESS,
    DENIED_FROZEN,
    DENIED_TIME_WINDOW
}
