"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderStatusChip } from "@/components/account/OrderCard";
import { ProductMedia } from "@/components/product/ProductMedia";
import { OrderTimeline } from "@/components/rental/OrderTimeline";
import { SettlementTable } from "@/components/rental/PriceBreakdown";
import {
  IconAlert,
  IconCheck,
  IconClock,
  IconInfo,
  IconPhone,
  IconStore,
  IconTruck,
} from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState, Note, Reveal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { bookingsForVariant } from "@/data/bookings";
import { cleanBufferFor } from "@/data/catalog";
import { getOrder } from "@/data/orders";
import { getProduct } from "@/data/products";
import { useMounted } from "@/hooks";
import { countFreeUnits } from "@/lib/availability";
import { addDays, describeDaysLeft, diffDays, formatDate, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { canCancel, canExtend, canPay, canReview, ORDER_STATUS } from "@/lib/order-status";
import { calcExtensionFee, canRequestExtension, estimateCancellation } from "@/lib/policy";
import { CANCELLATION_POLICY, SETTINGS, STORE } from "@/lib/settings";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrderDetailView({ code }: { code: string }) {
  const order = getOrder(code);
  const mounted = useMounted();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  if (!order) {
    return (
      <EmptyState
        title="Không tìm thấy đơn thuê"
        body={`Không có đơn nào mang mã ${code} trong tài khoản của bạn. Có thể đơn đã được xoá hoặc bạn mở nhầm liên kết.`}
        action={{ label: "Về danh sách đơn thuê", href: "/tai-khoan/don-thue" }}
      />
    );
  }

  const meta = ORDER_STATUS[order.status];
  const status = cancelled ? "cancelled" : order.status;
  const isOverdue = status === "overdue";

  return (
    <div className="space-y-12">
      {/* Header */}
      <Reveal as="header">
        <Link
          href="/tai-khoan/don-thue"
          className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em] text-ink-2"
        >
          ← Tất cả đơn thuê
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="display-3">Đơn {order.code}</h2>
          <OrderStatusChip order={{ ...order, status }} />
        </div>
        <p className="mt-3 max-w-[64ch] text-[13.5px] leading-relaxed text-ink-2">
          {cancelled ? ORDER_STATUS.cancelled.description : meta.description}
        </p>
        <p className="mt-1.5 text-[12px] text-ink-3">Đặt lúc {formatDateTime(order.createdAt)}</p>
      </Reveal>

      {/* Timeline */}
      <Reveal delay={80} className="border-y border-line py-8">
        <OrderTimeline status={status} />
      </Reveal>

      {/* Việc cần làm */}
      {!cancelled && (status === "in_use" || status === "overdue") && (
        <Reveal delay={100}>
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 px-5 py-4",
              isOverdue ? "bg-danger-soft" : "bg-warm",
            )}
          >
            <div className="flex items-start gap-3">
              <IconClock width={18} height={18} className={cn("mt-0.5", isOverdue ? "text-danger" : "text-accent")} />
              <div>
                <p className="text-[14px]">
                  Hạn trả: {formatDate(order.returnDate)} lúc {STORE.return_due_hour}:00
                  {mounted && (
                    <span className={cn("ml-2", isOverdue ? "text-danger" : "text-ink-2")}>
                      — {describeDaysLeft(order.returnDate)}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[12.5px] text-ink-2">
                  {isOverdue
                    ? `Phí trễ đang được tính ${SETTINGS.late_fee_rate}× tiền thuê ngày cho mỗi ngày quá hạn, tối đa ${SETTINGS.late_fee_cap_multiplier}× tiền cọc.`
                    : `Ân hạn ${SETTINGS.late_fee_grace_hours} giờ sau giờ hẹn trước khi tính phí trễ.`}
                </p>
              </div>
            </div>
            {canExtend(status) && (
              <button type="button" onClick={() => setExtendOpen(true)} className="btn btn-sm btn-outline">
                Yêu cầu gia hạn
              </button>
            )}
          </div>
        </Reveal>
      )}

      {cancelled && (
        <Note tone="info" icon={<IconCheck width={15} height={15} />}>
          Đơn đã được huỷ. Tiền hoàn sẽ về đúng kênh thanh toán trong 3–7 ngày làm việc.
        </Note>
      )}

      {/* Sản phẩm */}
      <section>
        <Reveal as="header" className="pb-4">
          <h3 className="display-4">Món trong đơn</h3>
        </Reveal>
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item, i) => {
            const product = getProduct(item.productSlug);
            return (
              <li key={i} className="flex gap-4 py-5">
                <ProductMedia image={item.image} ratio="3/4" className="w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  {product ? (
                    <Link href={`/san-pham/${product.slug}`} className="link-line link-underline-in text-[14px]">
                      {item.productNameSnapshot}
                    </Link>
                  ) : (
                    <span className="text-[14px]">{item.productNameSnapshot}</span>
                  )}
                  <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-2">
                    <span
                      className="inline-block h-3 w-3"
                      style={{ backgroundColor: item.variantSnapshot.colorHex, border: "1px solid rgba(0,0,0,.08)" }}
                    />
                    {item.variantSnapshot.color} · Size {item.variantSnapshot.size} · SL {item.quantity}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-2">
                    {formatDate(order.pickupDate)} → {formatDate(order.returnDate)} · {item.days} ngày
                  </p>
                  {item.unitCodes ? (
                    <p className="mt-2 text-[11.5px] text-ink-3">
                      Mã cá thể: {item.unitCodes.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-ink-3">
                      Cá thể cụ thể sẽ được gán khi nhân viên soạn đồ
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] tabular-nums">{formatVnd(item.lineRentalTotal)}</p>
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-ink-3">
                    cọc {formatVnd(item.lineDepositTotal)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Biên bản lúc giao */}
      {["in_use", "overdue", "inspecting", "completed"].includes(status) && (
        <section>
          <Reveal as="header" className="pb-4">
            <h3 className="display-4">Biên bản lúc giao</h3>
            <p className="mt-2 max-w-[64ch] text-[13px] text-ink-2">
              Ảnh tình trạng được chụp khi bàn giao. Đây là căn cứ đối chiếu khách quan khi bạn trả đồ, tránh tranh
              chấp về vết có sẵn.
            </p>
          </Reveal>
          <div className="flex gap-2">
            {order.items.flatMap((item, i) =>
              [0, 1].map((k) => (
                <ProductMedia
                  key={`${i}-${k}`}
                  image={{ ...item.image, id: `${item.image.id}-hand-${k}`, motif: k === 0 ? "detail" : "still-life" }}
                  ratio="1/1"
                  className="w-24"
                />
              )),
            )}
          </div>
        </section>
      )}

      {/* Nhận đồ */}
      <section className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="display-4">Nhận & trả đồ</h3>
          <div className="mt-4 space-y-2.5 text-[13px] text-ink-2">
            <p className="flex items-start gap-2.5">
              {order.pickupMethod === "at_store" ? (
                <IconStore width={15} height={15} className="mt-0.5 shrink-0" />
              ) : (
                <IconTruck width={15} height={15} className="mt-0.5 shrink-0" />
              )}
              {order.pickupMethod === "at_store"
                ? `Nhận tại cửa hàng — ${STORE.address}`
                : `Giao tận nơi — ${order.address}`}
            </p>
            <p>
              Người nhận: {order.receiverName} · {order.receiverPhone}
            </p>
            {order.note && <p className="text-ink-3">Ghi chú: {order.note}</p>}
          </div>
        </div>

        <div>
          <h3 className="display-4">Cần hỗ trợ?</h3>
          <div className="mt-4 space-y-2.5 text-[13px] text-ink-2">
            <p className="flex items-center gap-2.5">
              <IconPhone width={15} height={15} className="shrink-0" />
              {STORE.phone} · {STORE.hours}
            </p>
            <Link href="/chinh-sach#tra-do" className="link-line link-underline-in inline-block">
              Xem chính sách trả đồ & phí phát sinh
            </Link>
          </div>
        </div>
      </section>

      {/* Thanh toán / quyết toán */}
      <section>
        <Reveal as="header" className="pb-4">
          <h3 className="display-4">{status === "completed" ? "Quyết toán" : "Thanh toán"}</h3>
        </Reveal>

        {status === "completed" && order.settlement ? (
          <>
            <SettlementTable
              deposit={order.settlement.deposit}
              fees={order.fees.map((f) => ({ label: f.label, amount: f.amount, reason: f.reason }))}
              refundAmount={order.settlement.refundAmount}
              outstanding={order.settlement.outstanding}
              refundedAt={order.settlement.refundedAt}
            />
            {order.settlement.refundedAt && (
              <p className="mt-4 text-[12.5px] text-success">
                Đã hoàn {formatVnd(order.settlement.refundAmount)} vào {formatDateTime(order.settlement.refundedAt)}.
              </p>
            )}
          </>
        ) : (
          <div className="divide-y divide-line-2 border-y border-line">
            <PayRow label="Tiền thuê" value={formatVnd(order.subtotalRental)} />
            {order.discount > 0 && (
              <PayRow
                label={`Giảm giá${order.promotionCode ? ` (${order.promotionCode})` : ""}`}
                value={formatVnd(-order.discount)}
                tone="success"
              />
            )}
            {order.shippingFee > 0 && <PayRow label="Phí giao nhận 2 chiều" value={formatVnd(order.shippingFee)} />}
            <PayRow label="Tiền cọc (hoàn lại khi trả nguyên vẹn)" value={formatVnd(order.totalDeposit)} />
            <PayRow label="Tổng đơn" value={formatVnd(order.grandTotal)} strong />
            <PayRow label="Đã thanh toán" value={formatVnd(order.paidAmount)} tone="success" />
            {order.grandTotal - order.paidAmount > 0 && (
              <PayRow label="Còn lại (trả khi nhận đồ)" value={formatVnd(order.grandTotal - order.paidAmount)} />
            )}
          </div>
        )}

        {order.payments.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-[12px] text-ink-3">
            {order.payments.map((p) => (
              <li key={p.id}>
                {p.method === "vnpay" ? "VNPay" : p.method === "momo" ? "MoMo" : p.method === "cash" ? "Tiền mặt" : "Chuyển khoản"}{" "}
                · {formatVnd(p.amount)} · {p.paidAt ? formatDateTime(p.paidAt) : "chưa thanh toán"}
              </li>
            ))}
          </ul>
        )}

        {order.cancellation && (
          <Note tone="info" icon={<IconInfo width={15} height={15} />}>
            Huỷ ngày {formatDateTime(order.cancellation.cancelledAt)} — {order.cancellation.reason}. Đã hoàn{" "}
            {formatVnd(order.cancellation.rentalRefunded + order.cancellation.depositRefunded)} (tiền thuê{" "}
            {formatVnd(order.cancellation.rentalRefunded)} + cọc {formatVnd(order.cancellation.depositRefunded)}).
          </Note>
        )}
      </section>

      {/* Hành động */}
      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        {canPay(status) && (
          <Link href="/thanh-toan" className="btn">
            Thanh toán ngay
          </Link>
        )}
        {canReview(status) && (
          <Link href="/tai-khoan/danh-gia" className="btn btn-outline">
            Viết đánh giá
          </Link>
        )}
        {canCancel(status) && !cancelled && (
          <button type="button" onClick={() => setCancelOpen(true)} className="btn btn-quiet">
            Huỷ đơn
          </button>
        )}
        <Link href={`/san-pham/${order.items[0].productSlug}`} className="btn btn-quiet">
          Thuê lại món này
        </Link>
      </div>

      <CancelDialog
        order={order}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          setCancelled(true);
          setCancelOpen(false);
          toast.push({
            tone: "success",
            title: "Đã gửi yêu cầu huỷ đơn",
            body: "Tiền hoàn sẽ về đúng kênh thanh toán trong 3–7 ngày làm việc.",
          });
        }}
      />

      <ExtendDialog order={order} open={extendOpen} onClose={() => setExtendOpen(false)} />
    </div>
  );
}

