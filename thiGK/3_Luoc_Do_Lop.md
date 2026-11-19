# BÁO CÁO THI GIỮA KỲ — PHẦN 3: LƯỢC ĐỒ LỚP (CLASS DIAGRAM)
## Đề tài: TitanFit Biometrics — Hệ Thống Quản Lý Hội Viên & Kiểm Soát Ra Vào Bằng Face ID
**Nhóm thực hiện:** Nhóm 10  
**Môn học:** Đồ Án Chuyên Ngành Phần Mềm (ĐACNPM)

---

## 1. Tổng Quan Lược Đồ Lớp (Class Diagram Overview)

Lược đồ lớp của hệ thống **TitanFit Biometrics** được xây dựng theo mô hình hướng đối tượng (OOP) chuẩn của Spring Boot Framework kết hợp với cấu trúc phân lớp nghiệp vụ (Layered Architecture):
1. **Lớp Thực Thể (Domain Entities)**: Ánh xạ trực tiếp với bảng trong cơ sở dữ liệu MySQL 8 (`User`, `GymPackage`, `Member`, `FaceVector`, `FaceLandmarks`, `AccessLog`, `Payment`, `Invoice`).
2. **Lớp Dịch Vụ Nghiệp Vụ (Service Layer)**: Hiện thực các giải thuật cốt lõi và nghiệp vụ phòng gym (`GateAccessService`, `BiometricService`, `MemberService`, `AuthService`, `DashboardService`).
3. **Lớp Giao Tiếp Điều Khiển (Controller Layer)**: Điều phối các REST API tiếp nhận và phản hồi dữ liệu (`GateController`, `MemberController`, `AuthController`, v.v.).
4. **Lớp Dữ Liệu Truyền Tải (DTOs & Enums)**: Đóng gói dữ liệu đầu vào/đầu ra và các hằng số phân loại trạng thái.

---

## 2. Sơ Đồ Lược Đồ Lớp Tổng Thể (UML Class Diagram)

