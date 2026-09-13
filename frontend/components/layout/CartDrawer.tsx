"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/product/ProductMedia";
import { HoldTimer } from "@/components/rental/HoldTimer";
import { IconBag } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/Primitives";
import { formatRange } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { useCart } from "@/store/cart";

/** Giỏ thuê rút gọn — mở từ icon trên header. */
export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Giỏ thuê (${cart.count})`}
      footer={
        cart.detailed.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between text-[13.5px]">
              <span>Tiền thuê</span>
              <span className="tabular-nums">{formatVnd(cart.quote.subtotalRental)}</span>
            </div>
            <div className="flex items-baseline justify-between text-[13.5px] text-ink-2">
              <span>Tiền cọc (hoàn lại)</span>
              <span className="tabular-nums">{formatVnd(cart.quote.totalDeposit)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-[14px]">Tạm tính</span>
              <span className="text-[16px] tabular-nums">{formatVnd(cart.quote.grandTotal)}</span>
            </div>
            <Link href="/gio-thue" onClick={onClose} className="btn btn-block">
              Xem giỏ thuê
            </Link>
            <Link
              href="/thanh-toan"
              onClick={onClose}
              className="link-line link-underline-in block text-center text-[11px] uppercase tracking-[0.14em] text-ink-2"
            >
              Tiến hành thuê
            </Link>
          </div>
        ) : null
      }
    >
      {cart.detailed.length === 0 ? (
        <EmptyState
          icon={<IconBag width={28} height={28} />}
          title="Giỏ thuê đang trống"
          body="Chọn ngày, chọn size rồi thêm món bạn thích. Mỗi món được giữ chỗ riêng cho bạn trong 15 phút."
          action={{ label: "Khám phá bộ sưu tập", href: "/danh-muc/tat-ca" }}
        />
      ) : (
        <ul className="divide-y divide-line">
          {cart.detailed.map(({ line, product, variant, days, rentalTotal, depositTotal, expired }) => (
            <li key={line.id} className="flex gap-4 px-6 py-5">
              <Link href={`/san-pham/${product.slug}`} onClick={onClose} className="w-20 shrink-0">
                <ProductMedia image={product.images[0]} ratio="3/4" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] leading-snug">{product.name}</p>
                    <p className="mt-1 text-[12px] text-ink-2">
                      {variant.size} · {variant.color} · SL {line.quantity}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeLine(line.id)}
                    className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-danger"
                  >
                    Xoá
                  </button>
                </div>
                <p className="mt-2 text-[12px] text-ink-2">
                  {formatRange(line.pickupDate, line.returnDate)} · {days} ngày
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 text-[12.5px]">
                  <span>Thuê {formatVnd(rentalTotal)}</span>
                  <span className="text-ink-2">Cọc {formatVnd(depositTotal)}</span>
                </div>
                {expired ? (
                  <p className="mt-2 bg-danger-soft px-2.5 py-1.5 text-[11.5px] text-danger">
                    Hết thời gian giữ chỗ — cần kiểm tra lại lịch trống
                  </p>
                ) : (
                  <HoldTimer expiresAt={line.holdExpiresAt} className="mt-2" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
