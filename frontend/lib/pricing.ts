import { formatVnd } from "./money";
import { SETTINGS, SHIPPING } from "./settings";
import type { PaymentPlan, PricingTier, Promotion, Variant } from "./types";

/* ==========================================================================
   BR-10 / BR-11 — Tiền thuê một dòng
   số_ngày        = ceil(return_date − pickup_date), tối thiểu 1
   tiền_thuê_dòng = giá_gói_phù_hợp + (số_ngày_vượt_gói × giá_ngày_thêm)
   Hệ thống LUÔN chọn phương án rẻ nhất cho khách:
     · tính thuần theo ngày          → số_ngày × price_per_day
     · mua đúng gói / gói dài hơn    → tier.price
     · gói + ngày lẻ                 → tier.price + (số_ngày − tier.days) × extra_day_price
   ========================================================================== */

export interface RentalPriceLine {
  label: string;
  days: number;
  price: number;
}

export interface RentalPrice {
  total: number;
  breakdown: RentalPriceLine[];
  /** Nếu tính thuần theo giá ngày thì phải trả bao nhiêu */
  dailyEquivalent: number;
  /** Tiết kiệm được so với tính thuần theo ngày */
  saved: number;
  effectivePerDay: number;
  /** Gói đã được áp dụng, nếu có */
  appliedTier: PricingTier | null;
}

export function calcRentalPrice(variant: Variant, days: number): RentalPrice {
  const n = Math.max(1, Math.floor(days));

  const options: { total: number; lines: RentalPriceLine[]; tier: PricingTier | null }[] = [
    {
      total: variant.pricePerDay * n,
      lines: [{ label: `${n} ngày × ${formatVnd(variant.pricePerDay)}`, days: n, price: variant.pricePerDay * n }],
      tier: null,
    },
  ];

  for (const tier of variant.tiers) {
    if (tier.days >= n) {
      options.push({
        total: tier.price,
        lines: [{ label: tier.label, days: tier.days, price: tier.price }],
        tier,
      });
    } else {
      const extraDays = n - tier.days;
      options.push({
        total: tier.price + extraDays * variant.extraDayPrice,
        lines: [
          { label: tier.label, days: tier.days, price: tier.price },
          {
            label: `${extraDays} ngày thuê thêm × ${formatVnd(variant.extraDayPrice)}`,
            days: extraDays,
            price: extraDays * variant.extraDayPrice,
          },
        ],
        tier,
      });
    }
  }

  const best = options.reduce((a, b) => (b.total < a.total ? b : a));
  const dailyEquivalent = variant.pricePerDay * n;

  return {
    total: Math.round(best.total),
    breakdown: best.lines,
    dailyEquivalent,
    saved: Math.max(0, dailyEquivalent - best.total),
    effectivePerDay: Math.round(best.total / n),
    appliedTier: best.tier,
  };
}

/** Giá hiển thị của từng gói trên PDP, kèm mức tiết kiệm so với giá ngày. */
export function describeTiers(variant: Variant): {
  days: number;
  label: string;
  price: number;
  perDay: number;
  saved: number;
  bestValue: boolean;
}[] {
  const rows = [
    {
      days: 1,
      label: "1 ngày",
      price: variant.pricePerDay,
      perDay: variant.pricePerDay,
      saved: 0,
      bestValue: false,
    },
    ...variant.tiers.map((tier) => ({
      days: tier.days,
      label: tier.label,
      price: tier.price,
      perDay: Math.round(tier.price / tier.days),
      saved: variant.pricePerDay * tier.days - tier.price,
      bestValue: false,
    })),
  ];
  let bestIndex = 0;
  rows.forEach((row, i) => {
    if (row.perDay < rows[bestIndex].perDay) bestIndex = i;
  });
  rows[bestIndex].bestValue = true;
  return rows;
}

/** BR-10 — tiền cọc theo biến thể, KHÔNG nhân theo số ngày. */
export function lineDeposit(variant: Variant, quantity: number): number {
  return variant.depositAmount * quantity;
}

/* ==========================================================================
   BR-12 / BR-13 — Tổng đơn và hai phương án thu tiền
   ========================================================================== */

export interface QuoteLineInput {
  variant: Variant;
  days: number;
  quantity: number;
}

export interface QuoteLine extends QuoteLineInput {
  rentalPrice: RentalPrice;
  lineRentalTotal: number;
  lineDepositTotal: number;
}

