# StyleRent Operations — Admin

Giao diện vận hành cho hệ thống cho thuê trang phục, dựng theo **Đặc tả hệ thống cho thuê trang phục** (tài liệu nghiệp vụ là nguồn sự thật duy nhất). Phần khách hàng nằm ở dự án `frontend`.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · không thêm thư viện ngoài.

```bash
npm install
npm run dev -- --port 3001    # http://localhost:3001
```

---

## 1. Hệ thống thiết kế admin

Đây **không phải** dashboard thương mại điện tử thông thường: thứ hệ thống quản lý là **từng cá thể trang phục vật lý** có lịch bận riêng, tiền cọc phải giữ, phí phát sinh phải chứng minh bằng ảnh và hạn mức phải qua người duyệt. Giao diện được thiết kế quanh những ràng buộc đó.

### Màu (`app/globals.css`)

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `canvas` / `surface` | `#F7F7F5` / `#FFFFFF` | Nền làm việc / bảng, thẻ |
| `ink` / `ink-2` / `ink-3` | `#181818` / `#737373` / `#A3A3A3` | Chữ chính / phụ / mờ |
| `line` / `line-2` | `#E7E5E4` / `#F0EFED` | Viền, đường phân cách hàng |
| `beige` | `#F1ECE6` | Nền mục đang chọn, vùng nhấn |
| `accent` | `#8E6259` | Trạng thái đang diễn ra |
| `success` `warning` `danger` `info` | `#557A5B` `#B7791F` `#B94A48` `#4F6D8A` | Ngữ nghĩa trạng thái |

Màu chỉ dùng để **truyền đạt trạng thái**, không dùng để trang trí. Mọi badge trạng thái đều có chấm màu + nhãn chữ nên không phụ thuộc hoàn toàn vào màu sắc.

### Chữ

**Inter** cho toàn bộ giao diện vận hành (bảng, form, số liệu). Serif chỉ xuất hiện ở vài điểm nhấn thương hiệu, không bao giờ dùng cho bảng dữ liệu. Số liệu luôn bật `tabular-nums` để cột tiền thẳng hàng.

### Component nền

`.btn` (+ `-outline`, `-ghost`, `-danger`, `-sm`, `-icon`, `-block`) · `.field` / `.field-label` / `.field-hint` · `.card` · `.tbl` (sticky header, hai mức mật độ) · `.chip` · `.label-xs`.

Component React dùng chung: `DataTable`, `PageHeader`, `Toolbar`, `ActiveFilters`, `StatCard`, `Section`, `Drawer`, `Modal`, `BottomSheet`, `CommandOverlay`, `Toast`, `MoreMenu`, `Tabs`, `SegmentedControl`, `Switch`, `Meter`, `EmptyState`, `Callout`, `KeyValue`.

### Chuyển động

Microinteraction 150–250ms · drawer 280ms · modal 200ms · menu 200ms. Không parallax, không hiệu ứng trang trí — chuyển động chỉ để định hướng và phản hồi. Tôn trọng `prefers-reduced-motion`.

---

## 2. Điều hướng theo vai trò

Điều hướng suy trực tiếp từ ma trận phân quyền §2.2. Module không có quyền thì **ẩn hẳn**, không hiển thị mờ.

| Module | Quyền cần có | Staff | Warehouse | Manager | Admin |
| --- | --- | :-: | :-: | :-: | :-: |
| Bảng điều hành | — | ✓ | ✓ | ✓ | ✓ |
| Đơn thuê · Lịch thuê | `order.view.all` | ✓ | ✓ | ✓ | ✓ |
| Quầy nhận trả | `order.return_inspect` | ✓ | ✓ | ✓ | ✓ |
| Kho cá thể | `unit.manage` | ✓ | ✓ | ✓ | ✓ |
| Giặt ủi & sửa chữa | `unit.lifecycle` | | ✓ | ✓ | ✓ |
| Chờ duyệt | `refund.approve` / `fee.waive` | | | ✓ | ✓ |
| Sản phẩm · Đánh giá | `catalog.manage` | | | ✓ | ✓ |
| Khuyến mãi | `promotion.manage` | | | ✓ | ✓ |
| Báo cáo | `report.view` | | | ✓ | ✓ |
| Cài đặt · Vai trò · Người dùng | `user.manage` / `role.manage` | | | | ✓ |

