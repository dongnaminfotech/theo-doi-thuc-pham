# Kế hoạch triển khai New Green bằng Node.js

Phiên bản kế hoạch: 2026-09-29. Tài liệu này là đặc tả để code phiên bản mới; các URL Apps Script hiện tại tiếp tục hoạt động cho đến khi bản Node.js qua nghiệm thu và được chuyển hướng. Không dùng dữ liệu thật để thử nghiệm.

## 1. Mục tiêu và phạm vi

- Một cổng quản trị để nhập và cập nhật trường học, nhóm món, món ăn, nguyên liệu, định lượng, nhà cung cấp, chứng từ, phiếu nhập, lô hàng, thực đơn và bữa ăn theo ngày.
- Mỗi trường có một URL công khai cố định. Phụ huynh chọn ngày, xem các bữa và từng món; từ món mở được nguyên liệu, lô, nhà cung cấp và chứng từ đã được duyệt công bố.
- Quản trị viên nhìn cùng dữ liệu theo trường/ngày, sửa bản nháp, xuất kho và công bố. Mỗi thay đổi quan trọng có người thực hiện và thời điểm.
- Phạm vi ban đầu: 5 trường, tối thiểu 10 nhóm hoặc loại món có thể cấu hình; thiết kế không giới hạn cứng số trường và số món.
- Chuyển dữ liệu hợp lệ từ Google Sheet New Green hiện có sang PostgreSQL; giữ ID cũ trong bảng ánh xạ và đối chiếu số liệu. Google Sheet chỉ là nguồn nhập một lần trong giai đoạn chuyển đổi, không phải cơ sở dữ liệu vận hành của bản Node.js.

## 2. Kiến trúc chốt để code

| Thành phần | Lựa chọn | Trách nhiệm |
|---|---|---|
| Ứng dụng | Node.js LTS, TypeScript, Next.js chạy Node runtime | Trang admin, trang công khai và API trong một mã nguồn |
| Dữ liệu | PostgreSQL, Prisma Migrate | Giao dịch nhập/xuất, ràng buộc và truy vấn theo trường/ngày |
| Đăng nhập admin | Google OAuth qua Auth.js, session trong DB | Xác định email Google; đối chiếu tài khoản ACTIVE trong bảng users |
| Tệp ảnh/chứng từ | Kho đối tượng S3 compatible, lưu metadata trong DB | Ảnh bữa ăn và bản chứng từ được phép công bố; khóa truy cập tệp gốc |
| Giao diện | React, CSS responsive, tiếng Việt | Admin desktop/mobile; trang trường và ngày dùng tốt trên điện thoại |
| Hạ tầng | Docker Compose: web + PostgreSQL; Nginx/HTTPS phía trước | Một cấu hình staging và một cấu hình production, backup và health check |

Không tạo quyền quản trị tự động từ email người triển khai. Lệnh `admin:bootstrap --email=<email>` chỉ chạy thủ công một lần với email được chủ dự án chấp thuận; từ đó SUPER_ADMIN cấp quyền cho người khác trong giao diện. Email không thuộc allowlist hoặc `status != ACTIVE` nhận 403 cùng hướng dẫn liên hệ quản trị, không tạo user ngầm. Mọi API admin kiểm tra session trên server và kiểm tra phạm vi trường tại truy vấn/ghi; không tin `schoolId` do trình duyệt gửi.

## 3. Vai trò và quyền

| Vai trò | Phạm vi | Quyền chính |
|---|---|---|
| SUPER_ADMIN | Toàn hệ thống | Người dùng, trường, danh mục, kho, thực đơn, công bố, audit |
| SCHOOL_ADMIN | Các trường được gán | Danh mục/nhà cung cấp theo chính sách chung; lập và sửa bữa, duyệt, công bố trong trường |
| KITCHEN | Các trường được gán | Lập bữa và món, xác nhận chế biến/ảnh; không cấp quyền và không công bố |
| WAREHOUSE | Các trường được gán | Nhập lô, xem tồn, xuất và điều chỉnh có lý do; không công bố |
| AUDITOR | Các trường được gán | Chỉ xem admin, nguồn gốc, số liệu, audit |
| Khách | Công khai | Chỉ xem bản ghi PUBLISHED và ảnh/chứng từ được đánh dấu công khai |

