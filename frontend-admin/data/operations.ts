import { addDays, todayISO, type ISODate } from "@/lib/date";
import { buildQuote } from "@/lib/pricing";
import { SETTINGS, STORE } from "@/lib/settings";
import type {
  AdminCustomer,
  ApprovalRequest,
  Booking,
  ConditionGrade,
  MaintenanceTask,
  OpsNotification,
  RentalUnit,
  StaffUser,
} from "@/lib/admin-types";
import type { Order, OrderFee, OrderItem, OrderStatus, Payment, PaymentPlan, PickupMethod } from "@/lib/types";
import { hashString, seededRandom } from "@/lib/utils";
import { cleanBufferFor } from "./catalog";
import { getProduct, PRODUCTS } from "./products";

const TODAY = todayISO();

/* ==========================================================================
   Nhân sự
   ========================================================================== */

export const STAFF: StaffUser[] = [
  {
    id: "u-staff-01",
    name: "Trần Thanh Hằng",
    email: "hang.tran@stylerent.vn",
    role: "staff",
    status: "active",
    lastActiveAt: iso(0, 8, 42),
    shift: "Ca sáng 08:00 – 16:00",
  },
  {
    id: "u-staff-02",
    name: "Nguyễn Đức Huy",
    email: "huy.nguyen@stylerent.vn",
    role: "staff",
    status: "active",
    lastActiveAt: iso(0, 9, 5),
    shift: "Ca chiều 13:00 – 21:00",
  },
  {
    id: "u-wh-01",
    name: "Phạm Văn Lộc",
    email: "loc.pham@stylerent.vn",
    role: "warehouse",
    status: "active",
    lastActiveAt: iso(0, 7, 55),
    shift: "Kho & giặt ủi",
  },
  {
    id: "u-wh-02",
    name: "Lê Thị Bích",
    email: "bich.le@stylerent.vn",
    role: "warehouse",
    status: "active",
    lastActiveAt: iso(-1, 17, 10),
    shift: "Xưởng sửa chữa",
  },
  {
    id: "u-mgr-01",
    name: "Võ Minh Châu",
    email: "chau.vo@stylerent.vn",
    role: "manager",
    status: "active",
    lastActiveAt: iso(0, 8, 2),
  },
  {
    id: "u-adm-01",
    name: "Lê Võ Nhật Pin",
    email: "pin.le@stylerent.vn",
    role: "admin",
    status: "active",
    lastActiveAt: iso(0, 9, 30),
  },
];

export const CURRENT_USER_BY_ROLE = {
  staff: STAFF[0],
  warehouse: STAFF[2],
  manager: STAFF[4],
  admin: STAFF[5],
} as const;

/* ==========================================================================
   Khách hàng
   ========================================================================== */

export const CUSTOMERS: AdminCustomer[] = [
  cust("c-01", "Nguyễn Khánh Linh", "0908 412 337", "khanhlinh.nguyen@gmail.com", {
    totalRentals: 9,
    totalSpend: 14_820_000,
    lateReturns: 0,
    damageIncidents: 0,
    address: "48 Nguyễn Thị Minh Khai, P. Đa Kao, Q.1, TP.HCM",
    measurements: { heightCm: 163, weightKg: 50, bust: 84, waist: 65, hip: 90 },
    lastRentalAt: iso(-1, 9, 30),
  }),
  cust("c-02", "Trần Mỹ Duyên", "0937 118 204", "duyen.tran@gmail.com", {
    totalRentals: 6,
    totalSpend: 8_450_000,
    lateReturns: 1,
    damageIncidents: 1,
    address: "12 Sư Vạn Hạnh, P.12, Q.10, TP.HCM",
    measurements: { heightCm: 160, weightKg: 48, bust: 82, waist: 63, hip: 88 },
    lastRentalAt: iso(-4, 10, 0),
    note: "Đơn tháng 7 có vết trà ở tà váy, đã thu phí giặt đặc biệt.",
  }),
  cust("c-03", "Lê Hoàng Nam", "0903 776 512", "nam.le@gmail.com", {
    totalRentals: 4,
    totalSpend: 6_100_000,
    lateReturns: 2,
    damageIncidents: 0,
    address: "220 Lý Thường Kiệt, P.14, Q.10, TP.HCM",
    measurements: null,
    lastRentalAt: iso(-3, 18, 0),
    note: "Hay trả trễ — nhắc trước hạn 1 ngày.",
  }),
  cust("c-04", "Phạm Thu Trang", "0916 330 887", "trang.pham@gmail.com", {
    totalRentals: 12,
    totalSpend: 22_300_000,
    lateReturns: 0,
    damageIncidents: 0,
    address: "5 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM",
    measurements: { heightCm: 168, weightKg: 54, bust: 86, waist: 67, hip: 92 },
    lastRentalAt: iso(-2, 11, 0),
    note: "Khách quen, thường thuê váy cưới cho studio ảnh.",
  }),
  cust("c-05", "Vũ Hà My", "0988 204 119", "hamy.vu@gmail.com", {
    totalRentals: 7,
    totalSpend: 11_050_000,
    lateReturns: 0,
    damageIncidents: 1,
    address: "Vinhomes Central Park, Q. Bình Thạnh, TP.HCM",
    measurements: { heightCm: 166, weightKg: 52, bust: 85, waist: 66, hip: 91 },
    lastRentalAt: iso(-6, 16, 0),
  }),
  cust("c-06", "Đỗ Trung Kiên", "0901 554 328", "kien.do@gmail.com", {
    totalRentals: 3,
    totalSpend: 3_900_000,
    lateReturns: 0,
    damageIncidents: 0,
    address: "77 Phan Xích Long, Q. Phú Nhuận, TP.HCM",
    measurements: null,
    lastRentalAt: iso(-9, 14, 0),
  }),
  cust("c-07", "Ngô Phương Anh", "0977 812 460", "phuonganh.ngo@gmail.com", {
    totalRentals: 5,
    totalSpend: 7_240_000,
    lateReturns: 1,
    damageIncidents: 2,
    address: "31 Trần Hưng Đạo, Q.5, TP.HCM",
    measurements: { heightCm: 158, weightKg: 47, bust: 80, waist: 61, hip: 86 },
    lastRentalAt: iso(-12, 10, 0),
    note: "2 lần hư hỏng nhẹ — nhắc kỹ quy định khi bàn giao.",
  }),
  cust("c-08", "Bùi Thuỳ Dương", "0932 447 015", "duong.bui@gmail.com", {
    totalRentals: 2,
    totalSpend: 2_450_000,
    lateReturns: 0,
    damageIncidents: 0,
    address: "9 Hoàng Diệu, Q.4, TP.HCM",
    measurements: { heightCm: 162, weightKg: 51, bust: 84, waist: 66, hip: 90 },
    lastRentalAt: iso(-20, 15, 0),
  }),
  cust("c-09", "Hoàng Minh Quân", "0912 668 330", "quan.hoang@gmail.com", {
    totalRentals: 8,
    totalSpend: 9_800_000,
    lateReturns: 0,
    damageIncidents: 0,
    address: "154 Cộng Hoà, Q. Tân Bình, TP.HCM",
    measurements: null,
    lastRentalAt: iso(-5, 9, 0),
  }),
  cust("c-10", "Lý Gia Bảo", "0967 093 221", "bao.ly@gmail.com", {
    totalRentals: 1,
    totalSpend: 1_200_000,
    lateReturns: 0,
    damageIncidents: 1,
    address: "Khu dân cư Him Lam, Q.7, TP.HCM",
    measurements: null,
    lastRentalAt: iso(-45, 11, 0),
    status: "blocked",
    blacklistReason: "Làm mất 1 clutch dạ tiệc, chưa hoàn tất bồi thường.",
  }),
];