function PayRow({
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
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className={cn("text-[13.5px]", strong && "text-[15px]")}>{label}</span>
      <span className={cn("tabular-nums text-[13.5px]", strong && "text-[16px]", tone === "success" && "text-success")}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------- Huỷ đơn (BR-20) -- */

function CancelDialog({
  order,
  open,
  onClose,
  onConfirm,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const estimate = useMemo(() => estimateCancellation(order), [order]);
  const [reason, setReason] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Huỷ đơn thuê"
      footer={
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onClose} className="btn btn-quiet flex-1">
            Giữ đơn
          </button>
          <button type="button" onClick={onConfirm} className="btn flex-1">
            Xác nhận huỷ đơn
          </button>
        </div>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        Bạn đang huỷ đơn <span className="text-ink">{order.code}</span>, còn{" "}
        <span className="text-ink">{Math.max(0, estimate.daysBeforePickup)} ngày</span> nữa đến ngày nhận đồ.
      </p>

      <div className="mt-5 bg-warm px-4 py-3.5">
        <p className="text-[13px]">{estimate.tierLabel}</p>
        <p className="mt-1 text-[12.5px] text-ink-2">
          Hoàn {Math.round(estimate.rentalRefundRate * 100)}% tiền thuê đã trả · hoàn 100% tiền cọc
        </p>
      </div>

      <dl className="mt-5 divide-y divide-line-2 border-y border-line">
        <PayRow label="Tiền thuê được hoàn" value={formatVnd(estimate.rentalRefund)} />
        <PayRow label="Tiền cọc được hoàn" value={formatVnd(estimate.depositRefund)} />
        {estimate.forfeited > 0 && (
          <PayRow label="Không được hoàn theo chính sách" value={formatVnd(estimate.forfeited)} />
        )}
        <PayRow label="Tổng hoàn lại" value={formatVnd(estimate.totalRefund)} strong tone="success" />
      </dl>

      {estimate.needsApproval && (
        <Note tone="warning" icon={<IconAlert width={15} height={15} />}>
          Khoản hoàn vượt {formatVnd(SETTINGS.refund_auto_limit)} nên cần quản lý duyệt trước khi chuyển tiền. Bạn sẽ
          nhận thông báo ngay khi được duyệt.
        </Note>
      )}

      <div className="mt-5">
        <label className="field-label" htmlFor="cancel-reason">
          Lý do huỷ (không bắt buộc)
        </label>
        <textarea
          id="cancel-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="field"
          placeholder="Ví dụ: sự kiện bị dời lịch"
        />
      </div>

      <details className="mt-5 text-[12.5px] text-ink-2">
        <summary className="cursor-pointer text-ink">Xem toàn bộ chính sách huỷ</summary>
        <ul className="mt-3 space-y-1.5">
          {CANCELLATION_POLICY.map((tier) => (
            <li key={tier.label}>
              · {tier.label}: hoàn {Math.round(tier.rentalRefundRate * 100)}% tiền thuê, 100% tiền cọc.
            </li>
          ))}
        </ul>
      </details>
    </Modal>
  );
}

/* ------------------------------------------------ Gia hạn (BR-40 → BR-42) -- */

function ExtendDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [extraDays, setExtraDays] = useState(2);

  const eligibility = canRequestExtension(order.returnDueAt);
  const newReturn = addDays(order.returnDate, extraDays);

  // BR-41 — tự duyệt nếu cá thể không có booking kế tiếp trong khoảng gia hạn (đã tính buffer)
  const check = useMemo(() => {
    let available = true;
    let fee = 0;
    for (const item of order.items) {
      const product = getProduct(item.productSlug);
      if (!product) continue;
      const variant = product.variants.find(
        (v) => v.size === item.variantSnapshot.size && v.color === item.variantSnapshot.color,
      );
      if (!variant) continue;
      const free = countFreeUnits(
        variant,
        bookingsForVariant(variant.id).filter((b) => b.pickupDate !== order.pickupDate),
        order.returnDate,
        newReturn,
        cleanBufferFor(product.categorySlug),
      );
      if (free <= 0) available = false;
      fee += calcExtensionFee(extraDays, variant.extraDayPrice, item.quantity);
    }
    return { available, fee };
  }, [order, extraDays, newReturn]);

  // Giá trị chỉ để hiển thị, tính lại mỗi lần mở hộp thoại
  // eslint-disable-next-line react-hooks/purity
  const hoursLeft = Math.round((new Date(order.returnDueAt).getTime() - Date.now()) / 3_600_000);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yêu cầu gia hạn"
      footer={
        <button
          type="button"
          disabled={!eligibility.allowed || !check.available}
          onClick={() => {
            onClose();
            toast.push({
              tone: "success",
              title: "Đã gửi yêu cầu gia hạn",
              body: `Trả muộn hơn ${extraDays} ngày · phí gia hạn ${formatVnd(check.fee)} sẽ thu ngay khi được duyệt.`,
            });
          }}
          className="btn btn-block"
        >
          Gửi yêu cầu gia hạn
        </button>
      }
    >
      {!eligibility.allowed ? (
        <Note tone="warning" icon={<IconAlert width={15} height={15} />}>
          {eligibility.reason}
        </Note>
      ) : (
        <p className="text-[13px] text-ink-2">
          Còn {hoursLeft} giờ tới hạn trả — yêu cầu gia hạn cần gửi trước hạn ít nhất 12 giờ.
        </p>
      )}

      <dl className="mt-5 divide-y divide-line-2 border-y border-line">
        <PayRow label="Hạn trả hiện tại" value={formatDate(order.returnDate)} />
        <PayRow label="Hạn trả mới" value={formatDate(newReturn)} />
      </dl>

      <div className="mt-5">
        <label className="field-label">Số ngày gia hạn</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 5, 7].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setExtraDays(d)}
              className={cn(
                "min-w-[64px] border px-3 py-2 text-[13px] transition-colors",
                extraDays === d ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink",
              )}
            >
              +{d} ngày
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {check.available ? (
          <Note tone="success" icon={<IconCheck width={15} height={15} />}>
            Món trong đơn chưa có khách đặt tiếp trong khoảng gia hạn — yêu cầu sẽ được duyệt tự động.
          </Note>
        ) : (
          <Note tone="danger" icon={<IconAlert width={15} height={15} />}>
            Rất tiếc, đã có khách đặt món này ngay sau bạn (đã tính cả thời gian giặt ủi). Vui lòng trả đúng hạn hoặc
            chọn số ngày gia hạn ít hơn.
          </Note>
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-[14px]">Phí gia hạn</span>
        <span className="text-[17px] tabular-nums">{formatVnd(check.fee)}</span>
      </div>
      <p className="mt-1.5 text-[12px] text-ink-2">
        Tính theo giá ngày thuê thêm và thu ngay khi yêu cầu được duyệt. Gia hạn không xoá phí trễ đã phát sinh trước
        đó (nếu có).
      </p>
    </Modal>
  );
}

/** Giữ import diffDays/todayISO có ý nghĩa: dùng để tính số ngày còn lại trong header. */
export function daysUntilReturn(order: Order): number {
  return diffDays(todayISO(), order.returnDate);
}
