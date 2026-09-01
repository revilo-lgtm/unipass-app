# 🛡️ Báo Cáo Kiến Trúc Bảo Mật Hệ Thống UniPass
**Môn học:** Bảo mật Thông tin trong Thương mại Điện tử (E-Commerce Security)  
**Dự án:** UniPass - Nền tảng phân phối Giáo trình & Tài liệu số

---

## 1. Tóm tắt Đồ án
UniPass là hệ thống Thương mại Điện tử chuyên biệt dành cho việc phân phối tài liệu, giáo trình số. Khác với các sản phẩm vật lý, tài liệu số đối mặt với rủi ro cực lớn về **Vi phạm bản quyền (Piracy)** và **Tấn công hệ thống xác thực**. 

Để giải quyết bài toán này, dự án UniPass đã được thiết kế và triển khai áp dụng mô hình bảo mật đa lớp (Defense in Depth), tuân thủ các nguyên tắc cốt lõi của an toàn thông tin: **Tính bảo mật (Confidentiality), Tính toàn vẹn (Integrity) và Tính sẵn sàng (Availability).**

---

## 2. Các Tính Năng Bảo Mật Nổi Bật (Key Features)

### 2.1. Tuân thủ chuẩn PCI-DSS (Bảo mật Thanh toán)
Trong TMĐT, việc tự lưu trữ thông tin thẻ tín dụng của khách hàng mang lại rủi ro pháp lý và an ninh rất lớn.
- **Giải pháp:** UniPass hoàn toàn không lưu trữ (No-store) bất kỳ dữ liệu nhạy cảm nào liên quan đến thẻ ngân hàng. Quá trình thanh toán được ủy quyền cho các Cổng thanh toán (Payment Gateway) bên thứ 3.
- **Xác thực Giao dịch (Webhook Signature):** Để chống lại việc Hacker giả mạo request thanh toán thành công (Spoofing), endpoint API xử lý giao dịch (`/api/webhook/payment`) sử dụng thuật toán mã băm **HMAC SHA-256**. Hệ thống chỉ ghi nhận đơn hàng khi mã Signature từ Gateway gửi về khớp hoàn toàn với mã băm sinh ra từ Secret Key của Server. Đảm bảo tuyệt đối **Tính toàn vẹn (Integrity)** của giao dịch.

### 2.2. Kiến trúc Stateful JWT (Quản lý Phiên đăng nhập)
Thông thường, JSON Web Token (JWT) là Stateless, nghĩa là Server không thể chủ động thu hồi Token trước khi nó hết hạn nếu Token bị lộ lọt.
- **Giải pháp Stateful:** UniPass lưu trữ Token đang active vào bảng `sessions` tại cơ sở dữ liệu. Nhờ đó, hệ thống có khả năng:
  - **Buộc đăng xuất (Revoke Token):** Ngay lập tức vô hiệu hóa Token khi phát hiện nghi vấn hoặc khi người dùng đổi mật khẩu.
  - **Chống chia sẻ tài khoản (Account Sharing):** Giới hạn số lượng thiết bị đăng nhập đồng thời (`MAX_ACTIVE_SESSIONS`). Nếu thiết bị thứ 2 đăng nhập, thiết bị cũ sẽ tự động bị đá văng (vô hiệu hóa token trong DB).

### 2.3. Phòng chống Brute-Force & Credential Stuffing nhiều lớp
Hệ thống sử dụng cơ chế bảo vệ 2 lớp kết hợp giữa Mức Mạng và Mức Cơ sở dữ liệu:
- **Lớp 1 - Khóa Thiết Bị (Device/IP Lockout):** Sử dụng `express-rate-limit`, hệ thống đếm số lần đăng nhập thất bại theo `deviceId` hoặc IP. Nếu vượt quá ngưỡng 10 lần (do quét tự động hoặc Script), thiết bị đó sẽ bị từ chối phục vụ (HTTP 429) trong 15 phút, bảo vệ **Tính sẵn sàng (Availability)** của máy chủ.
- **Lớp 2 - Khóa Tài Khoản (Account Lockout):** Nếu kẻ gian đổi IP liên tục nhưng vẫn nhắm vào 1 tài khoản duy nhất, Database sẽ tự động khóa tài khoản đó (HTTP 423) nếu nhập sai mật khẩu 5 lần, chống lại triệt để tấn công Brute-Force.
- **Chính sách mật khẩu mạnh:** Yêu cầu mật khẩu phải chứa chữ hoa, chữ thường, số, và ký tự đặc biệt.

### 2.4. Quản lý Bản quyền Số (DRM - Digital Rights Management)
Việc bảo vệ tài sản số (PDF) là yếu tố sống còn của một dự án bán tài liệu.
- **Dynamic Server-side Watermarking:** Thay vì dùng CSS hoặc HTML để chèn mờ lên file PDF (rất dễ bị Hacker xóa thông qua Developer Tools), UniPass sử dụng thư viện `pdf-lib` can thiệp trực tiếp vào mã Binary của file PDF ở Backend. Tên, Email và Địa chỉ IP của người mua sẽ được in chìm lên mọi trang tài liệu trước khi trả về (Stream) cho client.
- **Tính chống chối bỏ (Non-repudiation):** Nếu tài liệu bị tuồn lên mạng, quản trị viên dễ dàng truy vết được nguồn gốc rò rỉ.
- **Client-side Event Tracking:** Lắng nghe và chặn các thao tác nhạy cảm (Ctrl+S, Ctrl+P, F12, Right-click). Nếu phát hiện cố tình thao tác, hệ thống tự động ghi Log giám định (Forensic Logs) về máy chủ.

### 2.5. Bảo vệ phía Client (Web Hardening & File Upload)
- **Kiểm soát Tải lên (Strict Upload Validation):** Lỗ hổng cho phép upload file mã độc (`.php`, `.sh`) giả danh PDF đã bị chặn đứng hoàn toàn. Hệ thống xác thực chính xác đuôi mở rộng `.pdf` VÀ chuẩn MIME Type `application/pdf` ở tầng Multer trước khi lưu file vào ổ cứng.
- **Content Security Policy (CSP):** Cấu hình chặt chẽ các Headers qua thư viện `helmet` để ngăn chặn trình duyệt chạy các script ngoại lai (Mitigate XSS Attacks).
- **CORS Configuration:** Khóa chặt chính sách Cross-Origin, chỉ cho phép luồng dữ liệu xuất phát từ các Domain đáng tin cậy.

---

## 3. Kết luận
Dự án **UniPass** không chỉ đáp ứng được các chức năng nghiệp vụ của một sàn TMĐT cơ bản mà còn sở hữu một nền tảng kiến trúc bảo mật cực kỳ vững chắc, giải quyết trực diện các bài toán khó nhất trong thương mại điện tử tài liệu số: Chống giả mạo thanh toán, Chống thất thoát bản quyền (DRM) và Bảo vệ định danh người dùng.