/* ==========================================================================
   Cá thể trang phục (`rental_units`)
   ========================================================================== */

const LOCATIONS = ["A1-01", "A1-02", "A1-03", "A2-04", "A2-05", "B1-01", "B1-02", "B2-06", "C1-03", "C2-07"];
const GRADES: ConditionGrade[] = ["new", "good", "good", "good", "fair", "fair", "worn"];

function buildUnits(): RentalUnit[] {
  const units: RentalUnit[] = [];
  for (const product of PRODUCTS) {
    for (const variant of product.variants) {
      for (let i = 0; i < variant.unitCount; i++) {
        const unitCode = `${variant.barcode}-${String(i + 1).padStart(3, "0")}`;
        const rnd = seededRandom(hashString(`unit:${unitCode}`));
        const rentalCount = Math.round(4 + rnd() * 42);
        const purchaseMonthsAgo = 6 + Math.floor(rnd() * 30);
        units.push({
          id: unitCode,
          unitCode,
          variantId: variant.id,
          productSlug: product.slug,
          productName: product.name,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          status: "available",
          conditionGrade: GRADES[Math.floor(rnd() * GRADES.length)],
          purchaseDate: addDays(TODAY, -purchaseMonthsAgo * 30),
          purchaseCost: Math.round((product.replacementValue * (0.55 + rnd() * 0.2)) / 50_000) * 50_000,
          rentalCount,
          lastCleanedAt: iso(-Math.floor(rnd() * 20) - 1, 16, 0),
          location: LOCATIONS[Math.floor(rnd() * LOCATIONS.length)],
          revenueToDate: rentalCount * variant.pricePerDay * (2 + Math.round(rnd() * 2)),
          maintenanceCost: Math.round((rnd() * 6) / 1) * 50_000,
        });
      }
    }
  }
  return units;
}

export const UNITS: RentalUnit[] = buildUnits();
const UNIT_BY_CODE = new Map(UNITS.map((u) => [u.unitCode, u]));

export function getUnit(code: string): RentalUnit | undefined {
  return UNIT_BY_CODE.get(code);
}

export function unitsOfVariant(variantId: string): RentalUnit[] {
  return UNITS.filter((u) => u.variantId === variantId);
}

/* ==========================================================================
   Đơn thuê — 22 đơn phủ toàn bộ §4.1
   ========================================================================== */

interface ItemSeed {
  slug: string;
  size: string;
  color: string;
  unit?: number;
  quantity?: number;
  reviewed?: boolean;
}

interface OrderSeed {
  seq: number;
  status: OrderStatus;
  customer: string;
  createdOffset: number;
  pickupOffset: number;
  returnOffset: number;
  pickupMethod: PickupMethod;
  paymentPlan: PaymentPlan;
  channel?: "online" | "walk_in";
  items: ItemSeed[];
  promotionCode?: string;
  note?: string;
  internalNote?: string;
  paidOnPickup?: boolean;
  fees?: OrderFee[];
  cancelReason?: string;
  /** Giờ hẹn nhận trong ngày — dùng cho hàng đợi vận hành */
  pickupHour?: number;
}

