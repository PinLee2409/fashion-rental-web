# StyleRent — Frontend khách hàng

> Wear More. Own Less.

Giao diện khách hàng cho hệ thống cho thuê trang phục, dựng theo **Đặc tả hệ thống cho thuê trang phục** (tài liệu nghiệp vụ là nguồn sự thật duy nhất). Phần quản trị nằm ở dự án riêng `frontend-admin` và **chưa** được thiết kế ở giai đoạn này.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · không thêm thư viện ngoài.

```bash
npm install
npm run dev     # http://localhost:3000
```

---

## 1. Hệ thống thiết kế

**Hướng thẩm mỹ:** Editorial Luxury Fashion + Modern Rental UX. Giao diện dựa vào *typography, khoảng trắng, đường kẻ mảnh và ảnh lớn* — không dùng bo góc lớn, đổ bóng, gradient loè loẹt hay thẻ nổi.

### Màu (`app/globals.css`, khối `@theme`)

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `canvas` | `#FAFAF8` | Nền trang |
| `surface` | `#FFFFFF` | Panel, thẻ thông tin |
| `ink` | `#181818` | Chữ chính, nút primary |
| `ink-2` | `#737373` | Chữ phụ |
| `ink-3` | `#A3A3A3` | Chữ mờ, nhãn |
| `line` / `line-2` | `#E7E5E4` / `#F0EEEC` | Đường kẻ |
| `beige` / `warm` | `#EFEAE3` / `#F6F2EC` | Nền ấm, khối nhấn |
| `accent` | `#8E6259` | Hover, trạng thái đang diễn ra |
| `success` `warning` `danger` | `#557A5B` `#B7791F` `#B94A48` | Còn nhiều / sắp hết / hết đồ, và các trạng thái đơn |

Mỗi màu ngữ nghĩa có bản `-soft` để làm nền chip và khối cảnh báo.

### Chữ

- **Playfair Display** — tiêu đề (`.display-1` → `.display-4`). Phân cấp bằng *scale*, không bằng in đậm.
- **Inter** — điều hướng, nội dung, giá, biểu mẫu, nhãn. Nhãn nhỏ dùng `.eyebrow` (11px, uppercase, letter-spacing 0.18em).

### Component nền

`.btn` (+ `-outline`, `-quiet`, `-light`, `-sm`, `-block`) · `.field` / `.field-label` · `.panel` · `.link-line` (gạch chân vẽ theo hướng chuột) · `.shell` (khung nội dung, max 1520px).

### Chuyển động

| Loại | Thời lượng | Ghi chú |
| --- | --- | --- |
| Microinteraction | 150–250ms | hover swatch, size, nút |
| Tương tác chuẩn | 300–450ms | drawer, modal, bottom sheet, mega menu |
| Reveal khi cuộn | 700ms | `<Reveal>` + IntersectionObserver, trượt lên 20px |
| Chuyển trang | 420ms | `app/template.tsx`, mờ + trượt 12px, không chặn điều hướng |

Không bounce, không xoay, không phóng to mạnh. Toàn bộ tôn trọng `prefers-reduced-motion`.

### Ảnh sản phẩm

Giai đoạn này chưa có ảnh chụp thật. `components/product/ProductMedia.tsx` dựng khung hình biên tập bằng SVG từ `motif` + cặp màu `tone` của từng sản phẩm, giữ đúng bố cục và nhịp thị giác của một bộ ảnh thời trang.

**Thay bằng ảnh thật:** điền `src` cho `ProductImage` trong `data/products.ts` — mọi màn hình dùng chung component này sẽ đổi theo, không phải sửa gì thêm.

---

## 2. Sitemap (đúng route trong §8.1 của đặc tả)

```
/                                   S01  Trang chủ
/danh-muc/[slug]                    S02  Danh sách sản phẩm + bộ lọc + chọn ngày
     tat-ca · moi-ve · thinh-hanh · nu · nam · phu-kien · dam-vay · <slug danh mục>
     ?dip=<occasion>                     lọc theo dịp sử dụng
/san-pham/[slug]                    S03  Chi tiết sản phẩm  ⭐ màn hình lõi
/gio-thue                           S04  Giỏ thuê
/thanh-toan                         S05  Checkout 3 bước
/thanh-toan/ket-qua                 S06  Kết quả thanh toán (thành công / thất bại)
/tai-khoan                          S07  Tổng quan + hồ sơ + số đo
/tai-khoan/don-thue                 S08  Danh sách đơn theo tab trạng thái
/tai-khoan/don-thue/[code]          S09  Chi tiết đơn, quyết toán, huỷ, gia hạn
/tai-khoan/dia-chi                  S10  Sổ địa chỉ
/tai-khoan/danh-gia                      Đánh giá (chờ viết + đã viết)
/tai-khoan/thong-bao                     Thông báo
/dang-nhap · /dang-ky               S11  Xác thực
/huong-dan · /chinh-sach            S12  Hướng dẫn thuê, FAQ, bảng size, chính sách
/yeu-thich                               Danh sách yêu thích (xem mục 6)
```

