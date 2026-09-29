# New Green — bản thiết kế giao diện

Mở `index.html` bằng trình duyệt để xem bản demo tĩnh. Không cần cài package, không dùng API hoặc dữ liệu Google Sheet. Font từ Google Fonts là tùy chọn; nếu ngoại tuyến, giao diện dùng font hệ thống.

## Các màn hình

1. Trang chủ: giới thiệu, 10 nhóm món, chọn một trong 5 trường, đường dẫn vào thực đơn.
2. Danh mục món ăn: lọc 10 nhóm, tìm tên, xem thông tin món. Dữ liệu lô không hiển thị ở đây vì lô chỉ xác định theo trường, ngày và bữa thực tế.
3. Thực đơn theo trường: đổi trường, chuyển tuần/chọn ngày, xem các bữa đã công bố và từng món; ngày 29–30/09/2026 có dữ liệu mẫu.
4. Nguồn gốc món: bấm **Xem nguồn gốc** ngay trong thực đơn để mở bảng chi tiết nguyên liệu → lô → nhà cung cấp → chứng từ. URL `#truy-xuat/...` mở trực tiếp bảng này và có thể sao chép.

`#...` là tuyến demo để một file HTML chạy được ở máy cá nhân. Khi code bằng Next.js, dùng URL thật theo `KE-HOACH-NODEJS.md`: `/truong/[schoolSlug]`, `/truong/[schoolSlug]/ngay/[yyyy-mm-dd]` và `/truy-xuat/[publicToken]`. Dữ liệu trên màn hình và QR giả đều được đánh dấu minh hoạ; không dùng mã lô/chứng từ này trong sản phẩm vận hành.

## Đối chiếu khi chuyển thành code thật

- Danh mục lấy từ `dish_categories`, `dishes`; ảnh và năng lượng lấy từ dữ liệu đã được duyệt, không dùng emoji làm dữ liệu thật.
- Trang trường/ngày chỉ lấy bữa `PUBLISHED`; ngày không có bản công bố hiển thị trống, không lộ bản nháp.
- Nút nguồn gốc nhận token của snapshot bữa thực tế; món hiển thị các `meal_allocations` của đúng bữa, không lấy lô hiện tại từ danh mục chung.
- Chứng từ chỉ có link thật khi còn hiệu lực và cờ công khai đã được duyệt. Token sai/thu hồi trả 404.
- Admin nhập và sửa dữ liệu trên tuyến `/admin/*` của kế hoạch Node.js; bản demo này mô tả phía người xem, không giả lập thao tác ghi.

## Kiểm tra thiết kế

- Mở trang chủ, chuyển sang danh mục, lọc một nhóm và tìm một món.
- Mở trường Ánh Dương, chọn ngày 29/09/2026, bấm **Xem nguồn gốc** tại “Gà kho gừng”; đóng bằng nút hoặc Escape.
- Đổi trường, chuyển ngày 30/09/2026, thử một ngày khác để xem trạng thái trống; mở lại liên kết `#truy-xuat/...` trực tiếp.
- Kiểm tra màn hình rộng và điện thoại, điều hướng bàn phím, nhãn nút và màu chữ.