const ORDER_SEEDS: OrderSeed[] = [
  // ── Chờ thanh toán ────────────────────────────────────────────────────
  {
    seq: 31,
    status: "pending_payment",
    customer: "c-08",
    createdOffset: 0,
    pickupOffset: 5,
    returnOffset: 7,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "dam-nhung-cocktail-ruou-vang", size: "M", color: "Rượu vang" }],
    internalNote: "Khách mới, chưa từng thuê — nhắc mang giấy tờ thế chân.",
  },
  {
    seq: 32,
    status: "pending_payment",
    customer: "c-06",
    createdOffset: 0,
    pickupOffset: 2,
    returnOffset: 4,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "vest-nam-navy-may-do", size: "M", color: "Navy" }],
    internalNote: "Đơn sắp hết hạn giữ chỗ — gọi nhắc khách.",
  },
  // ── Đã xác nhận ───────────────────────────────────────────────────────
  {
    seq: 29,
    status: "confirmed",
    customer: "c-04",
    createdOffset: -1,
    pickupOffset: 9,
    returnOffset: 12,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    items: [
      { slug: "vay-cuoi-ren-phap-tay-phong", size: "M", color: "Trắng ngà" },
      { slug: "bong-tai-pha-le-nho-giot", size: "Free", color: "Bạc" },
    ],
    note: "Chụp ảnh cưới ngoại cảnh, cần váy sạch tuyệt đối.",
  },
  {
    seq: 30,
    status: "confirmed",
    customer: "c-09",
    createdOffset: -1,
    pickupOffset: 4,
    returnOffset: 6,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "tuxedo-den-ve-satin", size: "L", color: "Đen" }],
  },
  {
    seq: 28,
    status: "confirmed",
    customer: "c-05",
    createdOffset: -2,
    pickupOffset: 6,
    returnOffset: 9,
    pickupMethod: "at_store",
    paymentPlan: "full",
    promotionCode: "SEN10",
    items: [{ slug: "dam-da-hoi-champagne-xep-ly", size: "S", color: "Champagne" }],
  },
  // ── Đang soạn đồ ──────────────────────────────────────────────────────
  {
    seq: 26,
    status: "preparing",
    customer: "c-02",
    createdOffset: -3,
    pickupOffset: 1,
    returnOffset: 4,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    pickupHour: 9,
    items: [
      { slug: "ao-dai-cach-tan-do-theu-sen", size: "M", color: "Đỏ", unit: 1 },
      { slug: "clutch-ngoc-trai-da-tiec", size: "Free", color: "Trắng ngọc", unit: 2 },
    ],
    note: "Lễ ăn hỏi buổi sáng.",
  },
  {
    seq: 27,
    status: "preparing",
    customer: "c-07",
    createdOffset: -2,
    pickupOffset: 1,
    returnOffset: 3,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    pickupHour: 15,
    items: [{ slug: "dam-hoa-maxi-vuon-xuan", size: "S", color: "Hoa xanh", unit: 1 }],
    internalNote: "Khách từng làm hư nhẹ 2 lần — kiểm kỹ khi bàn giao.",
  },
  // ── Sẵn sàng bàn giao ─────────────────────────────────────────────────
  {
    seq: 24,
    status: "ready",
    customer: "c-05",
    createdOffset: -4,
    pickupOffset: 0,
    returnOffset: 3,
    pickupMethod: "at_store",
    paymentPlan: "full",
    pickupHour: 10,
    items: [{ slug: "dam-da-hoi-satin-midnight", size: "S", color: "Xanh đêm", unit: 2 }],
  },
  {
    seq: 25,
    status: "ready",
    customer: "c-04",
    createdOffset: -3,
    pickupOffset: 0,
    returnOffset: 4,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    pickupHour: 14,
    items: [{ slug: "trench-coat-oversized-be", size: "M", color: "Be", unit: 1 }],
    note: "Giao trước 15h giúp mình nhé.",
  },
  // ── Đang thuê ─────────────────────────────────────────────────────────
  {
    seq: 18,
    status: "in_use",
    customer: "c-01",
    createdOffset: -7,
    pickupOffset: -2,
    returnOffset: 1,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    promotionCode: "SEN10",
    items: [
      { slug: "ao-dai-cach-tan-do-theu-sen", size: "M", color: "Đỏ", unit: 3 },
      { slug: "vest-nam-navy-may-do", size: "L", color: "Navy", unit: 1 },
    ],
    note: "Lễ ăn hỏi sáng thứ Bảy, cần đồ phẳng phiu.",
  },
  {
    seq: 19,
    status: "in_use",
    customer: "c-09",
    createdOffset: -6,
    pickupOffset: -1,
    returnOffset: 0,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "ao-dai-nam-gam-lam", size: "L", color: "Lam", unit: 1 }],
    internalNote: "Trả trong hôm nay.",
  },
  {
    seq: 20,
    status: "in_use",
    customer: "c-04",
    createdOffset: -5,
    pickupOffset: -1,
    returnOffset: 2,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "vay-cuoi-satin-toi-gian", size: "M", color: "Ngà", unit: 1 }],
  },
  // ── Quá hạn ───────────────────────────────────────────────────────────
  {
    seq: 14,
    status: "overdue",
    customer: "c-03",
    createdOffset: -12,
    pickupOffset: -8,
    returnOffset: -3,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "do-bieu-dien-anh-kim", size: "M", color: "Xanh ngọc", unit: 1 }],
    internalNote: "Đã gọi 2 lần, khách hẹn trả cuối tuần.",
  },
  {
    seq: 15,
    status: "overdue",
    customer: "c-07",
    createdOffset: -11,
    pickupOffset: -7,
    returnOffset: -1,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "dam-lua-halter-toi-gian", size: "S", color: "Nâu đất", unit: 1 }],
  },
  // ── Đang kiểm tra khi trả ─────────────────────────────────────────────
  {
    seq: 12,
    status: "inspecting",
    customer: "c-05",
    createdOffset: -10,
    pickupOffset: -6,
    returnOffset: -1,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "ao-khoac-da-vintage", size: "M", color: "Nâu hạt dẻ", unit: 1 }],
    internalNote: "Đang chờ ảnh minh chứng từ kho.",
  },
  // ── Chờ Manager duyệt (BR-33) ─────────────────────────────────────────
  {
    seq: 11,
    status: "pending_approval",
    customer: "c-02",
    createdOffset: -14,
    pickupOffset: -9,
    returnOffset: -4,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "vay-cuoi-ren-phap-tay-phong", size: "S", color: "Trắng tinh", unit: 1 }],
    fees: [
      {
        id: "fee-11-1",
        type: "damage_minor",
        label: "Phí hư hỏng nhẹ",
        amount: 1_200_000,
        reason: "Rách ren tay áo khoảng 4cm, cần vá thủ công",
        unitCode: "VC-S-TR-001",
      },
    ],
    internalNote: "Phí vượt hạn mức Staff 500.000₫ → chuyển Manager duyệt.",
  },
  // ── Khiếu nại ─────────────────────────────────────────────────────────
  {
    seq: 10,
    status: "disputed",
    customer: "c-07",
    createdOffset: -18,
    pickupOffset: -13,
    returnOffset: -8,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "set-linen-mua-he", size: "S", color: "Cát", unit: 1 }],
    fees: [
      {
        id: "fee-10-1",
        type: "dirty",
        label: "Phí giặt đặc biệt",
        amount: 150_000,
        reason: "Vết dầu ở gấu váy",
        unitCode: "SL-S-CA-001",
      },
    ],
    internalNote: "Khách cho rằng vết bẩn đã có sẵn — đối chiếu biên bản lúc giao.",
  },
  // ── Hoàn tất ──────────────────────────────────────────────────────────
  {
    seq: 7,
    status: "completed",
    customer: "c-02",
    createdOffset: -26,
    pickupOffset: -21,
    returnOffset: -18,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "dam-hoa-maxi-vuon-xuan", size: "S", color: "Hoa xanh", unit: 2, reviewed: true }],
    fees: [
      {
        id: "fee-7-1",
        type: "dirty",
        label: "Phí giặt đặc biệt",
        amount: 100_000,
        reason: "Vết trà ở tà váy, xử lý tẩy chuyên dụng",
        unitCode: "DM-S-HO-002",
      },
    ],
  },
  {
    seq: 6,
    status: "completed",
    customer: "c-01",
    createdOffset: -34,
    pickupOffset: -30,
    returnOffset: -27,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "ao-dai-lua-ngu-sac-ngoc-trai", size: "S", color: "Ngà", unit: 1, reviewed: true }],
  },
  {
    seq: 5,
    status: "completed",
    customer: "c-03",
    createdOffset: -40,
    pickupOffset: -36,
    returnOffset: -33,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "vest-nam-navy-may-do", size: "M", color: "Navy", unit: 2 }],
    fees: [
      {
        id: "fee-5-1",
        type: "late",
        label: "Phí trễ hạn 2 ngày",
        amount: 900_000,
        reason: "Trả trễ 2 ngày, hệ số 1.5× tiền thuê ngày",
        unitCode: "VS-M-NA-002",
      },
    ],
  },
  // ── Huỷ & hết hạn ─────────────────────────────────────────────────────
  {
    seq: 4,
    status: "cancelled",
    customer: "c-06",
    createdOffset: -47,
    pickupOffset: -40,
    returnOffset: -37,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "tuxedo-den-ve-satin", size: "M", color: "Đen" }],
    cancelReason: "Sự kiện bị dời lịch",
  },
  {
    seq: 3,
    status: "expired",
    customer: "c-10",
    createdOffset: -52,
    pickupOffset: -45,
    returnOffset: -43,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    items: [{ slug: "clutch-ngoc-trai-da-tiec", size: "Free", color: "Vàng đồng" }],
  },
  // ── Đơn tại quầy ──────────────────────────────────────────────────────
  {
    seq: 21,
    status: "in_use",
    customer: "c-06",
    channel: "walk_in",
    createdOffset: -2,
    pickupOffset: -2,
    returnOffset: 1,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "dam-ivory-toi-gian-co-vuong", size: "M", color: "Ivory", unit: 1 }],
    internalNote: "Khách walk-in, đã nhận CCCD thế chân.",
  },
];

