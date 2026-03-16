# Hướng dẫn Deploy Vercel với Turso Database

Ứng dụng này sử dụng SQLite làm cơ sở dữ liệu. Tuy nhiên, Vercel là môi trường serverless, nên file SQLite cục bộ sẽ bị xóa mỗi khi server khởi động lại. Để dữ liệu được lưu trữ vĩnh viễn, bạn cần kết nối với **Turso Cloud**.

## Bước 1: Tạo Database trên Turso
1. Truy cập [Turso.tech](https://turso.tech/) và đăng ký tài khoản.
2. Tạo một database mới (ví dụ: `smart-classroom`).
3. Lấy **Database URL** (có dạng `libsql://...`).
4. Tạo một **Auth Token**.

## Bước 2: Cấu hình trên Vercel
1. Mở project của bạn trên Vercel Dashboard.
2. Vào mục **Settings** > **Environment Variables**.
3. Thêm 2 biến môi trường sau:
   - `TURSO_DATABASE_URL`: Dán URL bạn vừa lấy ở Bước 1.
   - `TURSO_AUTH_TOKEN`: Dán Token bạn vừa lấy ở Bước 1.

## Bước 3: Deploy lại
1. Sau khi thêm biến môi trường, hãy thực hiện **Redeploy** lại project.
2. Ứng dụng sẽ tự động nhận diện các biến này và chuyển từ SQLite cục bộ sang Turso Cloud.

## Lưu ý về "Thông báo màu vàng" trên Vercel
- Tôi đã cấu hình `vercel.json` và `package.json` để tối ưu hóa việc deploy.
- Đảm bảo bạn đã chọn **Node.js 18.x** hoặc cao hơn trong phần **Settings** của Vercel.
- Nếu thấy cảnh báo về "Native Modules", đó là do thư viện `better-sqlite3`. Tuy nhiên, code đã được xử lý để chỉ nạp thư viện này khi chạy ở môi trường không phải Vercel, nên bạn có thể yên tâm bỏ qua cảnh báo đó.