Nút đổi vai trò trên header cho phép xem hệ thống bằng con mắt của từng vai trò khi demo. Hệ thống thật lấy vai trò từ phiên đăng nhập; frontend chỉ ẩn/hiện, backend vẫn kiểm tra lại bằng policy.

Hành động trong màn hình cũng theo quyền: nhân viên kho không thấy nút ghi nhận thu tiền, nhân viên bán hàng không duyệt được phí do chính mình áp, chỉ Admin đổi được trạng thái tài khoản khách.

---

## 3. Màn hình

| Route | Mã trong đặc tả | Nội dung |
| --- | --- | --- |
| `/` | A01 | Cần xử lý ngay (theo vai trò) · chỉ số vận hành · hàng đợi hôm nay · phân bố trạng thái · tình trạng kho · doanh thu 30 ngày |
| `/orders` | A02 | Bảng đơn: bộ lọc nhanh, bộ lọc nâng cao, hai mức mật độ, xem nhanh bằng drawer |
| `/orders/[code]` | A03 | Màn hình làm việc chính: khách, món & cá thể, tiến trình có người thực hiện, thanh toán, cọc, hành động theo trạng thái |
| `/orders/new` | A04 | POS tại quầy: chọn ngày → chỉ hiện cá thể thật sự rảnh → thu tiền → bàn giao ngay |
| `/calendar` | A05 | Timeline lịch bận từng cá thể, có cả dải ngày đệm giặt ủi |
| `/products` · `/products/[slug]` | A06 · A07 | Danh sách sản phẩm và trình soạn theo tab: thông tin, biến thể, gói thuê & cọc, cá thể, quy tắc |
| `/inventory` | A08 | Kho cá thể: lọc theo trạng thái, chọn hàng loạt, drawer hồ sơ cá thể kèm ROI và vòng đời |
| `/returns` | A09 | Quầy nhận trả: quét QR, biên bản từng cá thể, tính phí trễ, quyết toán cọc |
| `/maintenance` | A10 | Hàng đợi giặt ủi / sửa chữa: Kanban + danh sách, sắp theo hạn booking kế tiếp |
| `/promotions` | A11 | Quản lý mã giảm giá kèm xem trước quy tắc |
| `/reviews` | A12 | Kiểm duyệt đánh giá, phản hồi công khai |
| `/customers` · `/customers/[id]` | A13 | Hồ sơ vận hành: lịch sử thuê, số lần trả trễ, sự cố hư hỏng, số đo |
| `/reports` | A14 | Doanh thu · tỷ lệ khai thác · tồn ế |
| `/settings` · `/settings/roles` · `/settings/users` | A15 | Cấu hình vận hành (PHỤ LỤC A), ma trận phân quyền, người dùng |
| `/approvals` | — | Hàng đợi duyệt của quản lý, suy ra từ BR-23 và BR-33 |

---

## 4. Nghiệp vụ được cài vào giao diện

| Quy tắc | Thể hiện |
| --- | --- |
| §4.1 State machine đơn | Hành động khả dụng đổi theo trạng thái; không bao giờ hiện nút cho bước không hợp lệ |
| §4.2 Vòng đời cá thể | `UNIT_TRANSITIONS` chặn chuyển trạng thái sai; hộp thoại chỉ liệt kê bước hợp lệ |
| BR-01→03 Lịch bận | Gán cá thể và POS chỉ hiện cá thể không chồng lịch, đã cộng buffer |
| BR-02 Buffer giặt ủi | Lịch thuê vẽ riêng dải ngày đệm; buffer lấy theo danh mục |
| BR-06 Late binding | Cá thể chỉ gán khi soạn đồ; gợi ý cá thể ít lượt thuê nhất để mòn đều |
| BR-30 Phí trễ | Quầy nhận trả tự tính `ngày trễ × 1.5 × tiền thuê ngày`, có trần 2× cọc |
| BR-31 Phí tình trạng | 5 mức tình trạng, mỗi mức có phí gợi ý và trạng thái cá thể kế tiếp |
| BR-32 Quyết toán cọc | Bảng quyết toán tách cọc / phí / hoàn lại / công nợ, kể cả khi khách trả thiếu món |
| BR-33 Hạn mức nhân viên | Phí vượt 500.000₫ tự chuyển hàng đợi duyệt, không cho hoàn tất âm thầm |
| BR-34 Minh chứng bắt buộc | Không có ảnh thì không lưu được biên bản có phí |
| BR-23 Hoàn cọc lớn | Khoản hoàn trên 2.000.000₫ cần quản lý duyệt |
| BR-14 Cọc ≠ doanh thu | Báo cáo tách riêng cọc đã thu; mọi nơi hiển thị cọc đều ghi rõ là khoản giữ hộ |
| §2.2 RBAC | Điều hướng và hành động ẩn theo quyền; tách người áp phí với người miễn phí |
| PHỤ LỤC A | Mọi tham số đọc từ `lib/settings.ts`, hiển thị và sửa được ở màn Cài đặt |