/* -------------------------------------------------------------------------- */

function buildOrder(seed: OrderSeed): Order {
  const customer = CUSTOMERS.find((c) => c.id === seed.customer)!;
  const pickupDate = addDays(TODAY, seed.pickupOffset);
  const returnDate = addDays(TODAY, seed.returnOffset);
  const days = Math.max(1, seed.returnOffset - seed.pickupOffset);

  const resolved = seed.items.map((item) => {
    const product = getProduct(item.slug)!;
    const variant = product.variants.find((v) => v.size === item.size && v.color === item.color)!;
    return { product, variant, quantity: item.quantity ?? 1, seed: item };
  });

  const quote = buildQuote(
    resolved.map((r) => ({ variant: r.variant, days, quantity: r.quantity })),
    {
      promotion: seed.promotionCode ? { code: seed.promotionCode, type: "percent", value: 10, maxDiscount: 300_000, minOrder: 800_000, description: "", endsAt: TODAY } : null,
      pickupMethod: seed.pickupMethod,
      paymentPlan: seed.paymentPlan,
    },
  );

  const assigned = !["pending_payment", "confirmed", "cancelled", "expired"].includes(seed.status);

  const items: OrderItem[] = resolved.map((r, i) => {
    const line = quote.lines[i];
    const unitCode = r.seed.unit ? `${r.variant.barcode}-${String(r.seed.unit).padStart(3, "0")}` : null;
    return {
      productSlug: r.product.slug,
      productNameSnapshot: r.product.name,
      variantSnapshot: { size: r.variant.size, color: r.variant.color, colorHex: r.variant.colorHex },
      image: r.product.images[0],
      quantity: r.quantity,
      days,
      unitRentalPrice: line.rentalPrice.total,
      unitDeposit: r.variant.depositAmount,
      lineRentalTotal: line.lineRentalTotal,
      lineDepositTotal: line.lineDepositTotal,
      unitCodes: assigned && unitCode ? [unitCode] : null,
      reviewed: r.seed.reviewed,
    };
  });

  const fees = seed.fees ?? [];
  const extraFeesTotal = fees.reduce((s, f) => s + f.amount, 0);
  const code = orderCode(seed.createdOffset, seed.seq);

  const paidDeposit = seed.status === "pending_payment" || seed.status === "expired" ? 0 : quote.dueNow;
  const paidRest = seed.paidOnPickup ? quote.dueOnPickup : 0;
  const paidAmount = paidDeposit + paidRest;

  const payments: Payment[] = [];
  if (paidDeposit > 0) {
    payments.push({
      id: `pm-${code}-1`,
      code: `PM${code.slice(2)}01`,
      type: seed.paymentPlan === "full" ? "rental" : "deposit",
      method: seed.channel === "walk_in" ? "cash" : "vnpay",
      amount: paidDeposit,
      status: "succeeded",
      paidAt: iso(seed.createdOffset, 20, 14),
    });
  }
  if (paidRest > 0) {
    payments.push({
      id: `pm-${code}-2`,
      code: `PM${code.slice(2)}02`,
      type: "rental",
      method: "cash",
      amount: paidRest,
      status: "succeeded",
      paidAt: iso(seed.pickupOffset, 9, 30),
    });
  }

  const flow: OrderStatus[] = ["confirmed", "preparing", "ready", "in_use", "overdue", "inspecting", "completed"];
  const reachedIndex = flow.indexOf(seed.status);
  const logs = [
    {
      status: "pending_payment" as OrderStatus,
      at: iso(seed.createdOffset, 20, 12),
      note: seed.channel === "walk_in" ? "Nhân viên tạo đơn tại quầy" : "Khách đặt đơn online",
      actor: seed.channel === "walk_in" ? STAFF[0].name : customer.name,
    },
    ...(reachedIndex >= 0
      ? flow.slice(0, reachedIndex + 1).map((status, i) => ({
          status,
          at: iso(seed.createdOffset + i, 9 + i, 5),
          actor: actorFor(status),
        }))
      : []),
    ...(seed.status === "cancelled"
      ? [{ status: "cancelled" as OrderStatus, at: iso(seed.createdOffset + 1, 11, 20), note: seed.cancelReason, actor: STAFF[0].name }]
      : []),
    ...(seed.status === "expired"
      ? [{ status: "expired" as OrderStatus, at: iso(seed.createdOffset, 20, 44), note: "Job ExpireUnpaidOrders tự huỷ sau 30 phút", actor: "Hệ thống" }]
      : []),
    ...(seed.status === "pending_approval"
      ? [{ status: "pending_approval" as OrderStatus, at: iso(seed.returnOffset, 17, 20), note: "Phí vượt hạn mức nhân viên", actor: STAFF[0].name }]
      : []),
    ...(seed.status === "disputed"
      ? [{ status: "disputed" as OrderStatus, at: iso(seed.returnOffset, 18, 5), note: "Khách không đồng ý phí giặt đặc biệt", actor: customer.name }]
      : []),
  ];

  const settlement =
    seed.status === "completed"
      ? {
          deposit: quote.totalDeposit,
          feesTotal: extraFeesTotal,
          refundAmount: Math.max(0, quote.totalDeposit - extraFeesTotal),
          refundedAt: iso(seed.returnOffset + 2, 16, 0),
          outstanding: Math.max(0, extraFeesTotal - quote.totalDeposit),
        }
      : undefined;

  const cancellation =
    seed.status === "cancelled"
      ? {
          cancelledAt: iso(seed.createdOffset + 1, 11, 20),
          reason: seed.cancelReason ?? "Khách thay đổi kế hoạch",
          rentalRefunded: Math.round((paidAmount - quote.totalDeposit) * 0.7),
          depositRefunded: quote.totalDeposit,
        }
      : undefined;

  return {
    code,
    status: seed.status,
    channel: seed.channel ?? "online",
    createdAt: iso(seed.createdOffset, 20, 12),
    pickupMethod: seed.pickupMethod,
    pickupDate,
    returnDate,
    returnDueAt: iso(seed.returnOffset, STORE.return_due_hour, 0),
    receiverName: customer.name,
    receiverPhone: customer.phone,
    address: seed.pickupMethod === "delivery" ? customer.address : null,
    items,
    subtotalRental: quote.subtotalRental,
    discount: quote.discount,
    promotionCode: quote.discountLabel,
    shippingFee: quote.shippingFee,
    totalDeposit: quote.totalDeposit,
    extraFeesTotal,
    grandTotal: quote.grandTotal + extraFeesTotal,
    paidAmount,
    refundedAmount: settlement ? settlement.refundAmount : 0,
    paymentPlan: seed.paymentPlan,
    payments,
    fees,
    logs,
    note: seed.note,
    settlement,
    cancellation,
  };
}