Một user có thể được gán nhiều trường qua `user_schools`. `SUPER_ADMIN` không cần bản ghi gán trường. Quyền sửa danh mục dùng chung mặc định chỉ thuộc SUPER_ADMIN; SCHOOL_ADMIN chỉ sửa dữ liệu riêng của trường. Mọi API trả 403 nếu không đủ quyền và 404 nếu tài nguyên ngoài phạm vi để tránh lộ sự tồn tại của dữ liệu.

## 4. URL và màn hình

| URL | Người dùng | Nội dung |
|---|---|---|
| `/admin` | Có quyền | Tổng quan hôm nay, trường, bữa thiếu dữ liệu, tồn kho cảnh báo |
| `/admin/truong` và `/admin/truong/[id]` | Quản trị | Danh sách, tạo/sửa, slug, trạng thái và URL công khai |
| `/admin/truong/[id]/ngay/[yyyy-mm-dd]` | Người được gán | Lịch ngày của trường; tạo/sửa bữa, món, số suất, ảnh, trạng thái |
| `/admin/thuc-don/tuan` | Bếp/quản trị | Mẫu tuần, sao chép hoặc sinh bữa cho tuần; không ghi đè ngày đã có bữa |
| `/admin/danh-muc/...` | Quản trị | Nhóm món, món, nguyên liệu, công thức, nhà cung cấp, chứng từ |
| `/admin/kho/...` | Kho/quản trị | Phiếu nhập, lô, hạn dùng, tồn, xuất và lịch sử điều chỉnh |
| `/admin/nguoi-dung` | SUPER_ADMIN | Mời/cấp quyền, gán trường, khóa tài khoản |
| `/admin/nhat-ky` | Quản trị/auditor | Lọc audit theo trường, ngày, người và đối tượng |
| `/truong/[schoolSlug]` | Công khai | Trường, ngày mặc định theo `Asia/Ho_Chi_Minh`, chọn ngày, các bữa đã công bố |
| `/truong/[schoolSlug]/ngay/[yyyy-mm-dd]` | Công khai | Các bữa, từng món, ảnh; chuyển ngày trước/sau và chọn ngày |
| `/truy-xuat/[publicToken]` | Công khai | Snapshot của một bữa: món → nguyên liệu → lô → NCC → chứng từ công khai |

`schoolSlug` duy nhất, không đổi sau khi in QR (nếu đổi phải tạo 301 từ slug cũ). `publicToken` là giá trị ngẫu nhiên dài, không dùng ID tăng dần. Link QR của trường trỏ `/truong/[schoolSlug]`; QR của bữa trỏ `/truy-xuat/[publicToken]`. Ngày không hợp lệ trả 400/404 thân thiện. Trường bị vô hiệu hóa và ngày chưa công bố không hiện dữ liệu nội bộ; trang ngày hợp lệ nhưng chưa có bữa công bố hiển thị trạng thái trống. Metadata SEO chỉ sinh cho trang công khai hợp lệ; admin đặt `noindex`.

### Trải nghiệm ngày và món

1. Ở trang trường, thanh chọn ngày mặc định hôm nay theo giờ Việt Nam; dải thứ Hai–Chủ nhật thể hiện thứ/ngày và nút tuần trước/sau.
2. Ngày hiển thị theo bữa sáng/trưa/xế/tối (loại bữa cấu hình được); từng thẻ bữa có số suất, trạng thái công bố, ảnh và danh sách món theo thứ tự.
3. Bấm món mở chi tiết thành phần, lượng dùng, từng lô và NCC; trên admin hiển thị cả trạng thái kiểm tra, trên public chỉ dữ liệu snapshot đã công bố.
4. Trên mobile dùng danh sách một cột, nút chọn ngày rõ ràng, ảnh có mô tả, đường dẫn quay lại trường/ngày. Loading, trống và lỗi có nội dung tiếng Việt.

## 5. Mô hình dữ liệu và ràng buộc

