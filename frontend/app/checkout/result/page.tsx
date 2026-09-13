"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { OrderTimeline } from "@/components/rental/OrderTimeline";
import { IconAlert, IconCheck, IconClock, IconStore, IconTruck } from "@/components/ui/Icons";
import { Reveal, Skeleton } from "@/components/ui/Primitives";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { SETTINGS, STORE } from "@/lib/settings";
import type { ProductImage } from "@/lib/types";

interface OrderSnapshot {
  code: string;
  createdAt: string;
  pickupMethod: "at_store" | "delivery";
  paymentPlan: "deposit_hold" | "full";
  method: string;
  receiverName: string;
  receiverPhone: string;
  address: string | null;
  note?: string;
  items: {
    slug: string;
    name: string;
    image: ProductImage;
    size: string;
    color: string;
    colorHex: string;
    quantity: number;
    days: number;
    pickupDate: string;
    returnDate: string;
    rentalTotal: number;
    depositTotal: number;
  }[];
  totals: {
    subtotalRental: number;
    discount: number;
    discountLabel: string | null;
    shippingFee: number;
    totalDeposit: number;
    fullPaymentDiscount: number;
    grandTotal: number;
    dueNow: number;
    dueOnPickup: number;
  };
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="shell py-40"><Skeleton className="h-40 w-full" /></div>}>
      <ResultView />
    </Suspense>
  );
}