export interface QuoteOptions {
  promotion?: Promotion | null;
  freeshipPromotion?: Promotion | null;
  pickupMethod?: "at_store" | "delivery";
  paymentPlan?: PaymentPlan;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalRental: number;
  discount: number;
  discountLabel: string | null;
  shippingFee: number;
  shippingWaived: boolean;
  totalDeposit: number;
  fullPaymentDiscount: number;
  /** phải_trả = tổng_thuê − giảm_giá + phí_ship + tổng_cọc */
  grandTotal: number;
  /** Thanh toán online ngay bây giờ */
  dueNow: number;
  /** Phần còn lại thu khi nhận đồ */
  dueOnPickup: number;
  savedByTiers: number;
}

export function buildQuote(inputs: QuoteLineInput[], options: QuoteOptions = {}): Quote {
  const {
    promotion = null,
    freeshipPromotion = null,
    pickupMethod = "at_store",
    paymentPlan = "deposit_hold",
  } = options;

  const lines: QuoteLine[] = inputs.map((input) => {
    const rentalPrice = calcRentalPrice(input.variant, input.days);
    return {
      ...input,
      rentalPrice,
      lineRentalTotal: rentalPrice.total * input.quantity,
      lineDepositTotal: lineDeposit(input.variant, input.quantity),
    };
  });

  const subtotalRental = lines.reduce((sum, l) => sum + l.lineRentalTotal, 0);
  const totalDeposit = lines.reduce((sum, l) => sum + l.lineDepositTotal, 0);
  const savedByTiers = lines.reduce((sum, l) => sum + l.rentalPrice.saved * l.quantity, 0);

  const { discount, label: discountLabel } = calcPromotionDiscount(promotion, subtotalRental);

  let shippingFee = pickupMethod === "delivery" ? SHIPPING.round_trip_fee : 0;
  let shippingWaived = false;
  if (shippingFee > 0 && (freeshipPromotion || subtotalRental >= SHIPPING.free_shipping_threshold)) {
    shippingFee = 0;
    shippingWaived = true;
  }

  const rentalAfterDiscount = Math.max(0, subtotalRental - discount);
  const fullPaymentDiscount =
    paymentPlan === "full" ? Math.round(rentalAfterDiscount * SETTINGS.full_payment_discount) : 0;

  const grandTotal = rentalAfterDiscount + shippingFee + totalDeposit - fullPaymentDiscount;

  // BR-13 — Cọc giữ chỗ: trả online tổng_cọc + 30% tổng_thuê; phần còn lại thu khi nhận đồ.
  const dueNowRaw =
    paymentPlan === "full"
      ? grandTotal
      : Math.round(totalDeposit + subtotalRental * SETTINGS.prepay_rental_rate);
  const dueNow = Math.min(dueNowRaw, grandTotal);

  return {
    lines,
    subtotalRental,
    discount,
    discountLabel,
    shippingFee,
    shippingWaived,
    totalDeposit,
    fullPaymentDiscount,
    grandTotal,
    dueNow,
    dueOnPickup: Math.max(0, grandTotal - dueNow),
    savedByTiers,
  };
}

/** BR-50 — mã giảm giá: percent / fixed, có trần giảm và đơn tối thiểu. */
export function calcPromotionDiscount(
  promotion: Promotion | null | undefined,
  subtotalRental: number,
): { discount: number; label: string | null; error?: string } {
  if (!promotion) return { discount: 0, label: null };
  if (promotion.type === "freeship") return { discount: 0, label: promotion.code };
  if (subtotalRental < promotion.minOrder) {
    return {
      discount: 0,
      label: null,
      error: `Mã ${promotion.code} áp dụng cho đơn thuê từ ${formatVnd(promotion.minOrder)}`,
    };
  }
  let discount =
    promotion.type === "percent" ? Math.round((subtotalRental * promotion.value) / 100) : promotion.value;
  if (promotion.maxDiscount) discount = Math.min(discount, promotion.maxDiscount);
  return { discount: Math.min(discount, subtotalRental), label: promotion.code };
}

export function fromPricePerDay(variants: Variant[]): number {
  return Math.min(...variants.map((v) => v.pricePerDay));
}

export function minDeposit(variants: Variant[]): number {
  return Math.min(...variants.map((v) => v.depositAmount));
}
