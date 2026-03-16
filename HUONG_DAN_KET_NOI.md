# Hướng Dẫn Xây Dựng Hệ Thống Quản Lý Lớp Học (Google Sheets + GAS)

Tài liệu này hướng dẫn cách thiết lập cơ sở dữ liệu trên Google Sheets và kết nối với ứng dụng thông qua Google Apps Script (GAS).

---

## 1. Cấu trúc các Sheet dữ liệu (Google Sheets)

Bạn cần tạo một file Google Spreadsheet mới và tạo các sheet với các cột tiêu đề (dòng 1) như sau:

### Sheet: `HocSinh`
Dùng để lưu trữ thông tin học sinh và tài khoản đăng nhập.
- **Cột:** `STT`, `HoTen`, `NgaySinh`, `GioiTinh`, `NoiSinh`, `CCCD`, `NoiO`, `SĐT`, `To`, `ChucVu`, `Sticker_Count`, `Username`, `Password`

### Sheet: `Log_Chung`
Dành cho Lớp trưởng/Bí thư báo cáo tình hình lớp.
- **Cột:** `Ngay`, `HocTap`, `PhongTrao`, `LuuY`, `TamSu`, `ThongBaoChung`, `GhiChep_ViecTot`, `GhiChep_ViPham`, `CreatedBy`

### Sheet: `Log_To`
Dành cho Tổ trưởng chấm điểm thành viên.
- **Cột:** `Ngay`, `To`, `TenHocSinh`, `HocTap`, `HoatDong`, `HoaDong`, `ChuyenCan`, `DongPhuc`, `NhanRieng_VoiThay`

### Sheet: `Log_CaNhan`
Dành cho học sinh tự đánh giá hàng ngày.
- **Cột:** `Ngay`, `TenHocSinh`, `Username`, `Diem_HT`, `Diem_HD`, `Diem_HoaDong`, `Diem_CC`, `Diem_DP`, `MachRieng`, `MucDoHanhPhuc`, `CanGapCo_KhanCap`

### Sheet: `PhanHoi_GVCN`
Dành cho giáo viên gửi phản hồi và sticker.
- **Cột:** `Ngay`, `TenHocSinh`, `Username`, `NoiDungPhanHoi`, `LoaiSticker`

---

## 2. Hướng dẫn kết nối Google Apps Script (GAS)

Để ứng dụng React có thể đọc/ghi dữ liệu vào Google Sheets, bạn cần một "cầu nối" API bằng GAS.

### Bước 1: Tạo Script
1. Trong file Google Sheets, chọn **Tiện ích mở rộng** > **Apps Script**.
2. Dán đoạn mã xử lý (doGet/doPost) để nhận yêu cầu từ Web App.

### Bước 2: Triển khai (Deploy)
1. Nhấn nút **Triển khai** (Deploy) > **Triển khai mới**.
2. Chọn loại là **Ứng dụng web** (Web App).
3. Cấu hình:
   - **Mô tả:** API Quản lý lớp học.
   - **Thực thi với tư cách:** Tôi (Email của bạn).
   - **Ai có quyền truy cập:** Bất kỳ ai (Anyone).
4. Nhấn **Triển khai**, sau đó sao chép **URL ứng dụng web**.

---

## 3. Kết nối với Giao diện (React)

Trong mã nguồn React, bạn sẽ thay thế các lời gọi API hiện tại (đang dùng SQLite) bằng URL của GAS.

### Ví dụ gọi API từ React:
```javascript
const GAS_URL = "URL_CUA_BAN_O_BUOC_TREN";

// Gửi dữ liệu
const response = await fetch(GAS_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'saveLog',
    data: logData
  })
});
```

---

## 4. Lưu ý về Google Drive
- Nếu bạn muốn lưu trữ minh chứng (hình ảnh/file), bạn có thể sử dụng API của Google Drive trong GAS để upload file vào một thư mục (Folder) cụ thể và lưu URL vào Google Sheets.
- Đảm bảo thư mục Drive đó được chia sẻ quyền "Bất kỳ ai có liên kết đều có thể xem" để hiển thị được trên ứng dụng.

---

**Lưu ý:** Phiên bản hiện tại của ứng dụng đang chạy trên **SQLite** để đảm bảo tốc độ và tính ổn định trong môi trường AI Studio. Nếu bạn muốn chuyển hẳn sang Google Sheets, hãy cập nhật các hàm `fetch` trong các file Dashboard để trỏ về URL GAS của bạn.