---

## 3. Nghiệp vụ được cài vào giao diện

Toàn bộ quy tắc nằm ở `lib/`, tách khỏi component để đối chiếu với đặc tả:

| Quy tắc | Cài ở | Thể hiện trên giao diện |
| --- | --- | --- |
| BR-01…03 Tồn kho là **lịch bận**, không phải số lượng | `lib/availability.ts` | Lịch tô màu từng ngày, badge "Còn 2/3 bộ", chặn ngày hết đồ |
| BR-02 Buffer giặt ủi theo danh mục | `data/catalog.ts` (`cleanBufferDays`) | Váy cưới chặn thêm 2 ngày sau mỗi lượt; phụ kiện 0 ngày |
| BR-05 Soft hold 15 phút (30 phút khi checkout) | `store/cart.tsx`, `HoldTimer` | Đồng hồ đếm ngược ở giỏ và checkout, hộp thoại hết hạn giữ chỗ |
| BR-06 Late binding cá thể | `data/orders.ts` | Đơn chưa soạn: "cá thể sẽ được gán khi soạn đồ"; đơn đã soạn hiện mã `AD-M-DO-003` |
| BR-07 Cửa sổ đặt trước 0–180 ngày, thuê 1–30 ngày | `lib/availability.ts` | Ngày ngoài cửa sổ bị khoá, thông báo khi chọn quá dài |
| BR-10/11 Giá gói, chọn tổ hợp rẻ nhất | `lib/pricing.ts` | Bảng gói 1/3/7 ngày, làm nổi gói đang áp, hiện mức tiết kiệm |
| BR-12 Tổng đơn, giảm giá **chỉ** trên tiền thuê | `lib/pricing.ts` | `<PriceBreakdown>` tách hẳn tiền thuê / cọc |
| BR-13 Cọc giữ chỗ (cọc + 30% thuê) hoặc trả đủ (−2%) | `lib/pricing.ts` | Hai lựa chọn ở bước thanh toán, hiện rõ "trả ngay / trả khi nhận" |
| BR-14 Cọc không phải doanh thu | UI | Mọi nơi hiển thị cọc đều kèm "hoàn lại khi trả nguyên vẹn" |
| BR-20 Chính sách huỷ theo mốc ngày | `lib/policy.ts` | Hộp thoại huỷ tính sẵn số tiền hoàn trước khi xác nhận |
| BR-30/31/32 Phí trễ, phí tình trạng, quyết toán cọc | `lib/policy.ts`, `SettlementTable` | Đơn hoàn tất hiện bảng "cọc − phí = hoàn lại" |
| BR-40/41/42 Gia hạn | `lib/policy.ts` | Hộp thoại gia hạn: kiểm tra booking kế tiếp, tính phí ngày thêm |
| BR-50/51 Khuyến mãi | `lib/pricing.ts` | Ô nhập mã, báo lỗi khi chưa đạt đơn tối thiểu |
| BR-60/61 Đánh giá | `app/tai-khoan/danh-gia` | Chỉ đơn `completed`, trong 30 ngày, mỗi món một lần, có kiểm duyệt |
| §4.1 State machine đơn | `lib/order-status.ts` | Nhãn tiếng Việt cho khách + timeline 6 bước, không lộ enum |
| PHỤ LỤC A | `lib/settings.ts` | Mọi con số (TTL, buffer, hệ số phí trễ…) đọc từ một chỗ |

---

## 4. Cấu trúc thư mục

