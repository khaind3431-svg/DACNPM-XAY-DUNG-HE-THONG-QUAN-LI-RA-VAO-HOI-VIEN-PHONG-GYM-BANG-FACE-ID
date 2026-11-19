# TitanFit Biometrics — Hệ Thống Quản Lý Hội Viên & Kiểm Soát Ra Vào Bằng Face ID

> **Đề tài:** Xây dựng hệ thống quản lý hội viên & kiểm soát cổng tự động phòng gym bằng nhận diện khuôn mặt 16-D (Face ID).  
> 📚 **BÁO CÁO THI GIỮA KỲ (Nhóm 10):** Xem toàn bộ tài liệu tại thư mục [thiGK/](./thiGK/) bao gồm:  
> - [Phần 1: Kiến trúc hệ thống](./thiGK/1_Kien_Truc_He_Thong.md)  
> - [Phần 2: Lược đồ Use Case](./thiGK/2_Luoc_Do_UseCase.md)  
> - [Phần 3: Lược đồ Lớp (Class Diagram)](./thiGK/3_Luoc_Do_Lop.md)  
> - [Báo Cáo Tổng Hợp](./thiGK/BAO_CAO_THI_GIUA_KY.md)

---

## 📌 Giới Thiệu Dự Án

**TitanFit Biometrics** là giải pháp phần mềm quản trị phòng gym thông minh tích hợp công nghệ nhận diện sinh trắc học khuôn mặt theo thời gian thực (Hands-Free Face ID). Hệ thống giải quyết bài toán kiểm soát ra vào không chạm, chống gian lận thẻ tập, tự động hóa đóng mở cổng xoay và quản lý hội viên toàn diện.

### ✨ Các Tính Năng Nổi Bật

1. **Trạm Kiểm Soát Cổng Tự Động (Gate Terminal)**:
   - Nhận diện khuôn mặt liên tục qua Webcam với độ trễ thấp (< 150ms).
   - So khớp vector sinh trắc học quang học 16 chiều (16-D) bằng Cosine Similarity.
   - Kiểm tra Liveness (Anti-spoofing) chống giả mạo bằng hình ảnh điện thoại.
   - Tự động đóng/mở cổng xoay (OPEN_GREEN / LOCK_RED) theo tình trạng gói tập.
2. **Đăng Ký & Quét Khuôn Mặt Bắt Buộc**:
   - Trực tiếp kích hoạt webcam trong form đăng ký để quét khuôn mặt thực tế.
   - Tự động mã hóa và lưu trữ vector khuôn mặt vào hồ sơ hội viên.
3. **Quản Lý Hội Viên (Member Directory)**:
   - Tìm kiếm, lọc theo trạng thái: Đang hoạt động, Sắp hết hạn, Quá hạn, Đóng băng.
   - Gia hạn gói tập, đóng băng thẻ, cấp phát tủ đồ và phân công huấn luyện viên (PT).
4. **Nhật Ký Ra Vào Thời Gian Thực (Access Logs)**:
   - Ghi lại chi tiết mọi lượt check-in/out, điểm tương đồng (Similarity), điểm Liveness và kết quả mở cổng.
5. **Gói Tập & Phân Tích Lưu Lượng**:
   - Quản lý danh mục gói tập đa dạng (1 tháng, 3 tháng, 6 tháng + PT, 12 tháng VIP).
   - Biểu đồ thống kê lưu lượng phòng tập theo các khung giờ trong ngày.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Biometric Processing**: HTML5 Canvas API + Pixel Topography Vectorization

### Backend (Spring Boot 3)
- **Framework**: Spring Boot 3.2.5 (Java 17)
- **Security**: Spring Security + JWT (JSON Web Token)
- **Database**: MySQL 8 / Spring Data JPA + Hibernate
- **Tài liệu API**: Swagger / OpenAPI UI 3

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Chạy Frontend (React Vite)