| Nhóm bảng | Trường cốt lõi/ràng buộc |
|---|---|
| `users`, `user_schools` | email chuẩn hóa duy nhất; role, status; cặp `(user_id, school_id)` duy nhất |
| `schools`, `school_slug_history` | mã trường và slug duy nhất; tên, địa chỉ, trạng thái |
| `dish_categories`, `dishes`, `ingredients`, `recipes` | nhóm món tùy chỉnh; công thức `(dish_id, ingredient_id)` duy nhất; `qty_per_serving > 0`, `waste_percent >= 0` |
| `suppliers`, `supplier_documents` | NCC, loại/số chứng từ, ngày cấp/hết hạn, `storage_key`, trạng thái kiểm duyệt và cờ công khai |
| `receipts`, `receipt_items`, `lots` | phiếu, lô, nguyên liệu, NCC, ngày nhập/sản xuất/hết hạn, lượng dương, đơn vị chuẩn |
| `inventory_transactions` | sổ cộng/trừ bất biến, số lượng dương, loại, tham chiếu và idempotency key duy nhất; không sửa/xóa trực tiếp |
| `meal_plans`, `meal_dishes`, `meal_allocations` | trường, ngày, loại bữa, suất, trạng thái; thứ tự món; phân bổ lô cho nguyên liệu |
| `weekly_menu_templates` | trường, thứ trong tuần, loại bữa, món, hiệu lực và trạng thái |
| `trace_snapshots` | meal, token, version, JSON đã lọc, thời điểm/người công bố; chỉ thêm phiên bản, không sửa bản cũ |
| `audit_logs`, `migration_maps` | actor, action, đối tượng, trước/sau đã loại bí mật; ánh xạ `(source_table, source_id)` duy nhất |

Các cột chung `id UUID`, `created_at`, `updated_at`; quan hệ có FK và index cho `(school_id, meal_date)`, `(ingredient_id, expiry_date)`, token và mã lô. Số lượng dùng `numeric(18,6)`, tiền `numeric(18,2)`, không dùng float để lưu. Thời điểm lưu UTC; ngày nghiệp vụ là `date` theo `Asia/Ho_Chi_Minh`. Dữ liệu có tham chiếu không được hard delete; dùng `status`/`archived_at`. Đơn vị công thức, nhập và xuất phải quy đổi về `base_unit` trước khi tính.

Trạng thái bữa: `DRAFT → READY → ISSUED → COMPLETED → PUBLISHED`; có thể trả `READY → DRAFT` trước khi xuất. Sau `ISSUED` không sửa công thức/số suất trực tiếp; điều chỉnh bằng nghiệp vụ hoàn trả/xuất bổ sung có audit. Sau `PUBLISHED`, thay đổi chỉ qua phiên bản sửa đổi và công bố lại, giữ snapshot trước. Mọi chuyển trạng thái kiểm tra quyền, dữ liệu bắt buộc và phiên bản hiện tại.

## 6. Luồng admin và quy tắc nghiệp vụ

### Tạo và cập nhật bữa theo trường/ngày

1. Admin chọn trường được cấp quyền, chọn ngày và loại bữa. API kiểm tra trường tồn tại/ACTIVE, ngày đúng và `(school_id, meal_date, meal_type)` không trùng; nếu mô hình cho nhiều bữa cùng loại phải có `slot_code` riêng.
2. Chọn món từ danh mục ACTIVE, thứ tự món và số suất dương. Công thức lấy theo phiên bản tại thời điểm chốt bữa để thay đổi danh mục sau này không làm đổi lượng đã xuất.
3. Lưu bản nháp trong một transaction; dùng `version` hoặc `updated_at` để báo xung đột khi hai admin sửa cùng lúc. Lịch hiển thị tức thời sau lưu, có audit trường thay đổi.
4. `READY` chỉ khi có ít nhất một món, công thức hợp lệ, số suất và thông tin bắt buộc. Giao diện cảnh báo nguyên liệu thiếu/hết hạn trước khi xuất.

### Nhập và xuất kho

1. Phiếu nhập ghi phiếu, dòng, lô và giao dịch IN trong một DB transaction. Chặn mã lô trùng trong phạm vi NCC/nguyên liệu; kiểm tra ngày và số lượng, không chấp nhận HSD trước ngày nhập.
2. Khi xuất bữa, khóa các lô ứng viên theo thứ tự ổn định trong transaction; chỉ lấy lô còn tồn, HSD không trước ngày bữa, sắp FEFO (HSD sớm nhất rồi ngày nhập rồi ID). Cộng nhu cầu cùng nguyên liệu từ tất cả món để chống cấp phát lặp.
3. Nếu tổng tồn không đủ, rollback toàn bộ; không có dòng OUT hoặc allocation dở dang. Nếu đủ, phân bổ theo từng món/lô, ghi OUT và chuyển `ISSUED` atomically. Idempotency key và unique reference chặn bấm hai lần/retry tạo xuất trùng.
4. Tồn = tổng IN + RETURN + ADJUST_IN − OUT − ADJUST_OUT; phải `>= 0` trong transaction. Điều chỉnh có lý do và quyền kho/quản trị; không sửa sổ cũ.

