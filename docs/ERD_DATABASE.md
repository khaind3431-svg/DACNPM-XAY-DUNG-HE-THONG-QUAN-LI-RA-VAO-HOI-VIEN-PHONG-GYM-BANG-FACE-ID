# Sơ Đồ Thực Thể Liên Kết (ERD) & Thiết Kế Cơ Sở Dữ Liệu SQL — TitanFit Biometrics

> Cơ sở dữ liệu **MySQL 8** (`titanfit_db`) được thiết kế đồng bộ 100% với các JPA Entities trong `titanfit-backend/src/main/java/com/titanfit/entity/`.
> File SQL DDL đầy đủ để chạy trực tiếp hoặc import vào MySQL Workbench / DBeaver: [titanfit_db_schema.sql](./titanfit_db_schema.sql).

---

## 1. Sơ Đồ ERD Trực Quan (Entity Relationship Diagram)

```mermaid
erDiagram
    users {
        bigint id PK
        varchar username UK "Ten dang nhap duy nhat"
        varchar password_hash "Ma hoa BCrypt"
        varchar full_name
        varchar email
        varchar role "ADMIN | STAFF | MEMBER"
        bigint linked_member_id "Lien ket logic toi members.id"
        datetime created_at
        boolean is_active
    }

    packages {
        bigint id PK
        varchar name
        varchar target_audience
        int duration_days
        bigint price_vnd
        int pt_sessions_included
        varchar access_hours "24/7 | 05:00-22:00 | Off-Peak"
        boolean towel_locker_included
        int inbody_scans_per_month
        boolean is_active
        datetime created_at
    }

    members {
        bigint id PK
        varchar member_code UK "Dinh dang TF-2026-XXXX"
        varchar full_name
        varchar phone
        varchar email
        varchar gender "NAM | NU"
        bigint package_id FK "Goi tap hien tai"
        date start_date
        date end_date
        varchar status "ACTIVE | EXPIRING_SOON | EXPIRED | FROZEN"
        boolean face_enrolled
        varchar face_modality "THREE_D_TEMPLATE | OPTICAL_PIXEL"
        text enrolled_photo_url
        datetime face_enrolled_at
        double face_quality_score
        int pt_sessions_remaining
        int total_check_ins
        datetime last_check_in
        varchar locker_number
        varchar assigned_trainer
        boolean currently_inside
        datetime created_at
        datetime updated_at
    }

    face_vectors {
        bigint id PK
        bigint member_id FK "UNIQUE 1:1 voi members"
        double v0 "Chieu dac trung 0"
        double v1 "Chieu dac trung 1"
        double v2_to_v14 "Cac chieu v2..v14"
        double v15 "Chieu dac trung 15"
        datetime enrolled_at
    }

    face_landmarks {
        bigint id PK
        bigint member_id FK "UNIQUE 1:1 voi members"
        double eye_distance_ratio
        double nose_bridge_length
        double jaw_width_ratio
        double brow_arch_height
        double mouth_width_ratio
        double face_aspect
        int skin_tone_index
        varchar hair_style
        varchar gender "NAM | NU"
    }

    access_logs {
        bigint id PK
        datetime timestamp
        varchar gate_id "GATE-A1 | GATE-A2"
        varchar direction "IN | OUT"
        bigint member_id FK "NULL neu khong nhan dien duoc"
        varchar member_code "Snapshot tai thoi diem quet"
        varchar member_name "Snapshot tai thoi diem quet"
        varchar package_name "Snapshot tai thoi diem quet"
        double similarity_score
        double liveness_score
        varchar result "GRANTED | DENIED_*"
        varchar reason_vi
        int processing_ms
    }

    payments {
        bigint id PK
        bigint member_id FK
        bigint package_id FK
        bigint amount_vnd
        varchar payment_method "CASH | BANK_TRANSFER | MOMO | VNPAY"
        varchar payment_type "NEW_REGISTRATION | RENEWAL | PT_SESSION"
        varchar transaction_ref
        datetime paid_at
        bigint created_by FK "Tham chieu users.id"
        varchar note
    }

    invoices {
        bigint id PK
        varchar invoice_code UK "Dinh dang INV-2026-XXXX"
        bigint payment_id FK "UNIQUE 1:1 voi payments"
        bigint member_id FK
        bigint total_amount
        int vat_percent
        bigint vat_amount
        bigint grand_total
        datetime issued_at
        varchar pdf_url
    }

    packages ||--o{ members : "duoc dang ky boi"
    members ||--o| face_vectors : "ma hoa vector 16-D"
    members ||--o| face_landmarks : "luu chi so hinh hoc"
    members |o--o{ access_logs : "ghi nhan luot ra vao"
    members ||--o{ payments : "thuc hien giao dich"
    packages ||--o{ payments : "la goi duoc thanh toan"
    users |o--o{ payments : "lap giao dich (created_by)"
    payments ||--o| invoices : "xuat hoa don VAT"
    members |o--o{ invoices : "nhan hoa don"
    members |o..o| users : "lien ket tai khoan (logic)"
```

