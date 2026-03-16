# Hướng dẫn Chuyển App sang GitHub và Deploy lên Vercel (Dữ liệu vĩnh viễn)

Chào bạn, tôi đã chuẩn bị sẵn các file cần thiết (`vercel.json`, `api/index.ts`) và cập nhật `server.ts` để ứng dụng của bạn có thể chạy được trên Vercel.

> **Lưu ý quan trọng về Dữ liệu:** Vercel là nền tảng Serverless, nó không cho phép lưu file (như `classroom.db`) trực tiếp trên ổ đĩa của nó một cách vĩnh viễn. Mỗi khi app khởi động lại, file này sẽ bị xóa. Do đó, bạn **BẮT BUỘC** phải chuyển sang dùng một Database đám mây (Cloud Database) nếu muốn dữ liệu được lưu vĩnh viễn.

---

## Bước 1: Đưa code lên GitHub

1.  **Tải code về máy:** Sử dụng tính năng "Export to ZIP" hoặc "Download" trong AI Studio.
2.  **Cài đặt Git:** Nếu máy bạn chưa có Git, hãy tải tại [git-scm.com](https://git-scm.com/).
3.  **Tạo Repository trên GitHub:**
    *   Truy cập [github.com](https://github.com/) và tạo một repo mới (ví dụ: `smart-classroom`).
4.  **Đẩy code lên:**
    *   Mở terminal tại thư mục code.
    *   Chạy lệnh:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/USERNAME/REPO_NAME.git
        git push -u origin main
        ```

---

## Bước 2: Thiết lập Database vĩnh viễn (Khuyên dùng Turso cho Vercel)

Vì Vercel là nền tảng Serverless, file `classroom.db` sẽ bị xóa mỗi khi app khởi động lại. Để lưu dữ liệu vĩnh viễn trên Vercel, bạn cần dùng **Turso** (Miễn phí và rất mạnh mẽ).

### Các bước với Turso:
1.  Đăng ký tài khoản tại [turso.tech](https://turso.tech/).
2.  Tạo một Database mới (ví dụ: `smart-classroom`).
3.  Lấy **Database URL** (dạng `libsql://...`) và **Auth Token**.
4.  Trên Vercel, vào phần **Settings** -> **Environment Variables** và thêm:
    *   `TURSO_DATABASE_URL`: (URL bạn vừa lấy)
    *   `TURSO_AUTH_TOKEN`: (Token bạn vừa lấy)

---

## Bước 3: Deploy lên Vercel

1.  Truy cập [vercel.com](https://vercel.com/) và kết nối tài khoản GitHub.
2.  Chọn dự án `smart-classroom` để Import.
3.  Đảm bảo đã thêm các biến môi trường ở Bước 2.
4.  Nhấn **Deploy**.

---

## Khắc phục lỗi thường gặp

### 1. Lỗi "Không thể kết nối đến máy chủ" (Cannot connect to server)
Nếu bạn gặp lỗi này sau khi deploy, nguyên nhân thường là:
*   **Chưa cấu hình Turso**: Bạn **bắt buộc** phải cấu hình Turso ở Bước 2 thì App mới chạy được trên Vercel.
*   **Lỗi biến môi trường**: Kiểm tra xem tên biến `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN` đã viết đúng hoa/thường chưa.
*   **Kiểm tra Logs**: Trên dashboard của Vercel, vào tab **Logs** để xem chi tiết lỗi server.

### 2. Lỗi Build trên Vercel
*   Đảm bảo bạn chọn Framework Preset là **Vite**.
*   Đảm bảo Node.js version là **18** hoặc **20**.

---

**Tôi đã cấu hình sẵn code để tương thích với cả Vercel và Railway. Bạn chỉ cần thực hiện các bước đẩy code lên GitHub là xong!**
