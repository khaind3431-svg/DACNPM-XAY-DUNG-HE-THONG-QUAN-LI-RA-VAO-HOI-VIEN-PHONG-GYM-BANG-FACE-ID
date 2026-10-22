-- =====================================================
-- TitanFit Biometrics — Dữ liệu khởi tạo (Seed Data)
-- Sử dụng INSERT IGNORE để đảm bảo idempotent
-- =====================================================

-- -----------------------------------------------------
-- 1. Users — Tài khoản hệ thống (Giới hạn tối đa đúng 02 Admin)
-- Mật khẩu mặc định: admin123 (BCrypt hash)
-- -----------------------------------------------------
INSERT IGNORE INTO users (id, username, password_hash, full_name, email, role, is_active, created_at) VALUES
(1, 'admin1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quản Trị Viên 1 (Trưởng)', 'admin1@titanfit.vn', 'ADMIN', true, '2026-01-01 00:00:00'),
(2, 'admin2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quản Trị Viên 2 (Phó)', 'admin2@titanfit.vn', 'ADMIN', true, '2026-01-02 00:00:00'),
(3, 'staff01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nhân Viên Lễ Tân', 'staff01@titanfit.vn', 'STAFF', true, '2026-01-15 00:00:00'),
(4, 'gate_terminal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trạm Cổng Tự Động', 'gate@titanfit.vn', 'STAFF', true, '2026-01-15 00:00:00');

-- -----------------------------------------------------
-- 2. Packages — Gói tập gym mặc định
-- -----------------------------------------------------
INSERT IGNORE INTO packages (id, name, target_audience, duration_days, price_vnd, pt_sessions_included, access_hours, towel_locker_included, inbody_scans_per_month, is_active, created_at) VALUES
(1, 'Gói Cơ Bản 1 Tháng', 'Người mới bắt đầu, sinh viên', 30, 850000, 1, '05:00-22:00', false, 0, true, '2026-01-01 00:00:00'),
(2, 'Gói Nâng Cao 3 Tháng', 'Người tập thường xuyên', 90, 2250000, 4, '05:00-22:00', true, 1, true, '2026-01-01 00:00:00'),
(3, 'Gói Hình Thể 6 Tháng + PT', 'Mục tiêu giảm cân / tăng cơ', 180, 4200000, 12, '24/7', true, 2, true, '2026-01-01 00:00:00'),
(4, 'Gói Đặc Quyền VIP 12 Tháng', 'Hội viên cao cấp, doanh nhân', 365, 7500000, 24, '24/7', true, 4, true, '2026-01-01 00:00:00');
