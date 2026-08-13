# Kết nối Bảng Vàng với Google Drive

Frontend không thể upload an toàn chỉ bằng link thư mục Drive. Gói Apps Script này đóng vai trò lớp API chạy dưới tài khoản Google của chủ chiến dịch; ID thư mục nằm trong **Script Properties** và không xuất hiện trong GitHub hay bundle website.

Website gửi dữ liệu ghi/xóa bằng form ẩn và nhận phản hồi qua `top.postMessage`. Apps Script bật `XFrameOptionsMode.ALLOWALL`, còn frontend chỉ nhận phản hồi từ origin Google và request ID ngẫu nhiên. Danh sách Bảng Vàng là dữ liệu công khai của chiến dịch nên được đọc bằng JSONP, cơ chế tương thích chéo miền chính thức của Apps Script Content Service. Cách này không phụ thuộc CORS và hoạt động ổn định trên Chrome/mobile.

## Thiết lập

1. Mở [Google Apps Script](https://script.google.com/) và tạo dự án mới.
2. Dán nội dung `Code.gs` vào file mã nguồn. Bật hiển thị manifest trong Project Settings rồi thay `appsscript.json` bằng file cùng tên trong thư mục này.
3. Trong **Project Settings → Script Properties**, thêm:
   - Property: `GOLDEN_BOARD_FOLDER_ID`
   - Value: chỉ phần ID nằm giữa `/folders/` và dấu `?` trong link Google Drive.
4. Chọn **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Cấp quyền Drive, sao chép URL triển khai kết thúc bằng `/exec`.
6. Tạo `.env.local` ở thư mục gốc website:

   ```env
   VITE_GOLDEN_BOARD_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

7. Khởi động lại `npm run dev`.

Sau mỗi lần sửa `Code.gs`, mở **Deploy → Manage deployments → Edit**, chọn **New version** rồi **Deploy**. Chỉ lưu code mà không cập nhật deployment sẽ khiến URL `/exec` tiếp tục chạy phiên bản cũ.

Bản ghi Bảng Vàng có trường `educationLevel` với hai giá trị `university` và `high-school` để frontend chia thành hai dãy. Dữ liệu cũ chưa có trường này tự động được xem là `university`, nên không cần sửa thủ công file index.

Không đặt folder ID, link Drive, OAuth token hoặc tài khoản dịch vụ trong `.env` của Vite vì mọi biến `VITE_*` đều được đưa vào bundle phía trình duyệt. Endpoint Apps Script là URL công khai theo thiết kế; quyền Drive vẫn chỉ tồn tại ở Apps Script.

## Dữ liệu được tạo trong Drive

- `001-nguyen-van-a-ABCD-portrait.jpg`
- `001-nguyen-van-a-ABCD-vinh-danh.png`
- `_bang-vang-index.json`

Mã bốn chữ không được ghi trực tiếp vào index; Apps Script lưu SHA-256 kèm salt riêng trong Script Properties. Khi xóa thành công, hai file ảnh được chuyển vào thùng rác và bản ghi được gỡ khỏi index. Ảnh chân dung vẫn giữ quyền của thư mục Drive; Apps Script đọc ảnh và phục vụ cho Bảng Vàng, nên script không cần gọi `setSharing(ANYONE_WITH_LINK)`—thao tác có thể bị quản trị viên Google Workspace chặn.

Nếu một phiên bản cũ đã tạo file ảnh rồi dừng trước khi ghi index, lần đồng bộ lại với cùng số thứ tự, họ tên và mã sẽ tái sử dụng file đó thay vì tạo bản sao.

Sau 5 lần nhập sai mã xóa liên tiếp, đề danh bị khóa xác nhận trong 15 phút để giảm nguy cơ dò mã. Mã 4 chữ được thiết kế theo yêu cầu chiến dịch và phù hợp cho quản lý nhẹ; nếu dùng trong môi trường có rủi ro phá hoại cao, nên bổ sung đăng nhập quản trị thay cho mã ngắn.
