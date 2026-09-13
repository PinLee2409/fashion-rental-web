import { addDays, formatDate, todayISO, type ISODate } from "@/lib/date";
import { buildQuote } from "@/lib/pricing";
import { STORE } from "@/lib/settings";
import type {
  Order,
  OrderFee,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentPlan,
  PickupMethod,
} from "@/lib/types";
import { getProduct } from "./products";
import { PROMOTIONS } from "./promotions";

interface ItemSeed {
  slug: string;
  size: string;
  color: string;
  quantity?: number;
  unitSuffix?: string;
  reviewed?: boolean;
}

interface OrderSeed {
  seq: number;
  status: OrderStatus;
  createdOffset: number;
  pickupOffset: number;
  returnOffset: number;
  pickupMethod: PickupMethod;
  paymentPlan: PaymentPlan;
  items: ItemSeed[];
  promotionCode?: string;
  note?: string;
  fees?: OrderFee[];
  cancelReason?: string;
  /** Đã thu thêm tiền mặt khi bàn giao */
  paidOnPickup?: boolean;
}

function isoAt(offset: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function orderCode(createdOffset: number, seq: number): string {
  const iso = addDays(todayISO(), createdOffset).replace(/-/g, "");
  return `CR${iso}-${String(seq).padStart(4, "0")}`;
}

function buildOrder(seed: OrderSeed): Order {
  const pickupDate: ISODate = addDays(todayISO(), seed.pickupOffset);
  const returnDate: ISODate = addDays(todayISO(), seed.returnOffset);
  const days = Math.max(1, seed.returnOffset - seed.pickupOffset);

  const resolved = seed.items.map((item) => {
    const product = getProduct(item.slug)!;
    const variant = product.variants.find((v) => v.size === item.size && v.color === item.color)!;
    return { product, variant, quantity: item.quantity ?? 1, seed: item };
  });

  const promotion = seed.promotionCode ? PROMOTIONS.find((p) => p.code === seed.promotionCode) : null;
  const quote = buildQuote(
    resolved.map((r) => ({ variant: r.variant, days, quantity: r.quantity })),
    { promotion, pickupMethod: seed.pickupMethod, paymentPlan: seed.paymentPlan },
  );

  const items: OrderItem[] = resolved.map((r, i) => {
    const line = quote.lines[i];
    const assigned = ["confirmed", "pending_payment", "cancelled", "expired"].includes(seed.status)
      ? null
      : [`${r.variant.barcode}-${r.seed.unitSuffix ?? "001"}`];
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
      unitCodes: assigned,
      reviewed: r.seed.reviewed,
    };
  });

  const fees = seed.fees ?? [];
  const extraFeesTotal = fees.reduce((sum, f) => sum + f.amount, 0);

  const paidDeposit = seed.status === "pending_payment" ? 0 : quote.dueNow;
  const paidRest = seed.paidOnPickup ? quote.dueOnPickup : 0;
  const paidAmount = paidDeposit + paidRest;

  const code = orderCode(seed.createdOffset, seed.seq);

  const payments: Payment[] = [];
  if (paidDeposit > 0) {
    payments.push({
      id: `pay-${code}-1`,
      code: `PM${code.slice(2)}01`,
      type: (seed.paymentPlan === "full" ? "rental" : "deposit") as "rental" | "deposit",
      method: "vnpay" as const,
      amount: paidDeposit,
      status: "succeeded" as const,
      paidAt: isoAt(seed.createdOffset, 20, 14),
    });
  }
  if (paidRest > 0) {
    payments.push({
      id: `pay-${code}-2`,
      code: `PM${code.slice(2)}02`,
      type: "rental" as const,
      method: "cash" as const,
      amount: paidRest,
      status: "succeeded" as const,
      paidAt: isoAt(seed.pickupOffset, 9, 30),
    });
  }

  const logs: { status: OrderStatus; at: string; note?: string }[] = [
    { status: "pending_payment", at: isoAt(seed.createdOffset, 20, 12), note: "Khách đặt đơn online" },
  ];
  const flow: OrderStatus[] = ["confirmed", "preparing", "ready", "in_use", "overdue", "inspecting", "completed"];
  const reached = flow.slice(0, flow.indexOf(seed.status) + 1);
  reached.forEach((status, i) => {
    logs.push({ status, at: isoAt(seed.createdOffset + i, 9 + i, 0) });
  });
  if (seed.status === "cancelled") {
    logs.push({ status: "cancelled", at: isoAt(seed.createdOffset + 1, 11, 20), note: seed.cancelReason });
  }

  const settlement =
    seed.status === "completed"
      ? {
          deposit: quote.totalDeposit,
          feesTotal: extraFeesTotal,
          refundAmount: quote.totalDeposit - extraFeesTotal,
          refundedAt: isoAt(seed.returnOffset + 2, 16, 0),
          outstanding: Math.max(0, extraFeesTotal - quote.totalDeposit),
        }
      : undefined;

  const cancellation =
    seed.status === "cancelled"
      ? {
          cancelledAt: isoAt(seed.createdOffset + 1, 11, 20),
          reason: seed.cancelReason ?? "Khách thay đổi kế hoạch",
          rentalRefunded: Math.round((paidAmount - quote.totalDeposit) * 0.7),
          depositRefunded: quote.totalDeposit,
        }
      : undefined;

  return {
    code,
    status: seed.status,
    channel: "online",
    createdAt: isoAt(seed.createdOffset, 20, 12),
    pickupMethod: seed.pickupMethod,
    pickupDate,
    returnDate,
    returnDueAt: isoAt(seed.returnOffset, STORE.return_due_hour, 0),
    receiverName: "Nguyễn Khánh Linh",
    receiverPhone: "0908 412 337",
    address:
      seed.pickupMethod === "delivery"
        ? "48 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh"
        : null,
    items,
    subtotalRental: quote.subtotalRental,
    discount: quote.discount,
    promotionCode: quote.discountLabel,
    shippingFee: quote.shippingFee,
    totalDeposit: quote.totalDeposit,
    extraFeesTotal,
    grandTotal: quote.grandTotal + extraFeesTotal,
    paidAmount,
    refundedAmount: settlement
      ? settlement.refundAmount
      : cancellation
        ? cancellation.rentalRefunded + cancellation.depositRefunded
        : 0,
    paymentPlan: seed.paymentPlan,
    payments,
    fees,
    logs,
    note: seed.note,
    settlement,
    cancellation,
  };
}