function actorFor(status: OrderStatus): string {
  switch (status) {
    case "confirmed":
      return "Hệ thống (IPN)";
    case "preparing":
    case "ready":
      return STAFF[2].name;
    case "in_use":
      return STAFF[0].name;
    case "overdue":
      return "Hệ thống (cron)";
    case "inspecting":
      return STAFF[1].name;
    default:
      return STAFF[0].name;
  }
}

export const ORDERS: Order[] = ORDER_SEEDS.map(buildOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** Giờ hẹn nhận trong ngày, giữ riêng để dựng hàng đợi vận hành. */
export const ORDER_PICKUP_HOUR: Record<string, number> = Object.fromEntries(
  ORDER_SEEDS.filter((s) => s.pickupHour).map((s) => [orderCode(s.createdOffset, s.seq), s.pickupHour!]),
);

export const ORDER_INTERNAL_NOTE: Record<string, string> = Object.fromEntries(
  ORDER_SEEDS.filter((s) => s.internalNote).map((s) => [orderCode(s.createdOffset, s.seq), s.internalNote!]),
);

export const ORDER_CUSTOMER: Record<string, string> = Object.fromEntries(
  ORDER_SEEDS.map((s) => [orderCode(s.createdOffset, s.seq), s.customer]),
);

export function getOrder(code: string): Order | undefined {
  return ORDERS.find((o) => o.code === code);
}

export function ordersOfCustomer(customerId: string): Order[] {
  return ORDERS.filter((o) => ORDER_CUSTOMER[o.code] === customerId);
}

export function customerOfOrder(code: string): AdminCustomer | undefined {
  return CUSTOMERS.find((c) => c.id === ORDER_CUSTOMER[code]);
}

/* ==========================================================================
   Áp trạng thái cá thể theo đơn đang chạy + sinh bookings
   ========================================================================== */

const BOOKINGS: Booking[] = [];

function applyOrdersToUnits() {
  for (const order of ORDERS) {
    const buffer = 1;
    for (const item of order.items) {
      const product = getProduct(item.productSlug);
      const cleanBuffer = product ? cleanBufferFor(product.categorySlug) : buffer;
      const variantId = product?.variants.find(
        (v) => v.size === item.variantSnapshot.size && v.color === item.variantSnapshot.color,
      )?.id;
      if (!variantId) continue;

      const unitCode = item.unitCodes?.[0] ?? null;
      const unit = unitCode ? UNIT_BY_CODE.get(unitCode) : undefined;

      // Trạng thái cá thể suy từ trạng thái đơn (§4.2)
      if (unit) {
        if (order.status === "preparing" || order.status === "ready") unit.status = "reserved";
        if (order.status === "in_use" || order.status === "overdue") unit.status = "rented";
        if (order.status === "inspecting") unit.status = "cleaning";
      }

      const bookingStatus: Booking["status"] =
        order.status === "pending_payment"
          ? "held"
          : ["cancelled", "expired"].includes(order.status)
            ? "cancelled"
            : ["completed"].includes(order.status)
              ? "fulfilled"
              : "confirmed";

      BOOKINGS.push({
        id: `bk-${order.code}-${unitCode ?? variantId}`,
        orderCode: order.code,
        variantId,
        unitId: unit?.id ?? null,
        unitCode: unit?.unitCode ?? null,
        pickupDate: order.pickupDate,
        returnDate: order.returnDate,
        busyFrom: order.pickupDate,
        busyTo: addDays(order.returnDate, cleanBuffer),
        status: bookingStatus,
        customerName: order.receiverName,
      });
    }
  }
}

applyOrdersToUnits();

/** Thêm lịch bận tương lai để màn hình lịch có mật độ thật. */
function seedFutureBookings() {
  const candidates = UNITS.filter((u) => u.status === "available");
  candidates.forEach((unit, index) => {
    const rnd = seededRandom(hashString(`future:${unit.unitCode}`));
    if (rnd() > 0.45) return;
    const start = 3 + Math.floor(rnd() * 24);
    const duration = 1 + Math.floor(rnd() * 4);
    const product = getProduct(unit.productSlug);
    const cleanBuffer = product ? cleanBufferFor(product.categorySlug) : 1;
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    BOOKINGS.push({
      id: `bk-future-${unit.unitCode}`,
      orderCode: null,
      variantId: unit.variantId,
      unitId: unit.id,
      unitCode: unit.unitCode,
      pickupDate: addDays(TODAY, start),
      returnDate: addDays(TODAY, start + duration),
      busyFrom: addDays(TODAY, start),
      busyTo: addDays(TODAY, start + duration + cleanBuffer),
      status: "confirmed",
      customerName: customer.name,
    });
  });
}

seedFutureBookings();

export { BOOKINGS };

export function bookingsOfUnit(unitCode: string): Booking[] {
  return BOOKINGS.filter((b) => b.unitCode === unitCode && b.status !== "cancelled").sort((a, b) =>
    a.busyFrom.localeCompare(b.busyFrom),
  );
}

export function nextBookingOfUnit(unitCode: string, from: ISODate = TODAY): Booking | undefined {
  return bookingsOfUnit(unitCode).find((b) => b.pickupDate >= from);
}

/* ==========================================================================
   Hàng đợi giặt ủi / sửa chữa (`maintenance_tasks`)
   ========================================================================== */

function buildMaintenance(): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [];
  const seeds: {
    unitCode: string;
    type: MaintenanceTask["type"];
    status: MaintenanceTask["status"];
    reason: string;
    assignedTo?: string;
    cost?: number;
    startedOffset?: number;
    note?: string;
  }[] = [
    { unitCode: "AD-M-DO-002", type: "cleaning", status: "todo", reason: "Bẩn nặng — vết trà ở tà áo", note: "Ưu tiên: có booking ngày kia" },
    { unitCode: "DH-S-XA-001", type: "cleaning", status: "todo", reason: "Giặt định kỳ sau lượt thuê" },
    { unitCode: "VS-L-NA-002", type: "repair", status: "todo", reason: "Bung chỉ cửa tay trái", cost: 80_000 },
    { unitCode: "DN-M-RU-001", type: "cleaning", status: "doing", reason: "Giặt thường", assignedTo: "u-wh-01", startedOffset: 0 },
    { unitCode: "DL-S-NA-001", type: "cleaning", status: "doing", reason: "Khử mùi nước hoa", assignedTo: "u-wh-01", startedOffset: 0 },
    { unitCode: "AK-M-NA-001", type: "repair", status: "doing", reason: "Dưỡng da, xử lý vết xước cổ áo", assignedTo: "u-wh-02", cost: 250_000, startedOffset: -1 },
    { unitCode: "VC-S-TR-001", type: "repair", status: "quality_check", reason: "Vá ren tay áo 4cm", assignedTo: "u-wh-02", cost: 1_200_000, startedOffset: -2 },
    { unitCode: "TC-S-BE-001", type: "alteration", status: "quality_check", reason: "Lên lai 3cm theo yêu cầu khách", assignedTo: "u-wh-02", cost: 120_000, startedOffset: -1 },
    { unitCode: "DM-S-HO-002", type: "cleaning", status: "done", reason: "Tẩy vết trà chuyên dụng", assignedTo: "u-wh-01", cost: 100_000, startedOffset: -2 },
    { unitCode: "ADN-S-NG-001", type: "cleaning", status: "done", reason: "Giặt hấp lụa", assignedTo: "u-wh-01", startedOffset: -3 },
    { unitCode: "BD-M-XA-001", type: "repair", status: "failed", reason: "Đá phản quang bong nhiều, QC không đạt", assignedTo: "u-wh-02", cost: 300_000, startedOffset: -4 },
  ];

  for (const s of seeds) {
    const unit = UNIT_BY_CODE.get(s.unitCode);
    if (!unit) continue;
    if (["todo", "doing", "quality_check"].includes(s.status)) {
      unit.status = s.type === "repair" ? "repairing" : s.type === "alteration" ? "repairing" : "cleaning";
    }
    if (s.status === "failed") unit.status = "repairing";
    const next = nextBookingOfUnit(unit.unitCode);
    tasks.push({
      id: `mt-${s.unitCode}-${s.type}`,
      unitId: unit.id,
      unitCode: unit.unitCode,
      productName: unit.productName,
      variantLabel: `${unit.size} · ${unit.color}`,
      type: s.type,
      status: s.status,
      reason: s.reason,
      assignedTo: s.assignedTo ?? null,
      cost: s.cost ?? 0,
      startedAt: s.startedOffset !== undefined ? iso(s.startedOffset, 10, 20) : null,
      finishedAt: s.status === "done" ? iso((s.startedOffset ?? -1) + 1, 15, 0) : null,
      dueAt: next ? addDays(next.pickupDate, -1) : null,
      nextBookingDate: next?.pickupDate ?? null,
      note: s.note,
    });
  }

  // Vài cá thể thanh lý / mất để đủ vòng đời §4.2
  const retired = UNIT_BY_CODE.get("VC-M-TR-001");
  if (retired) {
    retired.status = "retired";
    retired.note = "Ố vàng phần tulle, không phục hồi được — thanh lý 08/2026.";
  }
  const lost = UNIT_BY_CODE.get("CL-Free-VA-001");
  if (lost) {
    lost.status = "lost";
    lost.note = "Khách Lý Gia Bảo làm mất, đang theo dõi công nợ bồi thường.";
  }

  return tasks.sort((a, b) => {
    const ad = a.dueAt ?? "9999";
    const bd = b.dueAt ?? "9999";
    return ad.localeCompare(bd);
  });
}

