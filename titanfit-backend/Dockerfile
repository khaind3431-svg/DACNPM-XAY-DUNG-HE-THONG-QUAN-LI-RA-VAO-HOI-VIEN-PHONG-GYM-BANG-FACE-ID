# ==========================================
# Giai đoạn 1: Build mã nguồn Spring Boot với Maven & JDK 17
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy file cấu hình Maven để cache dependencies
COPY pom.xml .

# Tải trước dependencies
RUN mvn dependency:go-offline -B || true

# Copy toàn bộ mã nguồn Java
COPY src ./src

# Đóng gói ứng dụng thành file JAR (bỏ qua unit tests)
RUN mvn clean package -DskipTests

# ==========================================
# Giai đoạn 2: Môi trường chạy tối giản với JRE 17 Alpine
# ==========================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Tạo user an toàn không có quyền root
RUN addgroup -S titanfit && adduser -S titanfit -G titanfit
USER titanfit

# Copy file jar từ giai đoạn build
COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8080

# Cấu hình JVM tối ưu cho container
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