const SEEDS: OrderSeed[] = [
  {
    // Đang thuê — hạn trả còn 2 ngày (Return due soon)
    seq: 7,
    status: "in_use",
    createdOffset: -6,
    pickupOffset: -1,
    returnOffset: 2,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    promotionCode: "SEN10",
    items: [
      { slug: "ao-dai-cach-tan-do-theu-sen", size: "M", color: "Đỏ", unitSuffix: "003" },
      { slug: "vest-nam-navy-may-do", size: "L", color: "Navy", unitSuffix: "001" },
    ],
    note: "Lễ ăn hỏi sáng thứ Bảy, cần đồ phẳng phiu.",
  },
  {
    // Sẵn sàng bàn giao — nhận vào ngày mai
    seq: 11,
    status: "ready",
    createdOffset: -3,
    pickupOffset: 1,
    returnOffset: 4,
    pickupMethod: "delivery",
    paymentPlan: "full",
    items: [{ slug: "dam-da-hoi-satin-midnight", size: "S", color: "Xanh đêm", unitSuffix: "002" }],
    note: "Giao buổi sáng giúp mình nhé.",
  },
  {
    // Đã xác nhận — nhận sau 9 ngày (Upcoming)
    seq: 14,
    status: "confirmed",
    createdOffset: -1,
    pickupOffset: 9,
    returnOffset: 12,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    items: [
      { slug: "vay-cuoi-ren-phap-tay-phong", size: "M", color: "Trắng ngà" },
      { slug: "bong-tai-pha-le-nho-giot", size: "Free", color: "Bạc" },
    ],
  },
  {
    // Chờ thanh toán (Payment pending)
    seq: 16,
    status: "pending_payment",
    createdOffset: 0,
    pickupOffset: 5,
    returnOffset: 7,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "dam-nhung-cocktail-ruou-vang", size: "M", color: "Rượu vang" }],
  },
  {
    // Hoàn tất — có phí giặt đặc biệt trừ vào cọc (BR-31, BR-32)
    seq: 3,
    status: "completed",
    createdOffset: -26,
    pickupOffset: -21,
    returnOffset: -18,
    pickupMethod: "at_store",
    paymentPlan: "full",
    items: [{ slug: "dam-hoa-maxi-vuon-xuan", size: "S", color: "Hoa xanh", unitSuffix: "002" }],
    fees: [
      {
        id: "fee-1",
        type: "dirty",
        label: "Phí giặt đặc biệt",
        amount: 100_000,
        reason: "Vết trà ở tà váy, cần xử lý tẩy chuyên dụng",
        unitCode: "DM-S-HO-002",
      },
    ],
  },
  {
    // Hoàn tất — nguyên vẹn, hoàn cọc đủ, đã đánh giá
    seq: 1,
    status: "completed",
    createdOffset: -48,
    pickupOffset: -44,
    returnOffset: -41,
    pickupMethod: "at_store",
    paymentPlan: "deposit_hold",
    paidOnPickup: true,
    items: [{ slug: "ao-dai-lua-ngu-sac-ngoc-trai", size: "S", color: "Ngà", unitSuffix: "001", reviewed: true }],
  },
  {
    // Đã huỷ trước ngày nhận 5 ngày → hoàn 70% tiền thuê, 100% cọc (BR-20)
    seq: 2,
    status: "cancelled",
    createdOffset: -62,
    pickupOffset: -55,
    returnOffset: -52,
    pickupMethod: "delivery",
    paymentPlan: "deposit_hold",
    items: [{ slug: "tuxedo-den-ve-satin", size: "L", color: "Đen" }],
    cancelReason: "Sự kiện bị dời lịch",
  },
];

export const ORDERS: Order[] = SEEDS.map(buildOrder);

export function getOrder(code: string): Order | undefined {
  return ORDERS.find((o) => o.code === code);
}

/** Đơn cần khách để mắt tới — dùng cho khối "Cần bạn xử lý" ở trang tài khoản. */
export function actionableOrders(): Order[] {
  return ORDERS.filter((o) =>
    ["pending_payment", "ready", "in_use", "overdue", "inspecting"].includes(o.status),
  );
}

export function upcomingOrder(): Order | undefined {
  return ORDERS.filter((o) => ["confirmed", "preparing", "ready"].includes(o.status)).sort((a, b) =>
    a.pickupDate.localeCompare(b.pickupDate),
  )[0];
}

export function activeOrder(): Order | undefined {
  return ORDERS.find((o) => o.status === "in_use" || o.status === "overdue");
}

export function describeOrderDates(order: Order): string {
  return `${formatDate(order.pickupDate)} → ${formatDate(order.returnDate)}`;
}