### Hoàn thành và công bố

1. Bếp tải ảnh món/bữa qua URL ký ngắn hạn; server kiểm tra loại MIME, dung lượng, quét/kiểm tra định dạng, lưu object key. `COMPLETED` đòi ít nhất một ảnh hợp lệ và đã `ISSUED`.
2. Người có quyền công bố kiểm tra danh sách món, lô, NCC, chứng từ còn hiệu lực tại ngày bữa và cờ cho phép công khai. Chứng từ riêng tư không đưa URL gốc vào response công khai.
3. Trong transaction, tạo snapshot JSON chứa tên trường, ngày/bữa, món, định lượng, lô, NCC, chứng từ được duyệt, ảnh và `version`; cập nhật trạng thái `PUBLISHED`, `published_at`, token. Snapshot là nguồn dữ liệu duy nhất của API public; sửa danh mục hoặc NCC sau đó không âm thầm đổi bản công bố.
4. Công bố lại tạo version mới, giữ lịch sử và ghi lý do; token có thể giữ URL ổn định trỏ bản hiện hành, API lịch sử chỉ dành admin. Thu hồi công bố cần quyền và lý do, public ngừng trả nội dung ngay; audit ghi đầy đủ.

## 7. Hợp đồng API tối thiểu

Tất cả admin API dưới `/api/admin/*` cần session, CSRF protection cho mutation, Zod validation, RBAC và school scope; lỗi có `{code,message,details?,requestId}`. Danh sách có pagination và lọc. `PATCH` cần version/If-Match; mutation kho/công bố cần `Idempotency-Key`.

| Phương thức + đường dẫn | Ý nghĩa |
|---|---|
| `GET/POST /api/admin/schools`, `GET/PATCH /api/admin/schools/:id` | Trường và slug |
| `GET/POST/PATCH /api/admin/categories`, `/dishes`, `/ingredients`, `/recipes`, `/suppliers`, `/documents` | Danh mục và chứng từ |
| `GET/POST /api/admin/receipts`, `GET /api/admin/lots`, `GET /api/admin/stock` | Nhập, lô và tồn |
| `GET/POST /api/admin/schools/:id/days/:date/meals`, `GET/PATCH /api/admin/meals/:id` | Lịch ngày và món |
| `POST /api/admin/meals/:id/ready`, `/issue`, `/complete`, `/publish`, `/revoke` | Chuyển trạng thái có điều kiện |
| `GET/POST /api/admin/menu-templates`, `POST /api/admin/menu-templates/generate` | Thực đơn tuần và sinh bữa |
| `GET/POST/PATCH /api/admin/users`, `GET /api/admin/audit` | Phân quyền và nhật ký |
| `GET /api/public/schools/:slug`, `GET /api/public/schools/:slug/days/:date` | Trường và bữa đã công bố |
| `GET /api/public/trace/:token` | Snapshot truy xuất, không có trường riêng tư |

API public giới hạn tốc độ, cache ngắn với invalidation sau công bố/thu hồi, không trả email, giá, phiếu nội bộ, storage key hay link chứng từ riêng tư. Mỗi response có `Cache-Control` phù hợp; trang token sai/thu hồi trả 404. OpenAPI mô tả request/response và mã lỗi; test contract đối chiếu với client.

## 8. Chuyển dữ liệu từ Google Sheets

