# PrismSnap AI 🌈📸

> **AI-Powered Hand-Gesture Camera with Holographic Prism Overlay**
> A 100% client-side, serverless web application that turns your hands into a dynamic camera lens.

---

## 🌟 Giới thiệu Dự án

**PrismSnap AI** là một ứng dụng Web máy ảnh độc đáo chạy trực tiếp trên trình duyệt của người dùng. Bằng cách sử dụng mô hình trí tuệ nhân tạo **MediaPipe Hands**, ứng dụng tự động nhận diện và vẽ các đường nối nối đầu ngón trỏ và ngón cái của cả hai bàn tay để tạo thành một **khung hình tứ giác** trực quan.

Khi người dùng giữ khung hình đứng yên trong **2 giây**, hệ thống sẽ tự động chụp ảnh toàn màn hình bao gồm cả luồng camera trực tiếp, các đường chỉ tay, và lớp phủ **lăng kính sắc màu (Prism Mask)** nghệ thuật ở xung quanh khung chụp.

Dự án được viết hoàn toàn trên nền tảng **React (TypeScript)**, **Vite**, và **Canvas 2D**, tối ưu hóa tuyệt đối để có thể triển khai (deploy) trực tiếp lên **GitHub Pages** mà không cần bất kỳ máy chủ backend nào.

---

## 🚀 Tính năng nổi bật

- **Khung chụp Tứ giác Động (Quadrilateral Framing)**: Kết nối ngón trỏ với ngón trỏ, ngón cái với ngón cái tạo thành khung chụp xoay chuyển tự do theo cử chỉ tay của người dùng.
- **Mặt nạ Lăng kính Sắc màu (Holographic Prism Mask)**: Lớp phủ gradient cầu vồng mờ ảo bên ngoài khung chụp, tự động cắt rỗng (cutout) vùng bên trong khung để làm nổi bật chủ thể chính.
- **Tự động chụp khi đứng yên (Auto-shutter Countdown)**: Phân tích độ ổn định của khung tay thông qua lịch sử tọa độ trượt (Sliding Coordinate History). Khi đứng yên đủ 2 giây, hệ thống tự kích hoạt chụp ảnh kèm hiệu ứng đèn nháy màn trập và âm thanh click.
- **Xuất ảnh kết hợp đầy đủ hiệu ứng (Composite Capturing)**: Bức ảnh chụp tải về sẽ lưu giữ nguyên vẹn luồng camera, các nét vẽ chỉ ngón tay và màu sắc lăng kính sắc màu giống hệt giao diện thực tế.
- **Giao diện tối giản (Minimalist Design)**: Thiết kế tràn viền (fullscreen capture) tinh tế, loại bỏ mọi chi tiết thừa để người dùng tập trung hoàn toàn vào ống kính.

---

## 🛠️ Công nghệ sử dụng

- **Core**: React 18, TypeScript, Vite
- **AI Hand Tracking**: MediaPipe Hands (Tải trực tiếp qua JSDelivr CDN ổn định)
- **Rendering**: HTML5 Canvas 2D API (Sử dụng `globalCompositeOperation = 'destination-out'` để cắt rỗng mặt nạ lăng kính)
- **Styling**: Vanilla CSS (Cyber-minimalist, hiệu ứng flash màn trập)
- **Icons**: Lucide React

---

## 📁 Cấu trúc thư mục

Dự án được phân chia mô-đun hóa rõ ràng để dễ kiểm soát và mở rộng:

```text
PIC_Hand/
├── public/
├── src/
│   ├── components/
│   │   └── PreviewModal.tsx   # Hộp thoại xem trước và tải ảnh chụp
│   ├── utils/
│   │   ├── math.ts            # Xử lý xoay góc nghiêng & ánh xạ tọa độ màn hình
│   │   └── drawing.ts         # Xử lý vẽ canvas đè, mặt nạ lăng kính, nét nối ngón tay
│   ├── App.tsx                # Quản lý luồng webcam, dự đoán AI và trạng thái chụp
│   ├── App.css                # Kiểu dáng tối giản toàn màn hình & flash màn trập
│   ├── index.css              # Reset mặc định & token màu sắc hệ thống
│   └── main.tsx               # Khởi tạo React
├── index.html                 # Chứa thẻ script CDN tải MediaPipe Hands
├── vite.config.ts             # Cấu hình Vite hỗ trợ tương thích đường dẫn tương đối (./)
└── package.json
```

---

## 💻 Hướng dẫn Cài đặt & Chạy Cục bộ

Yêu cầu máy của bạn đã cài đặt sẵn [Node.js](https://nodejs.org/).

1. **Tải các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

2. **Chạy server phát triển cục bộ**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập vào đường dẫn mặc định: `http://localhost:5173/`

3. **Biên dịch và kiểm tra đóng gói sản phẩm**:
   ```bash
   npm run build
   ```
   Các tệp tối ưu hóa sẽ được tạo ra tại thư mục `dist/` để bạn có thể tải thẳng lên GitHub Pages, Vercel hoặc Netlify.

---

## 📸 Cách sử dụng

1. Truy cập trang web và cấp quyền sử dụng Webcam của trình duyệt.
2. Đưa cả 2 bàn tay lên trước camera.
3. Điều chỉnh khoảng cách ngón tay để tạo khung hình chữ nhật/tứ giác bao quanh chủ thể cần chụp. Bạn có thể nghiêng, xoay hoặc di chuyển tay tự do.
4. Giữ khung tay của bạn đứng yên trong **2 giây**. Vòng tròn đếm ngược sẽ hiển thị ở tâm khung và tự động chụp.
5. Xem trước sản phẩm ở hộp thoại xuất hiện, bấm **Tải xuống** để lưu ảnh chụp hoặc **Đóng** để tiếp tục chụp tấm tiếp theo!