---

## 2. Chi Tiết Các Bảng & Ràng Buộc Nghiệp Vụ

| STT | Tên bảng | Loại quan hệ chính | Khóa chính (PK) & Khóa ngoại (FK) | Mô tả nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `users` | `1 - N` tới `payments` | PK: `id`, UK: `username` | Lưu tài khoản hệ thống (`ADMIN`, `STAFF`, `MEMBER`). Áp dụng chính sách **Dual-Admin** (tối đa 2 tài khoản `ADMIN`: `admin1`, `admin2`). |
| 2 | `packages` | `1 - N` tới `members`, `payments` | PK: `id` | Danh mục gói tập (1 tháng, 3 tháng, 6 tháng + PT, 12 tháng VIP) gồm giá, khung giờ tập, số buổi PT, InBody. |
| 3 | `members` | `N - 1` tới `packages`<br>`1 - 1` tới `face_vectors`, `face_landmarks` | PK: `id`, UK: `member_code`<br>FK: `package_id` | Hồ sơ hội viên phòng gym, trạng thái thẻ (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `FROZEN`) và trạng thái có đang ở trong phòng hay không (`currently_inside`). |
| 4 | `face_vectors` | `1 - 1` tới `members` | PK: `id`<br>FK & UK: `member_id` | Lưu vector đặc trưng sinh trắc học **16 chiều (`v0`..`v15`)** đã chuẩn hóa L2 để đối chiếu Cosine Similarity tại cổng xoay. |
| 5 | `face_landmarks` | `1 - 1` tới `members` | PK: `id`<br>FK & UK: `member_id` | Lưu tỷ lệ hình học khuôn mặt bổ trợ (khoảng cách mắt, sống mũi, xương hàm, tông da, kiểu tóc). |
| 6 | `access_logs` | `N - 1` (nullable) tới `members` | PK: `id`<br>FK: `member_id` | Lưu lịch sử quét Face ID qua cổng (`IN`/`OUT`), điểm Similarity, điểm Liveness, thời gian xử lý (`ms`) và lý do từ chối. Cho phép `member_id = NULL` khi phát hiện khách vãng lai lạ mặt. |
| 7 | `payments` | `N - 1` tới `members`, `packages`, `users` | PK: `id`<br>FK: `member_id`, `package_id`, `created_by` | Ghi nhận giao dịch thu tiền đăng ký mới, gia hạn hoặc mua thêm buổi PT qua tiền mặt, chuyển khoản, MoMo, VNPay. |
| 8 | `invoices` | `1 - 1` tới `payments`<br>`N - 1` tới `members` | PK: `id`, UK: `invoice_code`<br>FK & UK: `payment_id`, FK: `member_id` | Lưu hóa đơn VAT (mặc định 10%), tổng tiền trước/sau thuế và đường dẫn file PDF hóa đơn. |

---

## 3. Cách Import SQL Để Tạo Bảng Hoặc Vẽ Diagram Trong MySQL Workbench

Nếu muốn mở sơ đồ ERD trực tiếp bằng **MySQL Workbench** hoặc **DBeaver** để xuất ảnh cho báo cáo Word:

1. Mở **MySQL Workbench** $\rightarrow$ kết nối tới MySQL Server (`localhost:3306`).
2. Chọn **File $\rightarrow$ Run SQL Script...** $\rightarrow$ chọn file `docs/titanfit_db_schema.sql` để tạo database `titanfit_db` và toàn bộ 8 bảng.
3. Chọn **Database $\rightarrow$ Reverse Engineer...** $\rightarrow$ chọn database `titanfit_db` $\rightarrow$ nhấn Next liên tục để MySQL Workbench tự sinh sơ đồ ERD có đầy đủ đường nối 1-1 / 1-N.
