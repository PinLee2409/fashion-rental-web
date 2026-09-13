/**
 * Cấu hình hệ thống — PHỤ LỤC A của đặc tả (bảng `settings`).
 * Frontend đọc các giá trị này để hiển thị đúng quy tắc nghiệp vụ.
 * Khi nối API thật, thay bằng dữ liệu từ GET /api/v1/settings.
 */
export const SETTINGS = {
  /** TTL giữ chỗ ở giỏ thuê (BR-05) */
  hold_ttl_minutes: 15,
  /** Thời gian giữ đơn chờ thanh toán (BR-05 / UC-04 ngoại lệ 10a) */
  checkout_ttl_minutes: 30,
  /** Buffer giặt ủi mặc định (BR-02) */
  default_clean_buffer_days: 1,
  /** Buffer chuẩn bị trước ngày nhận (BR-02) */
  prep_buffer_days: 0,
  /** Cửa sổ đặt trước (BR-07) */
  min_lead_days: 0,
  max_advance_days: 180,
  /** Giới hạn thời gian thuê (BR-07) */
  min_rental_days: 1,
  max_rental_days: 30,
  /** Cọc mặc định = 60% giá trị đồ */
  deposit_rate_default: 0.6,
  /** % tiền thuê trả trước cùng cọc (BR-13) */
  prepay_rental_rate: 0.3,
  /** Giảm khi trả đủ (BR-13) */
  full_payment_discount: 0.02,
  /** Hệ số phí trễ / ngày (BR-30) */
  late_fee_rate: 1.5,
  late_fee_grace_hours: 3,
  late_fee_cap_multiplier: 2,
  /** Hạn mức Staff tự quyết phí (BR-33) — hiển thị trong trang chính sách */
  staff_fee_limit: 500_000,
  refund_auto_limit: 2_000_000,
} as const;

/** Phí giao nhận 2 chiều (BR-12) — bảng phí mô phỏng theo khu vực nội thành. */
export const SHIPPING = {
  one_way_fee: 30_000,
  /** Giao tận nơi = 2 chiều */
  round_trip_fee: 60_000,
  /** Vùng hỗ trợ giao tận nơi (UC-04 luồng phụ 4a) */
  supported_provinces: ["TP. Hồ Chí Minh", "Bình Dương", "Đồng Nai", "Hà Nội", "Đà Nẵng"] as string[],
  free_shipping_threshold: 3_000_000,
} as const;

export const STORE = {
  brand: "StyleRent",
  tagline: "Wear More. Own Less.",
  address: "123 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
  hours: "09:00 – 21:00 · Thứ 2 – Chủ nhật",
  phone: "1900 6868",
  email: "hello@stylerent.vn",
  /** Giờ hẹn trả trong ngày trả — dùng cho `return_due_at` */
  return_due_hour: 18,
} as const;

/** Chính sách huỷ đơn — BR-20 */
export const CANCELLATION_POLICY = [
  { minDaysBefore: 7, rentalRefundRate: 1, depositRefundRate: 1, label: "Từ 7 ngày trở lên trước ngày nhận" },
  { minDaysBefore: 3, rentalRefundRate: 0.7, depositRefundRate: 1, label: "Trước 3 – 6 ngày" },
  { minDaysBefore: 1, rentalRefundRate: 0.5, depositRefundRate: 1, label: "Trước 1 – 2 ngày" },
  { minDaysBefore: 0, rentalRefundRate: 0, depositRefundRate: 1, label: "Dưới 24 giờ hoặc không đến nhận" },
] as const;

/** Bảng phí tình trạng khi trả — BR-31 (hiển thị ở trang chính sách) */
export const CONDITION_FEES = [
  { condition: "Nguyên vẹn", fee: "Miễn phí", unit: "→ Giặt ủi, hoàn cọc đầy đủ" },
  { condition: "Bẩn nặng (dính màu, mùi, vết khó tẩy)", fee: "Phí giặt đặc biệt theo danh mục", unit: "→ Giặt ủi" },
  { condition: "Hư hỏng nhẹ (bung chỉ, rách nhỏ, mất hạt)", fee: "10 – 30% giá trị đồ", unit: "→ Sửa chữa" },
  { condition: "Hư hỏng nặng (không sửa được)", fee: "100% giá trị đồ", unit: "→ Thanh lý" },
  { condition: "Mất", fee: "100% giá trị đồ + 20% phí cơ hội", unit: "→ Ghi nhận mất" },
] as const;