export const MAINTENANCE: MaintenanceTask[] = buildMaintenance();

/* ==========================================================================
   Hàng đợi duyệt của Manager
   ========================================================================== */

export const APPROVALS: ApprovalRequest[] = [
  {
    id: "ap-01",
    kind: "fee_over_limit",
    orderCode: ORDERS.find((o) => o.status === "pending_approval")?.code ?? "",
    customerName: "Trần Mỹ Duyên",
    requestedBy: STAFF[0].name,
    requestedByRole: "staff",
    requestedAt: iso(-4, 17, 25),
    reason: "Rách ren tay áo váy cưới khoảng 4cm, thợ báo giá vá thủ công 1.200.000₫",
    suggestedAmount: 1_500_000,
    staffAmount: 1_200_000,
    unitCode: "VC-S-TR-001",
    evidenceCount: 3,
    status: "pending",
  },
  {
    id: "ap-02",
    kind: "refund_over_limit",
    orderCode: ORDERS.find((o) => o.status === "completed")?.code ?? "",
    customerName: "Phạm Thu Trang",
    requestedBy: STAFF[1].name,
    requestedByRole: "staff",
    requestedAt: iso(-1, 16, 40),
    reason: "Hoàn cọc váy cưới 3.000.000₫ — vượt hạn mức tự động 2.000.000₫",
    suggestedAmount: 3_000_000,
    staffAmount: 3_000_000,
    evidenceCount: 0,
    status: "pending",
  },
  {
    id: "ap-03",
    kind: "fee_waive",
    orderCode: ORDERS.find((o) => o.status === "disputed")?.code ?? "",
    customerName: "Ngô Phương Anh",
    requestedBy: STAFF[0].name,
    requestedByRole: "staff",
    requestedAt: iso(-2, 9, 15),
    reason: "Khách khiếu nại vết dầu đã có từ lúc giao — đề xuất miễn phí giặt đặc biệt",
    suggestedAmount: 150_000,
    staffAmount: 0,
    unitCode: "SL-S-CA-001",
    evidenceCount: 2,
    status: "pending",
  },
];

