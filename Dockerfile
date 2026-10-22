# ==========================================
# Giai đoạn 1: Build ứng dụng React với Node.js
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files để cache layer dependencies
COPY package*.json ./

# Cài đặt thư viện
RUN npm install --legacy-peer-deps

# Copy toàn bộ mã nguồn frontend
COPY . .

# Build phiên bản production
RUN npm run build

# ==========================================
# Giai đoạn 2: Phục vụ qua Nginx siêu nhẹ
# ==========================================
FROM nginx:alpine

# Copy thư mục build từ giai đoạn 1 sang Nginx html
COPY --from=build /app/dist /usr/share/nginx/html

# Copy cấu hình Nginx reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