```mermaid
classDiagram
    direction TB

    %% ================= ENUMS =================
    class UserRole {
        <<enumeration>>
        ADMIN
        STAFF
        MEMBER
    }

    class MemberStatus {
        <<enumeration>>
        ACTIVE
        EXPIRING_SOON
        EXPIRED
        FROZEN
    }

    class BiometricModality {
        <<enumeration>>
        THREE_D_TEMPLATE
        OPTICAL_PIXEL
    }

    class AccessResult {
        <<enumeration>>
        GRANTED
        DENIED_EXPIRED
        DENIED_UNRECOGNIZED
        DENIED_FACE_MISMATCH
        DENIED_LIVENESS
        DENIED_FROZEN
        DENIED_TIME_WINDOW
    }

    class Direction {
        <<enumeration>>
        IN
        OUT
    }

    class PaymentMethod {
        <<enumeration>>
        CASH
        BANK_TRANSFER
        MOMO
        VNPAY
    }

    class PaymentType {
        <<enumeration>>
        NEW_REGISTRATION
        RENEWAL
        PT_SESSION
    }

    %% ================= ENTITY CLASSES =================
    class User {
        -Long id
        -String username
        -String passwordHash
        -String fullName
        -String email
        -UserRole role
        -Long linkedMemberId
        -LocalDateTime createdAt
        -Boolean isActive
        +getId() Long
        +getUsername() String
        +getRole() UserRole
    }

    class GymPackage {
        -Long id
        -String name
        -String targetAudience
        -Integer durationDays
        -Long priceVnd
        -Integer ptSessionsIncluded
        -String accessHours
        -Boolean towelLockerIncluded
        -Integer inbodyScansPerMonth
        -Boolean isActive
        -LocalDateTime createdAt
        +getId() Long
        +getName() String
        +getPriceVnd() Long
        +getDurationDays() Integer
    }

    class Member {
        -Long id
        -String memberCode
        -String fullName
        -String phone
        -String email
        -Gender gender
        -GymPackage gymPackage
        -LocalDate startDate
        -LocalDate endDate
        -MemberStatus status
        -Boolean faceEnrolled
        -BiometricModality faceModality
        -String enrolledPhotoUrl
        -LocalDateTime faceEnrolledAt
        -Double faceQualityScore
        -Integer ptSessionsRemaining
        -Integer totalCheckIns
        -LocalDateTime lastCheckIn
        -String lockerNumber
        -String assignedTrainer
        -Boolean currentlyInside
        +getId() Long
        +getMemberCode() String
        +getStatus() MemberStatus
        +isFaceEnrolled() Boolean
        +isCurrentlyInside() Boolean
    }

    class FaceVector {
        -Long id
        -Member member
        -Double v0
        -Double v1
        -Double v2
        -Double v15
        -LocalDateTime enrolledAt
        +getId() Long
        +getMember() Member
        +toDoubleArray() double[]
    }

    class FaceLandmarks {
        -Long id
        -Member member
        -Double eyeDistanceRatio
        -Double noseBridgeLength
        -Double jawWidthRatio
        -Double browArchHeight
        -Double mouthWidthRatio
        -Double faceAspect
        -Integer skinToneIndex
        -String hairStyle
        -Gender gender
    }

    class AccessLog {
        -Long id
        -LocalDateTime timestamp
        -String gateId
        -Direction direction
        -Member member
        -String memberCode
        -String memberName
        -String packageName
        -Double similarityScore
        -Double livenessScore
        -AccessResult result
        -String reasonVi
        -Integer processingMs
        +getId() Long
        +getResult() AccessResult
        +getSimilarityScore() Double
    }

    class Payment {
        -Long id
        -Member member
        -GymPackage gymPackage
        -Long amountVnd
        -PaymentMethod paymentMethod
        -PaymentType paymentType
        -String transactionRef
        -LocalDateTime paidAt
        -Long createdBy
        -String note
        +getId() Long
        +getAmountVnd() Long
    }

    class Invoice {
        -Long id
        -String invoiceCode
        -Payment payment
        -Member member
        -Long totalAmount
        -Integer vatPercent
        -Long vatAmount
        -Long grandTotal
        -LocalDateTime issuedAt
        -String pdfUrl
        +getInvoiceCode() String
        +getGrandTotal() Long
    }

    %% ================= SERVICE LAYER =================
    class BiometricService {
        +normalizeVector(double[] vec) double[]
        +calculateCosineSimilarity(double[] vecA, double[] vecB) double
        +entityToArray(FaceVector fv) double[]
    }

    class GateAccessService {
        -FaceVectorRepository faceVectorRepo
        -MemberRepository memberRepo
        -AccessLogRepository accessLogRepo
        -BiometricService biometricService
        -double defaultThreshold
        -double livenessThreshold
        +evaluate(GateEvaluateRequest request) GateEvaluationResponse
    }

    class MemberService {
        -MemberRepository memberRepo
        -PackageRepository packageRepo
        -FaceVectorRepository faceVectorRepo
        -BiometricService biometricService
        +getAllMembers() List~MemberResponse~
        +searchMembers(String keyword) List~MemberResponse~
        +createMember(CreateMemberRequest req) MemberResponse
        +enrollFace(Long memberId, FaceEnrollRequest req) MemberResponse
        +renewPackage(Long memberId, RenewMemberRequest req) MemberResponse
        +toggleFreeze(Long memberId) MemberResponse
    }

    class AuthService {
        -UserRepository userRepo
        -JwtTokenProvider tokenProvider
        -PasswordEncoder passwordEncoder
        +login(LoginRequest req) AuthResponse
        +register(RegisterRequest req) UserResponse
        +validateDualAdminPolicy() void
    }

    %% ================= CONTROLLER LAYER =================
    class GateController {
        -GateAccessService gateAccessService
        +evaluateGate(GateEvaluateRequest req) ResponseEntity
        +getRecentLogs() ResponseEntity
    }

    class MemberController {
        -MemberService memberService
        +getMembers() ResponseEntity
        +createMember(CreateMemberRequest req) ResponseEntity
        +enrollFace(Long id, FaceEnrollRequest req) ResponseEntity
        +renewMember(Long id, RenewMemberRequest req) ResponseEntity
        +freezeMember(Long id) ResponseEntity
    }

    class AuthController {
        -AuthService authService
        +login(LoginRequest req) ResponseEntity
        +register(RegisterRequest req) ResponseEntity
    }

    %% ================= RELATIONSHIPS =================
    GymPackage "1" <-- "*" Member : subscribes (package_id)
    Member "1" <-- "1" FaceVector : owns (1:1 member_id)
    Member "1" <-- "1" FaceLandmarks : owns (1:1 member_id)
    Member "1" <-- "*" AccessLog : records (member_id)
    Member "1" <-- "*" Payment : makes (member_id)
    GymPackage "1" <-- "*" Payment : forPackage (package_id)
    User "1" <-- "*" Payment : processedBy (created_by)
    Payment "1" <-- "1" Invoice : generates (1:1 payment_id)
    Member "1" <-- "*" Invoice : recipient (member_id)

    User ..> UserRole : uses
    Member ..> MemberStatus : uses
    Member ..> BiometricModality : uses
    AccessLog ..> AccessResult : uses
    AccessLog ..> Direction : uses
    Payment ..> PaymentMethod : uses
    Payment ..> PaymentType : uses

    GateController ..> GateAccessService : delegates
    MemberController ..> MemberService : delegates
    AuthController ..> AuthService : delegates

    GateAccessService ..> BiometricService : uses
    GateAccessService ..> AccessLog : creates
    GateAccessService ..> Member : queries
    MemberService ..> BiometricService : uses
    MemberService ..> Member : manages
    MemberService ..> FaceVector : creates
    AuthService ..> User : manages
```