1. Chụp bản backup Sheet và xuất 17 tab có tên cột đúng `schema.json`. Chạy script `migration:validate` chỉ đọc: đếm hàng, kiểm tra ID/FK, ngày, số, trùng trường/món/lô/token, URL chứng từ và đơn vị. Xuất báo cáo lỗi theo tab/dòng; không tự bỏ hàng lỗi.
2. `migration:dry-run` vào DB staging sạch: bảng `migration_maps` giữ ID cũ → UUID; import theo thứ tự users/schools/danh mục → NCC/chứng từ → nhập/lô/sổ kho → bữa/món/phân bổ → snapshots/audit. Bảo toàn `created_at` nếu hợp lệ, UTC hóa thời gian.
3. So sánh số hàng theo bảng, tổng số lượng IN/OUT và tồn từng lô, số bữa theo trường/ngày, snapshot/token. Chạy lại dry-run cho cùng kết quả (idempotent), báo mọi chênh lệch để sửa dữ liệu nguồn hoặc mapping.
4. Tạo user quản trị ban đầu bằng lệnh bootstrap với email được phê duyệt; không nhập `SUPER_ADMIN` tự động từ một hàng rỗng hoặc từ chủ OAuth. Kiểm tra đăng nhập đúng/sai tài khoản và school scope.
5. Đóng băng ghi trên Apps Script lúc cắt chuyển, backup lần cuối, chạy import production, kiểm tra đối soát, mở Node.js; giữ link cũ hoạt động hoặc redirect có kiểm soát. Có kế hoạch quay về ứng dụng cũ và restore DB nếu UAT thất bại; không ghi đồng thời hai hệ thống.

## 9. Bảo mật, vận hành và triển khai

- Secrets trong biến môi trường/secret store: `DATABASE_URL`, OAuth client ID/secret, `AUTH_SECRET`, storage keys, base URL. Không commit `.env`; có `.env.example` chỉ chứa tên biến và ví dụ giả.
- OAuth callback chỉ nhận domain production/staging đã cấu hình; HTTPS, secure/httpOnly/SameSite cookie; session timeout, logout; không dùng tham số role do client gửi. Phân quyền ở server và test truy cập chéo trường ở mọi route.
- Upload giới hạn MIME/kích thước, tên file ngẫu nhiên, không phục vụ file gốc chưa kiểm duyệt. Chứng từ chỉ công khai bản đã duyệt, có thể dùng URL ký thời hạn ngắn; snapshot không chứa bí mật.
- Log cấu trúc với request ID, health endpoint, cảnh báo lỗi 5xx và lỗi backup. Không log OAuth token, mật khẩu, URL ký, dữ liệu cá nhân không cần thiết.
- Backup PostgreSQL hằng ngày và tệp đối tượng theo lịch; mã hóa và giữ nhiều phiên bản, thử phục hồi staging định kỳ. Migration DB phải có backup và bước rollback rõ ràng trước khi chạy production.
- Pipeline: typecheck → lint → unit → integration DB → build → e2e staging → deploy; khóa deploy nếu bất kỳ cổng nào thất bại. Staging dùng dữ liệu giả và OAuth callback riêng.

## 10. Skill và công cụ dùng khi triển khai

| Công việc | Skill hiện có | Cách áp dụng |
|---|---|---|
| Đối chiếu Sheet, cột, công thức và dữ liệu chuyển đổi | `Spreadsheets` và `google-drive:google-sheets` | Đọc đúng tab/range, kiểm tra schema và lập báo cáo đối soát; không sửa Sheet nguồn khi chỉ phân tích |
| Lưu và cập nhật kế hoạch, gói bàn giao | `openai-library:library` | Giữ một bản tài liệu có phiên bản, lưu source/deliverable sau khi đạt cổng kiểm tra |
| Code Node.js/TypeScript | Không có skill Node.js chuyên biệt trong danh mục hiện tại | Đọc `AGENTS.md` của repo nếu có, áp dụng TypeScript strict, tách domain/service/repository, Prisma migration, Zod, ESLint/Prettier và code review theo các tiêu chí mục 11 |
| Kiểm tra sau code | `Spreadsheets` để đối soát dữ liệu; bộ test dự án: Vitest, Supertest/route tests, PostgreSQL test DB, Playwright | Chạy test theo tầng, kiểm tra UI thật trên desktop/mobile, kiểm tra phân quyền và nghiệp vụ dưới đây |

Không dùng skill `sites:sites-building`/`sites:sites-hosting` cho ứng dụng Node.js triển khai trên VPS: đây là dự án riêng, không phải Site của ChatGPT. Không gọi một lệnh `npm test` đơn lẻ là nghiệm thu; phải qua các cổng sau.