function ResultView() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const failed = params.get("trang-thai") === "that-bai";
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("stylerent.lastOrder");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setOrder(JSON.parse(raw) as OrderSnapshot);
    } catch {
      /* bỏ qua */
    }
    const id = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(id);
  }, []);

  if (loading) {
    return (
      <div className="shell pt-[140px]">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-5 h-16 w-4/5 max-w-[640px]" />
        <Skeleton className="mt-10 h-56 w-full" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="pt-[76px]">
        <div className="shell max-w-[760px] py-20">
          <Reveal>
            <span className="grid h-12 w-12 place-items-center bg-danger-soft text-danger">
              <IconAlert width={20} height={20} />
            </span>
            <h1 className="display-2 mt-7">Thanh toán chưa thành công</h1>
            <p className="lede mt-5 max-w-[56ch]">
              Cổng thanh toán chưa xác nhận giao dịch cho đơn <span className="text-ink">{code}</span>. Đừng lo — đơn
              của bạn vẫn đang được giữ ở trạng thái <span className="text-ink">Chờ thanh toán</span> và các món vẫn
              chưa mở lại cho khách khác.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-8 border border-line bg-surface p-6">
            <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
              <IconClock width={16} height={16} className="mt-0.5 shrink-0 text-warning" />
              Bạn còn {SETTINGS.checkout_ttl_minutes} phút kể từ lúc đặt để hoàn tất thanh toán. Quá thời gian này, hệ
              thống sẽ tự huỷ đơn và nhả lịch giữ chỗ.
            </p>
            <ul className="mt-5 space-y-2 text-[13px] text-ink-2">
              <li>· Kiểm tra lại hạn mức thẻ hoặc số dư ví điện tử.</li>
              <li>· Thử một cổng thanh toán khác (VNPay / MoMo / chuyển khoản).</li>
              <li>· Nếu tiền đã bị trừ, đừng thanh toán lại — liên hệ {STORE.phone} để shop đối soát.</li>
            </ul>
          </Reveal>

          <Reveal delay={200} className="mt-8 flex flex-wrap gap-3">
            <Link href="/checkout" className="btn">
              Thử thanh toán lại
            </Link>
            <Link href="/rental-bag" className="btn btn-outline">
              Về giỏ thuê
            </Link>
          </Reveal>
        </div>
      </div>
    );
  }

  const first = order?.items[0];

  return (
    <div className="pt-[76px]">
      <div className="shell py-16 md:py-20">
        <Reveal className="max-w-[820px]">
          <span className="grid h-12 w-12 place-items-center bg-success-soft text-success">
            <IconCheck width={20} height={20} />
          </span>
          <p className="eyebrow mt-7 text-ink-3">Đơn {code}</p>
          <h1 className="display-1 mt-4">Đơn thuê đã được xác nhận</h1>
          <p className="lede mt-6 max-w-[60ch]">
            Chúng tôi đã nhận thanh toán và khoá lịch những món bạn thuê. Email xác nhận đang trên đường tới hộp thư
            của bạn.
          </p>
        </Reveal>

        <Reveal delay={140} className="mt-12 border-t border-line pt-10">
          <OrderTimeline status="confirmed" />
        </Reveal>

        {order && (
          <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
            <div>
              <h2 className="display-4">Món bạn đã thuê</h2>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {order.items.map((item, i) => (
                  <li key={`${item.slug}-${i}`} className="flex gap-4 py-5">
                    <ProductMedia image={item.image} ratio="3/4" className="w-20 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.slug}`} className="link-line link-underline-in text-[14px]">
                        {item.name}
                      </Link>
                      <p className="mt-1.5 text-[12.5px] text-ink-2">
                        {item.color} · Size {item.size} · SL {item.quantity}
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-2">
                        {formatDate(item.pickupDate)} → {formatDate(item.returnDate)} · {item.days} ngày
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] tabular-nums">{formatVnd(item.rentalTotal)}</p>
                      <p className="mt-0.5 text-[11.5px] tabular-nums text-ink-3">cọc {formatVnd(item.depositTotal)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <h2 className="display-4 mt-12">Việc tiếp theo</h2>
              <ol className="mt-5 space-y-4">
                {[
                  {
                    title: "Shop soạn đồ",
                    body: "Nhân viên chọn cá thể phù hợp nhất, kiểm tra tình trạng và đóng gói trước ngày bạn nhận.",
                  },
                  {
                    title:
                      order.pickupMethod === "at_store"
                        ? `Nhận đồ tại ${STORE.address}`
                        : "Shipper giao đồ tận nơi",
                    body:
                      order.pickupMethod === "at_store"
                        ? `Mang theo giấy tờ thế chân. Cửa hàng mở ${STORE.hours}.`
                        : `Giao tới ${order.address}. Bạn sẽ nhận tin nhắn khi shipper lên đường.`,
                  },
                  {
                    title: `Trả đồ trước ${STORE.return_due_hour}:00 ngày ${
                      first ? formatDate(first.returnDate) : ""
                    }`,
                    body: `Ân hạn ${SETTINGS.late_fee_grace_hours} giờ. Trả đúng hạn và nguyên vẹn, tiền cọc được hoàn đủ sau khi shop kiểm tra.`,
                  },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 border-b border-line pb-4">
                    <span className="font-display text-[22px] text-accent/40">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[14px]">{step.title}</p>
                      <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-ink-2">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="lg:sticky lg:top-[100px] lg:self-start">
              <div className="border border-line bg-surface p-6">
                <h2 className="eyebrow text-ink-3">Thanh toán</h2>
                <dl className="mt-5 space-y-2.5 text-[13.5px]">
                  <Row label="Tiền thuê" value={formatVnd(order.totals.subtotalRental)} />
                  {order.totals.discount > 0 && (
                    <Row
                      label={`Giảm giá${order.totals.discountLabel ? ` (${order.totals.discountLabel})` : ""}`}
                      value={formatVnd(-order.totals.discount)}
                      tone="success"
                    />
                  )}
                  {order.totals.fullPaymentDiscount > 0 && (
                    <Row label="Giảm khi trả đủ" value={formatVnd(-order.totals.fullPaymentDiscount)} tone="success" />
                  )}
                  {order.totals.shippingFee > 0 && (
                    <Row label="Phí giao nhận" value={formatVnd(order.totals.shippingFee)} />
                  )}
                  <Row label="Tiền cọc (hoàn lại)" value={formatVnd(order.totals.totalDeposit)} />
                  <div className="border-t border-line pt-3">
                    <Row label="Tổng đơn" value={formatVnd(order.totals.grandTotal)} strong />
                  </div>
                </dl>

                <div className="mt-5 bg-success-soft px-4 py-3.5">
                  <p className="flex items-center justify-between text-[13.5px] text-success">
                    <span>Đã thanh toán</span>
                    <span className="tabular-nums">{formatVnd(order.totals.dueNow)}</span>
                  </p>
                  <p className="mt-1 text-[11.5px] text-success/80">
                    {order.method === "vnpay" ? "VNPay" : order.method === "momo" ? "MoMo" : "Chuyển khoản"} ·{" "}
                    {formatDate(order.createdAt.slice(0, 10))}
                  </p>
                </div>

                {order.totals.dueOnPickup > 0 && (
                  <div className="mt-3 bg-warm px-4 py-3.5">
                    <p className="flex items-center justify-between text-[13.5px]">
                      <span>Trả khi nhận đồ</span>
                      <span className="tabular-nums">{formatVnd(order.totals.dueOnPickup)}</span>
                    </p>
                  </div>
                )}

                <div className="mt-6 border-t border-line pt-5 text-[12.5px] text-ink-2">
                  <p className="flex items-start gap-2.5">
                    {order.pickupMethod === "at_store" ? (
                      <IconStore width={15} height={15} className="mt-0.5 shrink-0" />
                    ) : (
                      <IconTruck width={15} height={15} className="mt-0.5 shrink-0" />
                    )}
                    {order.pickupMethod === "at_store" ? STORE.address : order.address}
                  </p>
                  <p className="mt-2.5">
                    {order.receiverName} · {order.receiverPhone}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/account/rentals" className="btn btn-block">
                  Xem đơn thuê của tôi
                </Link>
                <Link href="/collections/tat-ca" className="btn btn-outline btn-block">
                  Tiếp tục khám phá
                </Link>
              </div>
            </aside>
          </div>
        )}

        {!order && (
          <Reveal delay={140} className="mt-12 max-w-[560px]">
            <p className="text-[14px] text-ink-2">
              Không tìm thấy chi tiết đơn trong phiên làm việc này. Bạn có thể xem toàn bộ đơn thuê trong tài khoản.
            </p>
            <Link href="/account/rentals" className="btn mt-6">
              Xem đơn thuê của tôi
            </Link>
          </Reveal>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "success";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-[15px]" : undefined}>{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "text-[16px]" : ""} ${tone === "success" ? "text-success" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
