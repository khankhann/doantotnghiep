# Sử dụng Node.js phiên bản 18
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Mở port (trùng với port backend của fen)
EXPOSE 9000

# Lệnh khởi chạy
CMD ["npm", "start"]