---

## 3. Mô Tả Chi Tiết Các Lớp Cốt Lõi

### 3.1. Các Lớp Thực Thể (Entity Layer)
- **`Member`**: Lớp trung tâm quản lý toàn bộ hồ sơ hội viên phòng gym. Giữ quan hệ `N - 1` với gói tập `GymPackage`, quan hệ `1 - 1` độc quyền với `FaceVector` và `FaceLandmarks`. Lưu vết trực quan trạng thái đang ở trong phòng (`currentlyInside`), số lần check-in, số buổi PT còn lại.
- **`FaceVector`**: Lưu trữ 16 giá trị tọa độ đặc trưng toán học (`v0`..`v15`) của khuôn mặt. Được trích xuất tự động khi hội viên nhìn vào webcam lúc đăng ký.
- **`AccessLog`**: Mỗi lần cổng xoay được kích hoạt (hợp lệ hay bị chặn), một đối tượng `AccessLog` được tạo ra để ghi nhận thời gian chính xác tới millisecond, cổng quét, hướng `IN`/`OUT`, điểm Similarity, điểm Liveness và thông điệp hiển thị tiếng Việt.
- **`GymPackage`**: Đại diện cho chính sách gói dịch vụ phòng gym với các trường giới hạn thời gian (ngày), khung giờ truy cập (24/7 hoặc giờ hành chính), số lượt đo InBody và quyền lợi khăn/tủ đồ.
- **`User`**: Đại diện tài khoản nhân sự đăng nhập vào phần mềm. Thực thi quy tắc ràng buộc **Dual-Admin** (chỉ có tối đa 2 bản ghi có `role = ADMIN`).

### 3.2. Các Lớp Dịch Vụ Nghiệp Vụ (Service Layer)
- **`GateAccessService`**: Chứa thuật toán kiểm soát ra vào thời gian thực. Nhận vào vector từ camera cổng, tính liveness, gọi `BiometricService` để so khớp Cosine Similarity với toàn bộ hội viên đang kích hoạt, thẩm định ngày hết hạn gói tập và phát lệnh mở cổng `OPEN_GREEN` hoặc khóa cổng `LOCK_RED`.
- **`BiometricService`**: Chịu trách nhiệm về mặt toán học:
  1. `normalizeVector(double[] vec)`: Zero-centering và L2-normalization để loại bỏ sai lệch ánh sáng môi trường.
  2. `calculateCosineSimilarity(double[] vecA, double[] vecB)`: Tính tích vô hướng chia tích độ dài, đưa ra điểm số từ $0\%$ đến $100\%$.
- **`MemberService`**: Quản trị vòng đời hội viên: tạo mới hồ sơ, tự động kích hoạt camera liên kết Face ID, gia hạn gói tập cộng dồn ngày và đóng băng thẻ khi hội viên có việc bận.
- **`AuthService`**: Xác thực đăng nhập username/password bằng BCrypt, cấp phát JSON Web Token (JWT) và bảo vệ số lượng tài khoản Admin không vượt quá 2.

### 3.3. Các Lớp Điều Khiển (Controller Layer)
- **`GateController`**: Cung cấp endpoint `POST /api/gate/evaluate` tiếp nhận luồng dữ liệu camera cổng xoay và phản hồi trạng thái nhả chốt trong thời gian < 150ms.
- **`MemberController`**: Cung cấp đầy đủ REST API CRUD `/api/members`, hỗ trợ lọc nhanh theo trạng thái và kích hoạt Face ID trực tiếp.
- **`AuthController`**: Tiếp nhận yêu cầu đăng nhập `/api/auth/login` và quản lý phiên làm việc.
