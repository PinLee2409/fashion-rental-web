import { diffDays, todayISO, type ISODate } from "./date";
import { CANCELLATION_POLICY, SETTINGS } from "./settings";
import type { Order } from "./types";

/* ==========================================================================
   BR-20 — Chính sách huỷ đơn & hoàn tiền
   ========================================================================== */

export interface CancellationEstimate {
  daysBeforePickup: number;
  tierLabel: string;
  rentalRefundRate: number;
  depositRefundRate: number;
  /** Số tiền thuê đã trả sẽ được hoàn */
  rentalRefund: number;
  /** Cọc luôn hoàn 100% khi huỷ */
  depositRefund: number;
  totalRefund: number;
  /** Phần tiền thuê không được hoàn */
  forfeited: number;
  /** BR-23 — vượt hạn mức thì cần Manager duyệt */
  needsApproval: boolean;
}

export function estimateCancellation(order: Order, today: ISODate = todayISO()): CancellationEstimate {
  const daysBeforePickup = diffDays(today, order.pickupDate);
  const tier =
    CANCELLATION_POLICY.find((t) => daysBeforePickup >= t.minDaysBefore) ??
    CANCELLATION_POLICY[CANCELLATION_POLICY.length - 1];

  // Phần tiền thuê khách đã thực trả (paidAmount trừ đi phần cọc đã nộp).
  const depositPaid = Math.min(order.paidAmount, order.totalDeposit);
  const rentalPaid = Math.max(0, order.paidAmount - depositPaid);

  const rentalRefund = Math.round(rentalPaid * tier.rentalRefundRate);
  const depositRefund = Math.round(depositPaid * tier.depositRefundRate);
  const totalRefund = rentalRefund + depositRefund;

  return {
    daysBeforePickup,
    tierLabel: tier.label,
    rentalRefundRate: tier.rentalRefundRate,
    depositRefundRate: tier.depositRefundRate,
    rentalRefund,
    depositRefund,
    totalRefund,
    forfeited: rentalPaid - rentalRefund,
    needsApproval: totalRefund > SETTINGS.refund_auto_limit,
  };
}

/* ==========================================================================
   BR-30 — Phí trễ hạn
   phí_trễ = số_ngày_trễ × late_fee_rate × tiền_thuê_ngày_của_dòng
   Trần: không vượt quá tiền_cọc_dòng × 2. Ân hạn 3 giờ.
   ========================================================================== */

export function calcLateFee(lateDays: number, dailyRental: number, lineDeposit: number): number {
  if (lateDays <= 0) return 0;
  const raw = lateDays * SETTINGS.late_fee_rate * dailyRental;
  return Math.round(Math.min(raw, lineDeposit * SETTINGS.late_fee_cap_multiplier));
}

/* ==========================================================================
   BR-40 → BR-42 — Gia hạn
   ========================================================================== */

export interface ExtensionCheck {
  allowed: boolean;
  reason?: string;
}

/** BR-40 — yêu cầu gia hạn phải gửi trước hạn trả ít nhất 12 giờ. */
export function canRequestExtension(returnDueAt: string, now: Date = new Date()): ExtensionCheck {
  const hoursLeft = (new Date(returnDueAt).getTime() - now.getTime()) / 3_600_000;
  if (hoursLeft < 12) {
    return {
      allowed: false,
      reason: "Yêu cầu gia hạn cần gửi trước hạn trả ít nhất 12 giờ. Vui lòng liên hệ shop để được hỗ trợ.",
    };
  }
  return { allowed: true };
}

/** BR-42 — tiền gia hạn tính theo giá ngày thêm, thu ngay khi duyệt. */
export function calcExtensionFee(extraDays: number, extraDayPrice: number, quantity = 1): number {
  return Math.max(0, extraDays) * extraDayPrice * quantity;
}

/* ==========================================================================
   BR-13 — diễn giải hai phương án thu tiền cho khách
   ========================================================================== */

export const PAYMENT_PLAN_COPY = {
  deposit_hold: {
    title: "Cọc giữ chỗ",
    summary: `Trả trước tiền cọc + ${Math.round(SETTINGS.prepay_rental_rate * 100)}% tiền thuê`,
    detail: "Phần tiền thuê còn lại thanh toán khi bạn nhận đồ.",
  },
  full: {
    title: "Trả đủ ngay",
    summary: `Thanh toán toàn bộ, giảm thêm ${Math.round(SETTINGS.full_payment_discount * 100)}%`,
    detail: "Nhận đồ là đi luôn, không phải thanh toán thêm tại quầy.",
  },
} as const;

export const RENTAL_RULES = [
  {
    title: "Cọc được hoàn lại",
    body: "Tiền cọc không phải là chi phí thuê. Trả đồ nguyên vẹn đúng hạn, bạn được hoàn 100% cọc sau khi shop kiểm tra.",
  },
  {
    title: "Giữ chỗ 15 phút",
    body: `Món đồ được giữ riêng cho bạn trong ${SETTINGS.hold_ttl_minutes} phút kể từ khi thêm vào giỏ thuê. Hết thời gian, đồ sẽ mở lại cho khách khác.`,
  },
  {
    title: "Thời gian đệm giặt ủi",
    body: "Sau mỗi lượt thuê, mỗi món cần 1–2 ngày để giặt ủi và kiểm tra. Vì vậy một vài ngày sát lịch thuê trước sẽ không nhận đặt.",
  },
  {
    title: "Phí trễ hạn",
    body: `Trễ hẹn trả tính ${SETTINGS.late_fee_rate}× tiền thuê ngày cho mỗi ngày trễ, ân hạn ${SETTINGS.late_fee_grace_hours} giờ, tối đa ${SETTINGS.late_fee_cap_multiplier}× tiền cọc.`,
  },
  {
    title: "Không tự sửa chữa",
    body: "Nếu đồ gặp sự cố, đừng tự giặt tẩy hay sửa. Báo shop ngay để được hướng dẫn, tránh phát sinh phí hư hỏng.",
  },
] as const;
