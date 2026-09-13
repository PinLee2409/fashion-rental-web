import type { ISODate } from "./date";

/* ========================================================================== */
/* Catalog                                                                     */
/* ========================================================================== */

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentSlug: string | null;
  description: string;
  /** BR-02 — buffer giặt ủi theo danh mục */
  cleanBufferDays: number;
  sortOrder: number;
  group: "women" | "men" | "accessories";
}

export interface Occasion {
  slug: string;
  name: string;
  blurb: string;
}

/** Ảnh sản phẩm — motif + tông màu điều hướng art direction (xem components/product/ProductMedia). */
export interface ProductImage {
  id: string;
  /** Bố cục ảnh biên tập */
  motif: "portrait" | "detail" | "drape" | "runway" | "still-life";
  /** Cặp màu duotone của khung hình */
  tone: [string, string];
  alt: string;
  /**
   * Ảnh thật (nếu có). Khi bỏ trống, hệ thống dựng khung hình biên tập
   * từ `motif` + `tone` — thay bằng đường dẫn ảnh là toàn bộ site đổi theo.
   */
  src?: string;
}

/** `pricing_tiers`: id, variant_id, days, price, label — gói 1/3/7 ngày (BR-11) */
export interface PricingTier {
  days: number;
  price: number;
  label: string;
}

/** `product_variants` — tổ hợp size × màu */
export interface Variant {
  id: string;
  productId: string;
  size: string;
  color: string;
  colorHex: string;
  pricePerDay: number;
  depositAmount: number;
  /** Giá ngày thứ n+1 (BR-11) */
  extraDayPrice: number;
  tiers: PricingTier[];
  /** Số cá thể (`rental_units`) đang ở trạng thái available — KHÔNG phải stock_quantity */
  unitCount: number;
  barcode: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  brandLine: string;
  description: string;
  material: string;
  careInstruction: string;
  occasions: string[];
  sizeChart: { size: string; bust: string; waist: string; hip: string; length: string }[];
  basePrice: number;
  baseDeposit: number;
  /** `replacement_value` — giá trị đền bù nếu mất (BR-31) */
  replacementValue: number;
  isFeatured: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  /** Số lượt đã cho thuê — cộng dồn `rental_units.rental_count` */
  rentalCount: number;
  images: ProductImage[];
  variants: Variant[];
  /** Điểm nhấn biên tập ngắn hiển thị trên PDP */
  editorialNote: string;
}

/* ========================================================================== */
/* Availability                                                                */
/* ========================================================================== */

/** Một booking mock ở cấp cá thể (`bookings` + `rental_units`) */
export interface UnitBooking {
  variantId: string;
  unitIndex: number;
  unitCode: string;
  pickupDate: ISODate;
  returnDate: ISODate;
  status: "held" | "confirmed";
}

export type AvailabilityLevel = "plenty" | "limited" | "none" | "closed";

export interface VariantAvailability {
  variantId: string;
  totalUnits: number;
  freeUnits: number;
  level: AvailabilityLevel;
}

/* ========================================================================== */
/* Giỏ thuê & đơn thuê                                                         */
/* ========================================================================== */

export interface CartLine {
  /** id dòng giỏ (tương ứng `cart/items/{id}`) */
  id: string;
  productSlug: string;
  variantId: string;
  quantity: number;
  pickupDate: ISODate;
  returnDate: ISODate;
  /** Thời điểm hết hạn soft hold (BR-05) — epoch ms */
  holdExpiresAt: number;
}

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in_use"
  | "overdue"
  | "inspecting"
  | "pending_approval"
  | "disputed"
  | "completed"
  | "cancelled"
  | "expired";

export type PickupMethod = "at_store" | "delivery";
export type PaymentPlan = "deposit_hold" | "full";
export type PaymentMethod = "vnpay" | "momo" | "bank_transfer" | "cash";
export type PaymentType = "deposit" | "rental" | "extra_fee" | "extension";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "expired" | "refunded" | "partially_refunded";

export interface OrderItem {
  productSlug: string;
  productNameSnapshot: string;
  variantSnapshot: { size: string; color: string; colorHex: string };
  image: ProductImage;
  quantity: number;
  days: number;
  unitRentalPrice: number;
  unitDeposit: number;
  lineRentalTotal: number;
  lineDepositTotal: number;
  /** Cá thể được gán khi Staff soạn đồ (BR-06 late binding) — null trước đó */
  unitCodes: string[] | null;
  /** Đã đánh giá chưa (BR-60) */
  reviewed?: boolean;
}

export interface Payment {
  id: string;
  code: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface OrderFee {
  id: string;
  type: "late" | "dirty" | "damage_minor" | "damage_major" | "lost" | "other";
  label: string;
  amount: number;
  reason: string;
  unitCode?: string;
}

export interface OrderStatusLog {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  code: string;
  status: OrderStatus;
  channel: "online" | "walk_in";
  createdAt: string;
  pickupMethod: PickupMethod;
  pickupDate: ISODate;
  returnDate: ISODate;
  /** Hạn trả kèm giờ hẹn */
  returnDueAt: string;
  receiverName: string;
  receiverPhone: string;
  address: string | null;
  items: OrderItem[];
  subtotalRental: number;
  discount: number;
  promotionCode: string | null;
  shippingFee: number;
  totalDeposit: number;
  extraFeesTotal: number;
  grandTotal: number;
  paidAmount: number;
  refundedAmount: number;
  paymentPlan: PaymentPlan;
  payments: Payment[];
  fees: OrderFee[];
  logs: OrderStatusLog[];
  note?: string;
  /** Có sẵn khi đơn đã completed — bảng quyết toán (BR-32) */
  settlement?: {
    deposit: number;
    feesTotal: number;
    refundAmount: number;
    refundedAt: string | null;
    outstanding: number;
  };
  cancellation?: {
    cancelledAt: string;
    reason: string;
    rentalRefunded: number;
    depositRefunded: number;
  };
}

/* ========================================================================== */
/* Khách hàng                                                                  */
/* ========================================================================== */

export interface Measurements {
  heightCm: number | null;
  weightKg: number | null;
  bustCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  preferredSize: string | null;
}

export interface Address {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  /** Ngoài vùng giao → chỉ cho phép nhận tại shop (UC-04 luồng phụ 4a) */
  deliverySupported: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  idCardNote: string;
  measurements: Measurements;
  addresses: Address[];
  memberTier: string;
  completedRentals: number;
}

export interface Review {
  id: string;
  productSlug: string;
  orderCode: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  sizeWorn: string;
  heightCm?: number;
  photos: ProductImage[];
  reply?: { content: string; at: string };
  status: "approved" | "pending";
}

export interface AppNotification {
  id: string;
  type: "order" | "return" | "promotion" | "review" | "payment";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface Promotion {
  code: string;
  type: "percent" | "fixed" | "freeship";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  description: string;
  endsAt: ISODate;
}
