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

## Bước 2: Thiết lập Database vĩnh viễn (Khuyên dùng Railway)

Vì ứng dụng của bạn đang sử dụng SQLite, cách đơn giản nhất để giữ lại toàn bộ dữ liệu mà không cần sửa code là sử dụng **Railway.app**.

### Tại sao chọn Railway thay vì Vercel?
*   Railway hỗ trợ **Persistent Volume** (Ổ đĩa vĩnh viễn), cho phép file `classroom.db` của bạn tồn tại mãi mãi.
*   Vercel không hỗ trợ việc này (bạn sẽ phải học cách dùng Turso hoặc Supabase và sửa lại toàn bộ code xử lý Database).

### Các bước với Railway:
1.  Đăng ký tài khoản tại [railway.app](https://railway.app/).
2.  Chọn **New Project** -> **Deploy from GitHub repo**.
3.  Chọn repo `smart-classroom` của bạn.
4.  Trong phần **Settings** của Railway, tìm mục **Volumes** và tạo một Volume mới.
5.  Gắn Volume đó vào đường dẫn `/app` (hoặc nơi chứa file `.db`).
6.  Thêm biến môi trường `DATABASE_PATH` trỏ tới `/app/classroom.db`.

---

## Bước 3: Nếu bạn vẫn muốn dùng Vercel (Dữ liệu sẽ bị mất mỗi khi deploy)

Nếu bạn chỉ muốn demo và không quan trọng việc mất dữ liệu:
1.  Truy cập [vercel.com](https://vercel.com/) và kết nối tài khoản GitHub.
2.  Chọn dự án `smart-classroom` để Import.
3.  Nhấn **Deploy**.
4.  **Lưu ý:** Mỗi lần bạn cập nhật code hoặc Vercel khởi động lại server, dữ liệu học sinh/điểm số sẽ quay về trạng thái ban đầu (Seeding).

---

**Tôi đã cấu hình sẵn code để tương thích với cả Vercel và Railway. Bạn chỉ cần thực hiện các bước đẩy code lên GitHub là xong!**
