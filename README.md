# Hành trình tỏa sáng

Website chiến dịch tạo ảnh vinh danh trực tiếp trên trình duyệt. Người dùng chọn
ảnh chân dung, nhập họ tên và tên trường, sau đó nhận ảnh PNG 1920 x 1080 để tải
về máy.

## Kiến trúc trải nghiệm

1. Hero toàn màn hình sử dụng artwork chiến dịch có sẵn.
2. Phần giới thiệu ngắn dẫn người dùng qua ba thao tác chính.
3. Máy in nghi lễ là trung tâm tương tác, gồm bốn điều khiển thật bằng HTML.
4. Canvas ghép chân dung, template, tên và trường ở độ phân giải gốc.
5. Giấy được đẩy ra khỏi khe bằng animation và chuyển sang màn hình tải ảnh.
6. Footer dẫn tới portfolio và GitHub của tác giả.

Ảnh chân dung chỉ tồn tại cục bộ trong tab trình duyệt. Website không tải ảnh hoặc
thông tin người dùng lên máy chủ.

## Chạy dự án

```powershell
npm install
npm run dev
```

## Kiểm tra

```powershell
npm run check
```

Mỗi lần push lên nhánh `main` hoặc mở pull request, GitHub Actions sẽ tự chạy
lint, unit test và production build. Dependabot kiểm tra dependency mới vào mỗi
thứ Hai và tạo pull request khi có bản cập nhật.

## Làm việc với GitHub Desktop

1. Mở GitHub Desktop và chọn **File > Add local repository**.
2. Chọn thư mục dự án này.
3. Chọn **Publish repository**, đặt tên repository và chọn Public hoặc Private.
4. Sau mỗi lần chỉnh sửa, kiểm tra danh sách file, nhập Summary, chọn
   **Commit to main**, sau đó chọn **Push origin**.
5. Theo dõi kết quả tự động trong tab **Actions** trên GitHub.

Không commit `node_modules`, `dist`, log hoặc báo cáo Lighthouse. Các mục này đã
được loại trừ trong `.gitignore`.

## Công nghệ

- Vite, React và TypeScript
- Motion cho animation trạng thái và scroll reveal
- Canvas API cho ảnh xuất 1920 x 1080
- Phosphor Icons
- Be Vietnam Pro và Noto Serif được self-host

Toàn bộ tương tác trình duyệt có nhánh `prefers-reduced-motion`, hỗ trợ bàn phím,
validation nội tuyến và bố cục một cột trên mobile.
