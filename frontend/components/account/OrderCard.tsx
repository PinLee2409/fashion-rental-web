"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/product/ProductMedia";
import { Chip } from "@/components/ui/Primitives";
import { describeDaysLeft, formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { canPay, canReview, ORDER_STATUS, TONE_CLASS } from "@/lib/order-status";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderStatusChip({ order }: { order: Order }) {
  const meta = ORDER_STATUS[order.status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em]",
        TONE_CLASS[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

export function OrderCard({ order, compact }: { order: Order; compact?: boolean }) {
  const meta = ORDER_STATUS[order.status];
  const dueSoon = order.status === "in_use" || order.status === "overdue";

  return (
    <article className="border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/tai-khoan/don-thue/${order.code}`} className="link-line link-underline-in text-[13px]">
            {order.code}
          </Link>
          <OrderStatusChip order={order} />
        </div>
        <p className="text-[12px] text-ink-2">
          {formatDate(order.pickupDate)} → {formatDate(order.returnDate)}
        </p>
      </header>

      <div className="flex flex-wrap items-start gap-5 px-5 py-5">
        <div className="flex shrink-0 gap-2">
          {order.items.slice(0, compact ? 1 : 2).map((item, i) => (
            <ProductMedia key={i} image={item.image} ratio="3/4" className="w-16" />
          ))}
          {order.items.length > (compact ? 1 : 2) && (
            <span className="grid w-16 place-items-center bg-warm text-[12px] text-ink-2">
              +{order.items.length - (compact ? 1 : 2)}
            </span>
          )}
        </div>

        <div className="min-w-[200px] flex-1">
          <p className="text-[14px] leading-snug">
            {order.items.map((i) => i.productNameSnapshot).join(" · ")}
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-2">{meta.description}</p>

          {dueSoon && (
            <p className="mt-2.5 text-[12.5px]">
              <span className="text-ink-2">Hạn trả:</span> {formatDate(order.returnDate)} —{" "}
              <span className={order.status === "overdue" ? "text-danger" : "text-accent"}>
                {describeDaysLeft(order.returnDate)}
              </span>
            </p>
          )}

          {order.status === "completed" && order.settlement && (
            <p className="mt-2.5 text-[12.5px] text-success">
              Đã hoàn cọc {formatVnd(order.settlement.refundAmount)}
              {order.settlement.feesTotal > 0 && (
                <span className="text-ink-2"> (đã trừ phí {formatVnd(order.settlement.feesTotal)})</span>
              )}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[13.5px] tabular-nums">{formatVnd(order.grandTotal)}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-3">
            {order.paidAmount >= order.grandTotal
              ? "Đã thanh toán đủ"
              : `Đã trả ${formatVnd(order.paidAmount)}`}
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
        <p className="text-[12px] text-ink-2">{meta.nextAction ?? " "}</p>
        <div className="flex gap-2">
          {canPay(order.status) && (
            <Link href={`/tai-khoan/don-thue/${order.code}`} className="btn btn-sm">
              Thanh toán
            </Link>
          )}
          {canReview(order.status) && !order.items.every((i) => i.reviewed) && (
            <Link href="/tai-khoan/danh-gia" className="btn btn-sm btn-outline">
              Viết đánh giá
            </Link>
          )}
          <Link href={`/tai-khoan/don-thue/${order.code}`} className="btn btn-sm btn-quiet">
            Chi tiết
          </Link>
        </div>
      </footer>
    </article>
  );
}

export function OrderChipList({ order }: { order: Order }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {order.items.map((item, i) => (
        <Chip key={i}>
          {item.variantSnapshot.size} · {item.variantSnapshot.color}
        </Chip>
      ))}
    </div>
  );
}
