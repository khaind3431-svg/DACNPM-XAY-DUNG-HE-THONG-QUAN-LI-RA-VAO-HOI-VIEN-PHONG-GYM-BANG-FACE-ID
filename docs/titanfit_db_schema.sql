-- ============================================================================
-- TitanFit Biometrics — MySQL 8 Database Schema (DDL)
-- Đề tài: Xây Dựng Hệ Thống Quản Lý Hội Viên & Kiểm Soát Ra Vào Bằng Face ID
-- Đồng bộ 100% với Spring Boot JPA Entities (com.titanfit.entity)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS titanfit_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE titanfit_db;

-- ----------------------------------------------------------------------------
-- 1. Bảng users: Tài khoản quản trị & nhân viên (Chính sách Dual-Admin tối đa 2)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    username         VARCHAR(50)  NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(100) NULL,
    role             VARCHAR(20)  NOT NULL DEFAULT 'STAFF' COMMENT 'ADMIN | STAFF | MEMBER',
    linked_member_id BIGINT       NULL COMMENT 'Tham chiếu logic tới members.id (nếu role = MEMBER)',
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'STAFF', 'MEMBER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Bảng packages: Danh mục gói tập phòng gym
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id                     BIGINT       NOT NULL AUTO_INCREMENT,
    name                   VARCHAR(100) NOT NULL,
    target_audience        VARCHAR(200) NULL,
    duration_days          INT          NOT NULL,
    price_vnd              BIGINT       NOT NULL,
    pt_sessions_included   INT          DEFAULT 0,
    access_hours           VARCHAR(50)  NOT NULL COMMENT 'VD: 24/7, 05:00-22:00',
    towel_locker_included  BOOLEAN      DEFAULT FALSE,
    inbody_scans_per_month INT          DEFAULT 0,
    is_active              BOOLEAN      DEFAULT TRUE,
    created_at             DATETIME(6)  DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_packages PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Bảng members: Hồ sơ hội viên & trạng thái sinh trắc học Face ID
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    member_code           VARCHAR(20)  NOT NULL COMMENT 'Định dạng TF-2026-XXXX',
    full_name             VARCHAR(100) NOT NULL,
    phone                 VARCHAR(15)  NOT NULL,
    email                 VARCHAR(100) NULL,
    gender                VARCHAR(10)  NOT NULL COMMENT 'NAM | NU',
    package_id            BIGINT       NULL,
    start_date            DATE         NOT NULL,
    end_date              DATE         NOT NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | EXPIRING_SOON | EXPIRED | FROZEN',
    face_enrolled         BOOLEAN      DEFAULT FALSE,
    face_modality         VARCHAR(20)  NULL COMMENT 'THREE_D_TEMPLATE | OPTICAL_PIXEL',
    enrolled_photo_url    TEXT         NULL,
    face_enrolled_at      DATETIME(6)  NULL,
    face_quality_score    DOUBLE       DEFAULT 0.0,
    pt_sessions_remaining INT          DEFAULT 0,
    total_check_ins       INT          DEFAULT 0,
    last_check_in         DATETIME(6)  NULL,
    locker_number         VARCHAR(10)  NULL,
    assigned_trainer      VARCHAR(100) NULL,
    currently_inside      BOOLEAN      DEFAULT FALSE,
    created_at            DATETIME(6)  DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_members PRIMARY KEY (id),
    CONSTRAINT uq_members_code UNIQUE (member_code),
    CONSTRAINT fk_members_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE SET NULL,
    CONSTRAINT chk_members_gender CHECK (gender IN ('NAM', 'NU')),
    CONSTRAINT chk_members_status CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_members_status ON members (status);
CREATE INDEX idx_members_phone  ON members (phone);