```bash
# Cài đặt các thư viện phụ thuộc
npm install --legacy-peer-deps

# Khởi động máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

### 2. Chạy Bằng Docker (1-Click Toàn Diện — Khuyên Dùng 🐳)

Chỉ cần cài Docker Desktop và chạy đúng **1 câu lệnh** để tự động build và chạy cả 3 dịch vụ (MySQL + Backend + Frontend):

```bash
docker compose up --build -d
```

- **Frontend (Giao diện web)**: `http://localhost:3000`
- **Backend (Spring Boot API)**: `http://localhost:8080`
- **Tài liệu Swagger API**: `http://localhost:8080/swagger-ui.html`
- **MySQL Database**: Cổng `3306` (user: `root`, pass: `root`, db: `titanfit_db`)

Để dừng toàn bộ hệ thống:
```bash
docker compose down
```

### 3. Chạy Backend Thủ Công (Spring Boot)

Yêu cầu máy đã cài **JDK 17+** và **MySQL Server 8.0**:

```bash
cd titanfit-backend

# Chạy ứng dụng qua Maven
mvn spring-boot:run
```

- Backend API chạy tại: **`http://localhost:8080`**
- Tài liệu Swagger API: **`http://localhost:8080/swagger-ui.html`**

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu (ERD & SQL)

- **Sơ đồ ERD trực quan (Mermaid) & Đặc tả 8 bảng**: [docs/ERD_DATABASE.md](./docs/ERD_DATABASE.md)
- **File SQL DDL chuẩn MySQL 8 (`titanfit_db`)**: [docs/titanfit_db_schema.sql](./docs/titanfit_db_schema.sql)

---

## 🤝 Hướng Dẫn Làm Việc Nhóm (Git Workflow)

> **Lưu ý:** Thành viên mới cần chấp nhận lời mời (**Accept invitation**) qua Email hoặc thông báo trên GitHub trước khi thực hiện `git push`.

```bash
# 1. Clone dự án về máy (chỉ làm lần đầu)
git clone https://github.com/khaind3431-svg/DACNPM-XAY-DUNG-HE-THONG-QUAN-LI-RA-VAO-HOI-VIEN-PHONG-GYM-BANG-FACE-ID.git
cd DACNPM-XAY-DUNG-HE-THONG-QUAN-LI-RA-VAO-HOI-VIEN-PHONG-GYM-BANG-FACE-ID
npm install --legacy-peer-deps

# 2. Tạo nhánh riêng cho phần việc của mình (tránh xung đột trên nhánh main)
git checkout -b feature/ten-chuc-nang

# 3. Lưu và đẩy code lên GitHub sau khi hoàn thành
git add .
git commit -m "feat: mo ta chuc nang da thuc hien"
git push origin feature/ten-chuc-nang
```

*(Trước khi bắt đầu code mới, nên chạy `git pull origin main` để đồng bộ phiên bản mới nhất của cả nhóm.)*

---

## 👥 Thành Viên Thực Hiện — Nhóm 10

- **Đồ án**: Đồ Án Chuyên Ngành Phần Mềm (ĐACNPM)
- **Tài liệu đăng ký đề tài**: [dk_de_tai_nhom_10.docx](./dk_de_tai_nhom_10.docx)

| STT | Mã Số Sinh Viên (MSSV) | Họ và Tên | GitHub |
| :---: | :--- | :--- | :--- |
| 1 | `075206003431` | **Nguyễn Đức Khải** | `khaind3431-svg` *(Nhóm trưởng)* |
| 2 | `066206005759` | **Lê Như Hoàng** | `HoangLN714` |
| 3 | `087206015150` | **Nguyễn Công Tấn** | `tannc5150-svg` |
| 4 | `089206000099` | **Nguyễn Khắc Anh Tân** | *(Đang cập nhật)* |
| 5 | `067206000218` | **Vương Đình Minh** | `minhlamcoder` |