## 11. Cổng kiểm tra bắt buộc

| Cổng | Bài kiểm tra cụ thể | Điều kiện pass |
|---|---|---|
| G0 — thiết kế | Schema, URL, role matrix, trạng thái, import mapping và OpenAPI được review | Không còn endpoint thiếu scope hoặc bảng thiếu FK/ràng buộc |
| G1 — chất lượng mã | `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`; scan secrets và migration diff | Tất cả exit 0, không secret trong repo |
| G2 — unit | Ngày VN/tuần, quy đổi đơn vị, định lượng 2 món chung nguyên liệu, FEFO, chứng từ hết hạn, snapshot lọc dữ liệu | Test pass, số lượng dùng decimal, không phụ thuộc đồng hồ/mạng thật |
| G3 — tích hợp DB | Giao dịch nhập/xuất, rollback thiếu tồn, retry idempotent, 2 request xuất đồng thời, khóa lô, điều chỉnh, FK/unique, import chạy lại | Không tồn âm, không xuất kép, không ghi nửa phiếu |
| G4 — auth/API | 401/403/404, tài khoản không có trong allowlist, DISABLED, vai trò và truy cập chéo 2 trường, CSRF, validation, phân trang | Không rò dữ liệu trường khác hoặc trường private ra public |
| G5 — E2E UI | Admin tạo trường/10 nhóm món/món/công thức/NCC/lô/bữa; xem lịch ngày, sửa draft, xuất, hoàn thành, công bố; URL trường và từng món trên mobile/desktop | Giao diện, trạng thái và dữ liệu khớp API; URL trực tiếp tải lại được |
| G6 — truy xuất | 2 món dùng chung nguyên liệu, 2 lô FEFO, chứng từ hợp lệ; token sai/thu hồi; đổi tên NCC sau công bố; công bố version mới | Snapshot cũ bất biến; chỉ dữ liệu được duyệt xuất hiện công khai |
| G7 — staging/migration | Đối soát số hàng/tồn/bữa/token sau import; backup + restore thử; smoke test HTTPS/OAuth/ảnh/QR | Không chênh lệch chưa giải thích; khôi phục thành công; ký duyệt UAT |

Kịch bản số liệu chuẩn: trường A, hai món dùng chung một nguyên liệu; định lượng 0,04 và 0,02 kg/suất, 1.000 suất; lô A 20 kg, lô B 40 kg. Xuất đúng 20 kg từ A + 40 kg từ B, phân bổ mỗi món theo FEFO, tồn cả hai bằng 0. Với tổng tồn 50 kg, yêu cầu 60 kg phải rollback; với lô hết hạn trước ngày bữa, lô không được dùng. Chạy đồng thời hai yêu cầu xuất cùng bữa: chỉ một thành công.

## 12. Thứ tự code và sản phẩm bàn giao

1. **Nền tảng:** repo TypeScript, Docker Compose, env example, DB schema/migration/seed 10 nhóm món mẫu, CI, tài liệu chạy local. G0–G1.
2. **Đăng nhập và quyền:** Auth.js, allowlist, bootstrap, role/school scope, audit nền, màn admin; test account ACTIVE/không có quyền. G3–G4.
3. **Danh mục và kho:** trường, nhóm món, món, nguyên liệu, công thức, NCC, chứng từ, phiếu/lô, tồn; API và UI, test transaction. G2–G4.
4. **Lịch và bữa:** trang ngày cho từng trường, mẫu tuần, chỉnh draft, FEFO, ảnh, trạng thái; test desktop/mobile. G2–G5.
5. **Công khai:** snapshot, URL trường/ngày/token, QR, thu hồi/versioning, cache; test bảo mật và bất biến. G4–G6.
6. **Chuyển dữ liệu và triển khai:** script validate/dry-run/import, đối soát, staging, backup/rollback, HTTPS, UAT, cắt chuyển. G7.

Bàn giao: mã nguồn, migration/seed, `.env.example`, Docker Compose, OpenAPI, script nhập/đối soát, test tự động, tài liệu admin, tài liệu vận hành/backup/rollback và biên bản UAT. Mỗi hạng mục chỉ đánh dấu hoàn thành sau khi qua cổng tương ứng; ghi lỗi còn lại và bằng chứng kiểm tra trong báo cáo triển khai.
