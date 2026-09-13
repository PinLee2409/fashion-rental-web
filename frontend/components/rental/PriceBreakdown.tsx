"use client";

import { IconInfo } from "@/components/ui/Icons";
import { formatVnd } from "@/lib/money";
import type { Quote } from "@/lib/pricing";
import { SETTINGS } from "@/lib/settings";
import type { PaymentPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "discount" | "strong" | "deposit";
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <span
        className={cn(
          "text-[13.5px]",
          tone === "muted" && "text-ink-2",
          tone === "strong" && "text-[15px]",
          tone === "deposit" && "text-ink",
        )}
      >
        {label}
        {hint && <span className="ml-1.5 text-[11.5px] text-ink-3">{hint}</span>}
      </span>
      <span
        className={cn(
          "shrink-0 text-[13.5px] tabular-nums",
          tone === "discount" && "text-success",
          tone === "strong" && "text-[17px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * `<PriceBreakdown>` — tách bạch TIỀN THUÊ và TIỀN CỌC (BR-12, BR-14).
 * Cọc là khoản hoàn lại, không phải chi phí thuê — đây là chỗ khách hay hiểu nhầm nhất.
 */
export function PriceBreakdown({
  quote,
  paymentPlan,
  showDueSplit = true,
  className,
}: {
  quote: Quote;
  paymentPlan?: PaymentPlan;
  showDueSplit?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="divide-y divide-line-2">
        <div className="pb-1">
          <Row label="Tiền thuê" value={formatVnd(quote.subtotalRental)} />
          {quote.savedByTiers > 0 && (
            <p className="-mt-1 pb-2 text-[11.5px] text-success">
              Đã áp gói thuê — rẻ hơn {formatVnd(quote.savedByTiers)} so với tính theo ngày lẻ
            </p>
          )}
          {quote.discount > 0 && (
            <Row
              label={`Giảm giá${quote.discountLabel ? ` (${quote.discountLabel})` : ""}`}
              value={formatVnd(-quote.discount)}
              tone="discount"
            />
          )}
          {quote.fullPaymentDiscount > 0 && (
            <Row
              label={`Giảm ${Math.round(SETTINGS.full_payment_discount * 100)}% khi trả đủ`}
              value={formatVnd(-quote.fullPaymentDiscount)}
              tone="discount"
            />
          )}
          {quote.shippingFee > 0 && <Row label="Phí giao nhận 2 chiều" value={formatVnd(quote.shippingFee)} />}
          {quote.shippingWaived && <Row label="Phí giao nhận 2 chiều" value="Miễn phí" tone="discount" />}
        </div>

        <div className="py-1">
          <Row label="Tiền cọc" value={formatVnd(quote.totalDeposit)} tone="deposit" hint="hoàn lại" />
          <p className="flex items-start gap-1.5 pb-2 text-[11.5px] leading-relaxed text-ink-2">
            <IconInfo width={13} height={13} className="mt-0.5 shrink-0" />
            Cọc được hoàn 100% sau khi bạn trả đồ nguyên vẹn và shop kiểm tra xong. Đây không phải chi phí thuê.
          </p>
        </div>

        <div className="pt-2">
          <Row label="Tổng cộng" value={formatVnd(quote.grandTotal)} tone="strong" />
        </div>
      </div>

      {showDueSplit && paymentPlan && (
        <div className="mt-4 bg-warm px-4 py-3.5">
          <Row label="Thanh toán ngay" value={formatVnd(quote.dueNow)} tone="strong" />
          {quote.dueOnPickup > 0 && (
            <Row label="Trả nốt khi nhận đồ" value={formatVnd(quote.dueOnPickup)} tone="muted" />
          )}
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-2">
            {paymentPlan === "deposit_hold"
              ? `Cọc giữ chỗ: toàn bộ tiền cọc + ${Math.round(
                  SETTINGS.prepay_rental_rate * 100,
                )}% tiền thuê thanh toán online.`
              : `Trả đủ ngay — bạn đã được giảm thêm ${Math.round(SETTINGS.full_payment_discount * 100)}% tiền thuê.`}
          </p>
        </div>
      )}
    </div>
  );
}

/** Bảng quyết toán cọc khi đơn hoàn tất — BR-32. */
export function SettlementTable({
  deposit,
  fees,
  refundAmount,
  outstanding,
  refundedAt,
}: {
  deposit: number;
  fees: { label: string; amount: number; reason?: string }[];
  refundAmount: number;
  outstanding: number;
  refundedAt?: string | null;
}) {
  return (
    <div className="divide-y divide-line-2">
      <Row label="Tiền cọc đã giữ" value={formatVnd(deposit)} />
      {fees.length === 0 ? (
        <Row label="Phí phát sinh" value="Không có" tone="muted" />
      ) : (
        fees.map((fee, i) => (
          <Row key={i} label={fee.label} value={formatVnd(-fee.amount)} hint={fee.reason} tone="muted" />
        ))
      )}
      <div className="pt-2">
        {outstanding > 0 ? (
          <Row label="Khách cần thanh toán thêm" value={formatVnd(outstanding)} tone="strong" />
        ) : (
          <Row
            label="Hoàn lại cho bạn"
            value={formatVnd(refundAmount)}
            tone="strong"
            hint={refundedAt ? "đã hoàn" : "đang xử lý"}
          />
        )}
      </div>
    </div>
  );
}