/* ==========================================================================
   Thông báo vận hành
   ========================================================================== */

export const NOTIFICATIONS: OpsNotification[] = [
  {
    id: "n-01",
    type: "overdue",
    title: "2 đơn đang quá hạn trả",
    body: "Đơn của Lê Hoàng Nam quá hạn 3 ngày, phí trễ đang chạy.",
    createdAt: iso(0, 7, 5),
    read: false,
    href: "/orders?quick=overdue",
    audience: ["staff", "manager", "admin"],
  },
  {
    id: "n-02",
    type: "refund_approval",
    title: "3 yêu cầu chờ bạn duyệt",
    body: "Gồm 1 phí hư hỏng vượt hạn mức và 1 hoàn cọc trên 2.000.000₫.",
    createdAt: iso(0, 8, 12),
    read: false,
    href: "/approvals",
    audience: ["manager", "admin"],
  },
  {
    id: "n-03",
    type: "payment_expiring",
    title: "Đơn sắp hết hạn giữ chỗ",
    body: "Đơn của Đỗ Trung Kiên còn 8 phút trước khi tự huỷ.",
    createdAt: iso(0, 9, 2),
    read: false,
    href: "/orders?quick=pending_payment",
    audience: ["staff", "manager", "admin"],
  },
  {
    id: "n-04",
    type: "repair_needed",
    title: "QC không đạt — cần xử lý lại",
    body: "BD-M-XA-001 bong đá phản quang, thợ đề nghị thay toàn bộ hàng đá.",
    createdAt: iso(-1, 15, 40),
    read: false,
    href: "/maintenance",
    audience: ["warehouse", "manager", "admin"],
  },
  {
    id: "n-05",
    type: "return_due",
    title: "1 đơn đến hạn trả hôm nay",
    body: "Hoàng Minh Quân — áo dài nam gấm lam, hẹn 18:00.",
    createdAt: iso(0, 6, 30),
    read: true,
    href: "/returns",
    audience: ["staff", "warehouse", "manager", "admin"],
  },
  {
    id: "n-06",
    type: "order_confirmed",
    title: "Đơn mới đã thanh toán cọc",
    body: "Phạm Thu Trang đặt váy cưới ren Pháp cho 9 ngày tới.",
    createdAt: iso(-1, 20, 18),
    read: true,
    href: "/orders",
    audience: ["staff", "manager", "admin"],
  },
  {
    id: "n-07",
    type: "review_pending",
    title: "2 đánh giá chờ kiểm duyệt",
    body: "Có 1 đánh giá kèm ảnh khách gửi cần xem trước khi hiển thị.",
    createdAt: iso(-2, 10, 0),
    read: true,
    href: "/reviews",
    audience: ["manager", "admin"],
  },
];

/* ==========================================================================
   Tiện ích
   ========================================================================== */

function iso(dayOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function orderCode(createdOffset: number, seq: number): string {
  return `CR${addDays(TODAY, createdOffset).replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;
}

function cust(
  id: string,
  name: string,
  phone: string,
  email: string,
  rest: Partial<AdminCustomer> & { address: string },
): AdminCustomer {
  return {
    id,
    name,
    phone,
    email,
    joinedAt: iso(-320 + hashString(id) % 200, 10, 0),
    status: "active",
    idCardNote: "CCCD đã đối chiếu tại quầy",
    measurements: null,
    totalRentals: 0,
    totalSpend: 0,
    lateReturns: 0,
    damageIncidents: 0,
    lastRentalAt: null,
    ...rest,
  };
}

export const SETTINGS_VALUES = SETTINGS;