```
app/                     route theo §8.1
components/
  ui/        Icons · Primitives (Reveal, Stars, Chip, Accordion, EmptyState, Note…) · Overlay · Toast
  layout/    Header (mega menu) · MobileMenu · SearchOverlay · CartDrawer · Footer · Providers
  product/   ProductMedia · ProductCard · ProductGrid/Rail · ImageGallery · VariantSelector
             AvailabilityBadge · QuickView · ProductDetail · ReviewList
  rental/    RentalDatePicker · PriceBreakdown/SettlementTable · PricingTiers · HoldTimer · OrderTimeline
  catalog/   CatalogView (lọc, sắp xếp, phân trang)
  account/   AccountNav · OrderCard · OrderDetailView
data/        catalog · products · bookings · collections · orders · reviews · customer · promotions · content
lib/         types · settings · money · date · pricing · availability · policy · order-status · utils
store/       cart · wishlist · rental-dates  (React Context + localStorage)
hooks/       useReveal · useMounted · useScrollY · useDebounced · usePersistentState …
```

Component dùng chung đúng theo §8.3 của đặc tả: `<RentalDatePicker>`, `<AvailabilityBadge>`, `<VariantSelector>`, `<PriceBreakdown>`, `<HoldTimer>`, `<OrderTimeline>`.

---

## 5. Dữ liệu mẫu

- **20 sản phẩm** thật về nội dung (áo dài, dạ hội, váy cưới, vest, tuxedo, đồ biểu diễn, phụ kiện) với chất liệu, hướng dẫn bảo quản, dịp sử dụng, bảng size, giá trị đền bù.
- **Biến thể size × màu** kèm số cá thể (`rental_units`) — có cả biến thể 0 cá thể để thấy trạng thái "hết đồ theo màu" và "hết đồ theo size".
- **Lịch bận** sinh bằng PRNG có seed (`data/bookings.ts`) nên server và client luôn khớp; sản phẩm được thuê nhiều thì lịch dày hơn.
- **7 đơn thuê** phủ các trạng thái: chờ thanh toán · đã xác nhận · sẵn sàng bàn giao · đang thuê (sắp tới hạn) · hoàn tất có phí giặt đặc biệt · hoàn tất nguyên vẹn · đã huỷ.
- **17 đánh giá** có size đã mặc, chiều cao người mặc, ảnh khách gửi và phản hồi của shop.
- **Khách hàng mẫu** với số đo, 3 địa chỉ (một địa chỉ ngoài vùng giao để minh hoạ luồng phụ 4a của UC-04), thông báo, lịch sử thuê.

---

## 6. Ghi chú & giả định

1. **Yêu thích** là tính năng chỉ có ở frontend, lưu trong `localStorage`. Đặc tả chưa có bảng/API cho wishlist — khi backend bổ sung, chỉ cần thay phần lưu trữ trong `store/wishlist.tsx`.
2. **Giảm 2% khi trả đủ** (BR-13) được tính trên tiền thuê sau khuyến mãi; đặc tả không nói rõ gốc tính nên chọn phương án không đụng vào tiền cọc (cọc là khoản hoàn lại).
3. **Bảng gói thuê** sinh từ giá ngày: gói 3 ngày ≈ 2,57× và gói 7 ngày ≈ 4,15× giá ngày, ngày thuê thêm ≈ 0,43× — đặt sao cho mọi gói đều thật sự rẻ hơn khi tính theo ngày, đúng tinh thần "luôn chọn tổ hợp rẻ nhất cho khách".
4. **Thanh toán** được mô phỏng: bước cuối có công tắc *demo* để xem màn hình thất bại. Thực tế chỉ IPN mới được đổi trạng thái đơn (§7.2).
5. **Ngôn ngữ:** nội dung tiếng Việt theo thuật ngữ của đặc tả (giỏ thuê, tiền cọc, đơn thuê, cá thể…); chỉ tên thương hiệu và tagline giữ tiếng Anh.
6. Toàn bộ dữ liệu đang là mock trong `data/`. Khi nối API thật (§7.1), thay các hàm đọc dữ liệu trong `data/` — phần `lib/` (quy tắc nghiệp vụ) và component không phải sửa.

---

## 7. Trạng thái đã thiết kế

**Rỗng:** giỏ thuê · yêu thích · không có kết quả tìm kiếm · không khớp bộ lọc · từng tab đơn thuê · chưa có đánh giá · chưa có địa chỉ.

**Tải:** skeleton giữ nguyên bố cục cho lưới sản phẩm, khối kiểm tra lịch trống, trang kết quả thanh toán.

**Lỗi / ngoại lệ:** hết đồ trong khoảng ngày đã chọn (kèm gợi ý khoảng trống gần nhất) · hết hạn giữ chỗ · thanh toán thất bại · mã giảm giá không đủ điều kiện · địa chỉ ngoài vùng giao · gia hạn bị từ chối vì có khách đặt tiếp · đơn không tồn tại.