---

## 5. Cấu trúc thư mục

```
app/                      route theo §8.1 (phần admin)
components/
  ui/        Icons · Primitives · Overlay · Toast · DataTable · PageParts
  shell/     AdminShell · Sidebar · Header · CommandPalette · nav
  domain/    Chips · ProductMedia · OrderDetailView · AssignUnitDrawer
             HandoverFlow · ProductEditor · CustomerDetail
data/        operations (nguồn dữ liệu vận hành) · products · catalog · promotions · reviews
lib/         admin-types · permissions · unit-status · ops (selector)
             + dùng chung với frontend: types · settings · money · date · pricing · availability · policy · order-status
store/       session (vai trò hiện tại)
```

`data/operations.ts` dựng toàn bộ dữ liệu vận hành trong **một lượt** — cá thể, đơn, booking, hàng đợi kho, yêu cầu duyệt — nên trạng thái cá thể luôn khớp với trạng thái đơn và lịch. Sinh bằng PRNG có seed để server và client ra cùng kết quả.

---

## 6. Dữ liệu mẫu

- **22 đơn thuê** phủ đủ 12 trạng thái của §4.1, gồm cả đơn tại quầy, đơn khiếu nại và đơn chờ quản lý duyệt.
- **~250 cá thể** sinh từ biến thể của 20 sản phẩm, mỗi cá thể có mã QR riêng (`AD-M-DO-003`), tình trạng, số lượt thuê, vị trí kệ, ngày giặt gần nhất, giá nhập và doanh thu luỹ kế để tính ROI.
- **Lịch bận** gồm booking từ đơn thật cộng lịch tương lai, đã tính buffer giặt ủi theo danh mục.
- **11 việc kho** trải khắp Kanban: chờ xử lý, đang làm, chờ QC, hoàn tất, QC không đạt.
- **3 yêu cầu duyệt**: phí vượt hạn mức, hoàn cọc lớn, đề xuất miễn phí khi khách khiếu nại.
- **10 khách hàng** có lịch sử thuê, số lần trả trễ, sự cố hư hỏng và một khách đang bị khoá.

Tình huống vận hành có sẵn để thử: trả đúng hạn · trả trễ 3 ngày · hư hỏng nhẹ cần duyệt · vết bẩn đang khiếu nại · cá thể bị mất · đơn sắp hết hạn giữ chỗ · cá thể QC không đạt · cá thể thanh lý.

---

## 7. Ghi chú & giả định

1. **Quyền cho Đánh giá và Cài đặt**: đặc tả không nêu mã quyền riêng cho hai module này, nên frontend suy từ quyền gần nhất — kiểm duyệt đánh giá gắn với `catalog.manage`, cấu hình hệ thống gắn với `user.manage`. Đã ghi chú trong `lib/permissions.ts` để dễ chỉnh khi backend chốt.
2. **Quét QR** mô phỏng bằng ô nhập mã (đầu đọc barcode hoạt động y như gõ phím). Khi nối `html5-qrcode`, chỉ cần thay phần nhập liệu trong `HandoverFlow` và `/returns`.
3. **Mọi thao tác đều là mock**: đổi trạng thái, gán cá thể, duyệt phí chỉ thay đổi state trong phiên, không gọi API và không lưu lại sau khi tải lại trang.
4. **Ảnh sản phẩm** dùng chung cơ chế với bản khách hàng: khung hình dựng bằng SVG theo tông màu, thay bằng ảnh thật là đổi ở một chỗ.
5. **Kanban không kéo thả**: chuyển cột bằng nút hành động rõ nghĩa (Nhận việc → Gửi QC → QC đạt / Không đạt) để dùng được bằng bàn phím và trên tablet. Luôn có chế độ danh sách song song.