-- ----------------------------------------------------------------------------
-- 4. Bảng face_vectors: Vector đặc trưng khuôn mặt 16 chiều (1:1 với members)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS face_vectors (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    member_id   BIGINT      NULL,
    v0          DOUBLE      NOT NULL DEFAULT 0.0,
    v1          DOUBLE      NOT NULL DEFAULT 0.0,
    v2          DOUBLE      NOT NULL DEFAULT 0.0,
    v3          DOUBLE      NOT NULL DEFAULT 0.0,
    v4          DOUBLE      NOT NULL DEFAULT 0.0,
    v5          DOUBLE      NOT NULL DEFAULT 0.0,
    v6          DOUBLE      NOT NULL DEFAULT 0.0,
    v7          DOUBLE      NOT NULL DEFAULT 0.0,
    v8          DOUBLE      NOT NULL DEFAULT 0.0,
    v9          DOUBLE      NOT NULL DEFAULT 0.0,
    v10         DOUBLE      NOT NULL DEFAULT 0.0,
    v11         DOUBLE      NOT NULL DEFAULT 0.0,
    v12         DOUBLE      NOT NULL DEFAULT 0.0,
    v13         DOUBLE      NOT NULL DEFAULT 0.0,
    v14         DOUBLE      NOT NULL DEFAULT 0.0,
    v15         DOUBLE      NOT NULL DEFAULT 0.0,
    enrolled_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_face_vectors PRIMARY KEY (id),
    CONSTRAINT uq_face_vectors_member UNIQUE (member_id),
    CONSTRAINT fk_face_vectors_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Bảng face_landmarks: Chỉ số hình học khuôn mặt bổ trợ (1:1 với members)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS face_landmarks (
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    member_id          BIGINT      NULL,
    eye_distance_ratio DOUBLE      NULL,
    nose_bridge_length DOUBLE      NULL,
    jaw_width_ratio    DOUBLE      NULL,
    brow_arch_height   DOUBLE      NULL,
    mouth_width_ratio  DOUBLE      NULL,
    face_aspect        DOUBLE      NULL,
    skin_tone_index    INT         NULL,
    hair_style         VARCHAR(30) NULL,
    gender             VARCHAR(10) NULL COMMENT 'NAM | NU',
    CONSTRAINT pk_face_landmarks PRIMARY KEY (id),
    CONSTRAINT uq_face_landmarks_member UNIQUE (member_id),
    CONSTRAINT fk_face_landmarks_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Bảng access_logs: Nhật ký quét Face ID ra/vào cổng xoay tự động
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_logs (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    timestamp        DATETIME(6)  NOT NULL,
    gate_id          VARCHAR(50)  NOT NULL COMMENT 'VD: GATE-A1, GATE-A2',
    direction        VARCHAR(10)  NOT NULL COMMENT 'IN | OUT',
    member_id        BIGINT       NULL COMMENT 'NULL nếu khách vãng lai không nhận diện được',
    member_code      VARCHAR(20)  NULL COMMENT 'Snapshot tại thời điểm quét',
    member_name      VARCHAR(100) NULL COMMENT 'Snapshot tại thời điểm quét',
    package_name     VARCHAR(100) NULL COMMENT 'Snapshot tại thời điểm quét',
    similarity_score DOUBLE       NULL,
    liveness_score   DOUBLE       NULL,
    result           VARCHAR(30)  NOT NULL COMMENT 'GRANTED | DENIED_EXPIRED | DENIED_UNRECOGNIZED | ...',
    reason_vi        VARCHAR(500) NULL,
    processing_ms    INT          NULL,
    CONSTRAINT pk_access_logs PRIMARY KEY (id),
    CONSTRAINT fk_access_logs_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL,
    CONSTRAINT chk_access_logs_direction CHECK (direction IN ('IN', 'OUT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_access_logs_timestamp ON access_logs (timestamp DESC);
CREATE INDEX idx_access_logs_result    ON access_logs (result);

-- ----------------------------------------------------------------------------
-- 7. Bảng payments: Giao dịch đăng ký mới / gia hạn gói tập / mua PT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    member_id       BIGINT       NOT NULL,
    package_id      BIGINT       NOT NULL,
    amount_vnd      BIGINT       NOT NULL,
    payment_method  VARCHAR(20)  NOT NULL COMMENT 'CASH | BANK_TRANSFER | MOMO | VNPAY',
    payment_type    VARCHAR(20)  NOT NULL COMMENT 'NEW_REGISTRATION | RENEWAL | PT_SESSION',
    transaction_ref VARCHAR(100) NULL,
    paid_at         DATETIME(6)  NOT NULL,
    created_by      BIGINT       NULL COMMENT 'Tham chiếu users.id (nhân viên thu ngân)',
    note            VARCHAR(500) NULL,
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT fk_payments_member     FOREIGN KEY (member_id)  REFERENCES members (id),
    CONSTRAINT fk_payments_package    FOREIGN KEY (package_id) REFERENCES packages (id),
    CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_paid_at ON payments (paid_at DESC);

-- ----------------------------------------------------------------------------
-- 8. Bảng invoices: Hóa đơn VAT phát hành từ giao dịch thanh toán (1:1 payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    invoice_code VARCHAR(20)  NOT NULL COMMENT 'Định dạng INV-2026-XXXX',
    payment_id   BIGINT       NULL,
    member_id    BIGINT       NULL,
    total_amount BIGINT       NOT NULL,
    vat_percent  INT          DEFAULT 10,
    vat_amount   BIGINT       NULL,
    grand_total  BIGINT       NOT NULL,
    issued_at    DATETIME(6)  NOT NULL,
    pdf_url      VARCHAR(500) NULL,
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT uq_invoices_code    UNIQUE (invoice_code),
    CONSTRAINT uq_invoices_payment UNIQUE (payment_id),
    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_member  FOREIGN KEY (member_id)  REFERENCES members (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
