# TitanFit Biometrics — Hệ Thống Quản Lý Hội Viên & Kiểm Soát Ra Vào Bằng Face ID

> **Đề tài:** Xây dựng hệ thống quản lý hội viên & kiểm soát cổng tự động phòng gym bằng nhận diện khuôn mặt 16-D (Face ID).

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

### 2. Chạy Backend (Spring Boot)

Yêu cầu máy đã cài **JDK 17+** và **MySQL Server 8.0**:

```bash
cd titanfit-backend

# Chạy ứng dụng qua Maven
mvn spring-boot:run
```

- Backend API chạy tại: **`http://localhost:8080`**
- Tài liệu Swagger API: **`http://localhost:8080/swagger-ui.html`**

---

## 👥 Tác Giả & Bản Quyền
- **Sinh viên thực hiện**: Nguyễn Đức Khải
- **Đồ án**: Đồ Án Chuyên Ngành Phần Mềm (ĐACNPM)
