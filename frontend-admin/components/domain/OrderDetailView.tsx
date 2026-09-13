"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AssignUnitDrawer } from "@/components/domain/AssignUnitDrawer";
import { OrderStatusChip, UnitCode } from "@/components/domain/Chips";
import { HandoverFlow } from "@/components/domain/HandoverFlow";
import { ProductMedia } from "@/components/domain/ProductMedia";
import {
  IconAlert,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconPrinter,
  IconScan,
  IconStore,
  IconTruck,
} from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout, EmptyState, KeyValue, MoreMenu, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ORDER_INTERNAL_NOTE, customerOfOrder, getOrder } from "@/data/operations";
import { useMounted } from "@/hooks";
import { describeDaysLeft, formatDate, formatDateTime } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { canCancel, currentStepIndex, ORDER_STATUS, ORDER_TIMELINE } from "@/lib/order-status";
import { estimateCancellation } from "@/lib/policy";
import { SETTINGS, STORE } from "@/lib/settings";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

export function OrderDetailView({ code }: { code: string }) {
  const base = getOrder(code);
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();

  const [order, setOrder] = useState<Order | undefined>(base);
  const [assignFor, setAssignFor] = useState<number | null>(null);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [note, setNote] = useState(ORDER_INTERNAL_NOTE[code] ?? "");

  useEffect(() => {
    const action = params.get("action");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (action === "handover") setHandoverOpen(true);
    if (action === "cancel") setCancelOpen(true);
    if (action === "payment") setPaymentOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [params]);

  if (!order) {
    return (
      <div className="card">
        <EmptyState
          title="Không tìm thấy đơn thuê"
          body={`Không có đơn nào mang mã ${code}. Có thể mã đã đổi hoặc đơn đã bị xoá khỏi hệ thống.`}
          action={
            <Link href="/orders" className="btn btn-outline btn-sm">
              Về danh sách đơn
            </Link>
          }
        />
      </div>
    );
  }

  const customer = customerOfOrder(order.code);
  const meta = ORDER_STATUS[order.status];
  const due = Math.max(0, order.grandTotal - order.paidAmount);
  const allAssigned = order.items.every((i) => (i.unitCodes?.length ?? 0) > 0);
  const stepIndex = currentStepIndex(order.status);

  function patch(next: Partial<Order>, message?: string) {
    setOrder((o) => (o ? { ...o, ...next } : o));
    if (message) toast.push({ tone: "success", title: message });
  }

  function moveTo(status: OrderStatus, message: string) {
    patch(
      {
        status,
        logs: [
          ...order!.logs,
          { status, at: new Date().toISOString(), actor: session.user.name },
        ],
      },
      message,
    );
  }

  function assignUnit(index: number, unitCode: string) {
    const items = order!.items.map((it, i) => (i === index ? { ...it, unitCodes: [unitCode] } : it));
    patch({ items }, `Đã gán cá thể ${unitCode}`);
  }

  /* ---------------------------------------------------- hành động chính -- */

  let primary: { label: string; onClick: () => void; disabled?: boolean; hint?: string } | null = null;

  if (order.status === "pending_payment" && session.can("payment.record")) {
    primary = { label: "Ghi nhận thanh toán", onClick: () => setPaymentOpen(true) };
  } else if (order.status === "confirmed" && session.can("order.confirm")) {
    primary = { label: "Bắt đầu soạn đồ", onClick: () => moveTo("preparing", "Đơn chuyển sang Đang soạn đồ") };
  } else if (order.status === "preparing") {
    primary = {
      label: "Đánh dấu sẵn sàng",
      onClick: () => moveTo("ready", "Đơn đã sẵn sàng bàn giao"),
      disabled: !allAssigned,
      hint: allAssigned ? undefined : "Cần gán đủ cá thể cho mọi dòng trước khi đóng gói xong",
    };
  } else if (order.status === "ready" && session.can("order.handover")) {
    primary = { label: "Bàn giao đồ", onClick: () => setHandoverOpen(true) };
  } else if (["in_use", "overdue"].includes(order.status) && session.can("order.return_inspect")) {
    primary = { label: "Nhận lại đồ", onClick: () => router.push(`/returns?order=${order.code}`) };
  } else if (order.status === "inspecting" && session.can("order.return_inspect")) {
    primary = { label: "Tiếp tục lập biên bản", onClick: () => router.push(`/returns?order=${order.code}`) };
  } else if (order.status === "pending_approval" && session.can("refund.approve")) {
    primary = { label: "Mở hàng đợi duyệt", onClick: () => router.push("/approvals") };
  }

  return (
    <>
      {/* ------------------------------------------------------- header -- */}
      <div className="mb-5">
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink">
          <IconArrowLeft width={13} height={13} />
          Đơn thuê
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="num h-page">{order.code}</h1>
              <OrderStatusChip status={order.status} />
              {order.channel === "walk_in" && (
                <StatusChip tone="neutral" dot={false}>
                  Đơn tại quầy
                </StatusChip>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-ink-2">
              {meta.description} · Tạo lúc {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toast.push({ tone: "info", title: "Đang in phiếu bàn giao", body: order.code })}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <IconPrinter width={14} height={14} />
              In phiếu
            </button>
            {primary && (
              <button type="button" onClick={primary.onClick} disabled={primary.disabled} className="btn btn-sm" title={primary.hint}>
                {primary.label}
              </button>
            )}
            <MoreMenu
              items={[
                {
                  label: "Gán / đổi cá thể",
                  disabled: !["confirmed", "preparing", "ready"].includes(order.status) || !session.can("unit.manage"),
                  onSelect: () => setAssignFor(0),
                },
                {
                  label: "Ghi nhận thu tiền mặt",
                  disabled: due === 0 || !session.can("payment.record"),
                  hint: due > 0 ? `Còn ${formatVnd(due)}` : "Đã thu đủ",
                  onSelect: () => setPaymentOpen(true),
                },
                {
                  label: "Mở quầy nhận trả",
                  disabled: !["in_use", "overdue", "inspecting"].includes(order.status),
                  onSelect: () => router.push(`/returns?order=${order.code}`),
                },
                {
                  label: "Huỷ đơn",
                  danger: true,
                  disabled: !canCancel(order.status) || !session.can("order.cancel"),
                  hint: canCancel(order.status) ? "Áp chính sách hoàn tiền BR-20" : "Trạng thái này không huỷ được",
                  onSelect: () => setCancelOpen(true),
                },
              ]}
            />
          </div>
        </div>

        {primary?.hint && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-warning">
            <IconAlert width={13} height={13} />
            {primary.hint}
          </p>
        )}
      </div>

      {/* ----------------------------------------------- cảnh báo quá hạn -- */}
      {order.status === "overdue" && (
        <div className="mb-4">
          <Callout
            tone="danger"
            icon={<IconAlert width={15} height={15} />}
            title={`Quá hạn trả — ${mounted ? describeDaysLeft(order.returnDate) : ""}`}
            action={
              session.can("order.return_inspect") ? (
                <Link href={`/returns?order=${order.code}`} className="btn btn-sm">
                  Nhận lại đồ
                </Link>
              ) : undefined
            }
          >
            Phí trễ đang tính {SETTINGS.late_fee_rate}× tiền thuê ngày cho mỗi ngày quá hạn, trần {SETTINGS.late_fee_cap_multiplier}× tiền cọc.
            Liên hệ khách theo số {order.receiverPhone}.
          </Callout>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* ----------------------------------------------------- cột trái -- */}
        <div className="min-w-0 space-y-5">
          {/* Khách hàng */}
          <section className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label-xs mb-1.5">Khách hàng</p>
                <p className="text-[15px] font-medium">{order.receiverName}</p>
                <p className="num mt-0.5 text-[12.5px] text-ink-2">{order.receiverPhone}</p>
                {customer && <p className="text-[12.5px] text-ink-2">{customer.email}</p>}
                {customer && (
                  <Link
                    href={`/customers/${customer.id}`}
                    className="mt-2 inline-block text-[12px] underline underline-offset-2 hover:text-accent"
                  >
                    Xem hồ sơ khách hàng
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {customer && customer.totalRentals > 5 && <StatusChip tone="success">Khách quen</StatusChip>}
                {customer && customer.lateReturns > 0 && (
                  <StatusChip tone="warning">{customer.lateReturns} lần trả trễ</StatusChip>
                )}
                {customer && customer.damageIncidents > 0 && (
                  <StatusChip tone="danger">{customer.damageIncidents} lần hư hỏng</StatusChip>
                )}
                {customer?.status === "blocked" && <StatusChip tone="danger">Đang bị khoá</StatusChip>}
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
              <div>
                <p className="text-[11.5px] text-ink-3">Kỳ thuê</p>
                <p className="num mt-0.5 text-[13px]">
                  {formatDate(order.pickupDate)} → {formatDate(order.returnDate)}
                </p>
                <p className="text-[11.5px] text-ink-2">
                  {order.items[0].days} ngày · hẹn trả {STORE.return_due_hour}:00
                </p>
              </div>
              <div>
                <p className="text-[11.5px] text-ink-3">Hình thức nhận</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px]">
                  {order.pickupMethod === "at_store" ? <IconStore width={14} height={14} /> : <IconTruck width={14} height={14} />}
                  {order.pickupMethod === "at_store" ? "Nhận tại cửa hàng" : "Giao tận nơi"}
                </p>
                {order.address && <p className="text-[11.5px] leading-snug text-ink-2">{order.address}</p>}
              </div>
              <div>
                <p className="text-[11.5px] text-ink-3">Ghi chú của khách</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{order.note ?? "Không có"}</p>
              </div>
            </div>
          </section>

          {/* Sản phẩm & cá thể */}
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="h-section">Món thuê & cá thể</h2>
              <span className="text-[11.5px] text-ink-3">
                {order.items.filter((i) => i.unitCodes?.length).length}/{order.items.length} dòng đã gán cá thể
              </span>
            </header>

            <ul className="divide-y divide-line">
              {order.items.map((item, index) => (
                <li key={index} className="flex flex-wrap gap-3 p-4">
                  <ProductMedia image={item.image} ratio="3/4" className="w-14 shrink-0 rounded" />

                  <div className="min-w-[180px] flex-1">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="text-[13.5px] underline-offset-2 hover:underline"
                    >
                      {item.productNameSnapshot}
                    </Link>
                    <p className="mt-1 flex items-center gap-2 text-[12px] text-ink-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-line"
                        style={{ backgroundColor: item.variantSnapshot.colorHex }}
                      />
                      {item.variantSnapshot.color} · Size {item.variantSnapshot.size} · SL {item.quantity}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.unitCodes?.length ? (
                        item.unitCodes.map((c) => <UnitCode key={c} code={c} />)
                      ) : (
                        <StatusChip tone="warning">Chưa gán cá thể</StatusChip>
                      )}
                      {["confirmed", "preparing", "ready"].includes(order.status) && session.can("unit.manage") && (
                        <button
                          type="button"
                          onClick={() => setAssignFor(index)}
                          className="text-[11.5px] underline underline-offset-2 hover:text-accent"
                        >
                          {item.unitCodes?.length ? "Đổi cá thể" : "Gán cá thể"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="num text-[13px]">{formatVnd(item.lineRentalTotal)}</p>
                    <p className="num mt-0.5 text-[11.5px] text-ink-3">cọc {formatVnd(item.lineDepositTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Tiến trình */}
          <section className="card card-pad">
            <h2 className="h-section mb-3">Tiến trình đơn</h2>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {order.logs.map((log, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[23px] top-1 grid h-3 w-3 place-items-center rounded-full border border-line bg-surface">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                  </span>
                  <p className="text-[13px]">{ORDER_STATUS[log.status].label}</p>
                  <p className="text-[11.5px] text-ink-2">
                    {formatDateTime(log.at)}
                    {log.actor ? ` · ${log.actor}` : ""}
                  </p>
                  {log.note && <p className="mt-0.5 text-[11.5px] text-ink-3">{log.note}</p>}
                </li>
              ))}
              {stepIndex >= 0 &&
                ORDER_TIMELINE.slice(stepIndex + 1).map((step) => (
                  <li key={step.key} className="relative opacity-55">
                    <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border border-line bg-canvas" />
                    <p className="text-[13px] text-ink-2">{step.label}</p>
                    <p className="text-[11.5px] text-ink-3">{step.caption}</p>
                  </li>
                ))}
            </ol>
          </section>

          {/* Ghi chú nội bộ */}
          <section className="card card-pad">
            <h2 className="h-section mb-2">Ghi chú nội bộ</h2>
            <p className="mb-2 text-[11.5px] text-ink-3">Chỉ nhân viên nhìn thấy, khách không thấy nội dung này.</p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: khách hẹn đến trễ 30 phút, cần kẹp lai áo dài..."
              className="field"
            />
            <button
              type="button"
              onClick={() => toast.push({ tone: "success", title: "Đã lưu ghi chú nội bộ" })}
              className="btn btn-outline btn-sm mt-2"
            >
              Lưu ghi chú
            </button>
          </section>
        </div>

        {/* ---------------------------------------------------- cột phải -- */}
        <aside className="space-y-4 lg:sticky lg:top-[72px] lg:self-start">
          {/* Hành động tiếp theo */}
          <section className="card card-pad">
            <p className="label-xs mb-2">Hành động tiếp theo</p>
            {primary ? (
              <>
                <button type="button" onClick={primary.onClick} disabled={primary.disabled} className="btn btn-block">
                  {primary.label}
                </button>
                <p className="mt-2 text-[11.5px] leading-snug text-ink-2">{meta.nextAction ?? meta.description}</p>
              </>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                {["completed", "cancelled", "expired"].includes(order.status)
                  ? "Đơn đã khép lại, không còn thao tác vận hành."
                  : "Không có hành động nào khả dụng với vai trò hiện tại của bạn."}
              </p>
            )}
          </section>

          {/* Thanh toán */}
          <section className="card card-pad">
            <p className="label-xs mb-2">Thanh toán</p>
            <KeyValue label="Tiền thuê">{formatVnd(order.subtotalRental)}</KeyValue>
            {order.discount > 0 && (
              <KeyValue label={`Giảm giá${order.promotionCode ? ` (${order.promotionCode})` : ""}`}>
                <span className="text-success">−{formatVnd(order.discount)}</span>
              </KeyValue>
            )}
            {order.shippingFee > 0 && <KeyValue label="Phí giao nhận">{formatVnd(order.shippingFee)}</KeyValue>}
            {order.extraFeesTotal > 0 && (
              <KeyValue label="Phí phát sinh">
                <span className="text-danger">{formatVnd(order.extraFeesTotal)}</span>
              </KeyValue>
            )}
            <KeyValue label="Tiền cọc">{formatVnd(order.totalDeposit)}</KeyValue>
            <div className="mt-1 border-t border-line pt-1.5">
              <KeyValue label="Giá trị đơn">
                <span className="text-[14px] font-medium">{formatVnd(order.grandTotal)}</span>
              </KeyValue>
              <KeyValue label="Đã thu">
                <span className="text-success">{formatVnd(order.paidAmount)}</span>
              </KeyValue>
              {due > 0 && (
                <KeyValue label="Còn phải thu">
                  <span className="text-warning">{formatVnd(due)}</span>
                </KeyValue>
              )}
            </div>

            {order.payments.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-2.5 text-[11.5px] text-ink-3">
                {order.payments.map((p) => (
                  <li key={p.id}>
                    {methodLabel(p.method)} · <span className="num">{formatVnd(p.amount)}</span> ·{" "}
                    {p.paidAt ? formatDateTime(p.paidAt) : "chưa thanh toán"}
                  </li>
                ))}
              </ul>
            )}

            {due > 0 && session.can("payment.record") && (
              <button type="button" onClick={() => setPaymentOpen(true)} className="btn btn-outline btn-sm btn-block mt-3">
                Ghi nhận thu tiền mặt
              </button>
            )}
          </section>

          {/* Cọc & quyết toán */}
          <section className="card card-pad">
            <p className="label-xs mb-2">Tiền cọc</p>
            {order.settlement ? (
              <>
                <KeyValue label="Cọc đã giữ">{formatVnd(order.settlement.deposit)}</KeyValue>
                <KeyValue label="Phí phát sinh">
                  <span className="text-danger">−{formatVnd(order.settlement.feesTotal)}</span>
                </KeyValue>
                <div className="mt-1 border-t border-line pt-1.5">
                  <KeyValue label={order.settlement.outstanding > 0 ? "Khách còn nợ" : "Đã hoàn khách"}>
                    <span className={order.settlement.outstanding > 0 ? "text-danger" : "text-success"}>
                      {formatVnd(order.settlement.outstanding > 0 ? order.settlement.outstanding : order.settlement.refundAmount)}
                    </span>
                  </KeyValue>
                </div>
                {order.settlement.refundedAt && (
                  <p className="mt-2 text-[11.5px] text-ink-3">Hoàn lúc {formatDateTime(order.settlement.refundedAt)}</p>
                )}
              </>
            ) : (
              <>
                <p className="num text-[20px] font-medium">{formatVnd(order.totalDeposit)}</p>
                <p className="mt-1 text-[11.5px] leading-snug text-ink-2">
                  Đang giữ, chưa hạch toán doanh thu. Quyết toán khi khách trả đồ và lập xong biên bản kiểm tra.
                </p>
              </>
            )}

            {order.fees.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-line pt-2.5">
                {order.fees.map((f) => (
                  <li key={f.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[12.5px]">{f.label}</span>
                      <span className="num text-[12.5px] text-danger">{formatVnd(f.amount)}</span>
                    </div>
                    <p className="text-[11px] leading-snug text-ink-3">{f.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {order.status === "pending_payment" && (
            <Callout tone="warning" icon={<IconClock width={14} height={14} />}>
              Đơn tự huỷ nếu quá {SETTINGS.checkout_ttl_minutes} phút chưa thanh toán. Booking đang ở trạng thái giữ
              tạm, chưa khoá cứng lịch.
            </Callout>
          )}
        </aside>
      </div>

      {/* ---------------------------------------------------------- modals -- */}
      {assignFor !== null && (
        <AssignUnitDrawer
          open
          onClose={() => setAssignFor(null)}
          orderCode={order.code}
          productSlug={order.items[assignFor].productSlug}
          size={order.items[assignFor].variantSnapshot.size}
          color={order.items[assignFor].variantSnapshot.color}
          pickupDate={order.pickupDate}
          returnDate={order.returnDate}
          assignedCode={order.items[assignFor].unitCodes?.[0] ?? null}
          onAssign={(unitCode) => assignUnit(assignFor, unitCode)}
        />
      )}

      <HandoverFlow
        open={handoverOpen}
        onClose={() => setHandoverOpen(false)}
        order={order}
        onComplete={() => {
          patch({
            status: "in_use",
            paidAmount: order.grandTotal,
            logs: [...order.logs, { status: "in_use", at: new Date().toISOString(), actor: session.user.name }],
          });
        }}
      />

      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        order={order}
        onConfirm={(reason) => {
          patch({
            status: "cancelled",
            logs: [...order.logs, { status: "cancelled", at: new Date().toISOString(), actor: session.user.name, note: reason }],
          });
          setCancelOpen(false);
          toast.push({ tone: "success", title: "Đã huỷ đơn", body: "Booking được nhả, tiền hoàn theo chính sách BR-20." });
        }}
      />

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        due={due}
        onConfirm={(amount, method) => {
          const paid = order.paidAmount + amount;
          patch({
            paidAmount: paid,
            status: order.status === "pending_payment" ? "confirmed" : order.status,
            payments: [
              ...order.payments,
              {
                id: `pm-${Date.now()}`,
                code: `PM${Date.now()}`,
                type: "rental",
                method,
                amount,
                status: "succeeded",
                paidAt: new Date().toISOString(),
              },
            ],
          });
          setPaymentOpen(false);
          toast.push({ tone: "success", title: "Đã ghi nhận thanh toán", body: formatVnd(amount) });
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------- dialogs -- */

function CancelDialog({
  open,
  onClose,
  order,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const estimate = useMemo(() => estimateCancellation(order), [order]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone="danger"
      title="Huỷ đơn thuê"
      description={`${order.code} — còn ${Math.max(0, estimate.daysBeforePickup)} ngày đến ngày nhận.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Giữ đơn
          </button>
          <button type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason)} className="btn btn-danger btn-sm">
            Xác nhận huỷ
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Callout tone="warning" icon={<IconAlert width={14} height={14} />} title={estimate.tierLabel}>
          Hoàn {Math.round(estimate.rentalRefundRate * 100)}% tiền thuê đã trả và 100% tiền cọc theo BR-20.
        </Callout>

        <div className="card card-pad">
          <KeyValue label="Tiền thuê hoàn lại">{formatVnd(estimate.rentalRefund)}</KeyValue>
          <KeyValue label="Tiền cọc hoàn lại">{formatVnd(estimate.depositRefund)}</KeyValue>
          {estimate.forfeited > 0 && (
            <KeyValue label="Không hoàn theo chính sách">
              <span className="text-danger">{formatVnd(estimate.forfeited)}</span>
            </KeyValue>
          )}
          <div className="mt-1 border-t border-line pt-1.5">
            <KeyValue label="Tổng hoàn cho khách">
              <span className="font-medium">{formatVnd(estimate.totalRefund)}</span>
            </KeyValue>
          </div>
        </div>

        {estimate.needsApproval && (
          <Callout tone="warning" icon={<IconAlert width={14} height={14} />}>
            Khoản hoàn vượt {formatVnd(SETTINGS.refund_auto_limit)} nên cần quản lý duyệt trước khi chuyển tiền.
          </Callout>
        )}

        <div>
          <label className="field-label" htmlFor="cancel-reason">
            Lý do huỷ (bắt buộc — sẽ ghi vào nhật ký đơn)
          </label>
          <textarea
            id="cancel-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field"
            placeholder="Ví dụ: khách đổi lịch sự kiện, shop hết đồ thay thế..."
          />
        </div>
      </div>
    </Modal>
  );
}

function PaymentDialog({
  open,
  onClose,
  due,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  due: number;
  onConfirm: (amount: number, method: "cash" | "bank_transfer") => void;
}) {
  const [amount, setAmount] = useState(String(due));
  const [method, setMethod] = useState<"cash" | "bank_transfer">("cash");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setAmount(String(due));
  }, [open, due]);

  const value = Number(amount.replace(/\D/g, "")) || 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ghi nhận thanh toán"
      description={`Cần thu thêm ${formatVnd(due)} cho đơn này.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" disabled={value <= 0} onClick={() => onConfirm(value, method)} className="btn btn-sm">
            Ghi nhận {formatVnd(value)}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="field-label" htmlFor="pay-amount">
            Số tiền nhận
          </label>
          <input
            id="pay-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field num hide-spin"
          />
          {value > due && <p className="field-hint text-warning">Số tiền lớn hơn khoản cần thu — kiểm tra lại.</p>}
        </div>

        <div>
          <p className="field-label">Hình thức</p>
          <div className="flex gap-1.5">
            {(["cash", "bank_transfer"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-[12.5px] transition-colors",
                  method === m ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                )}
              >
                {m === "cash" ? "Tiền mặt" : "Chuyển khoản"}
              </button>
            ))}
          </div>
        </div>

        <Callout tone="info" icon={<IconCheck width={14} height={14} />}>
          Phiếu thu sẽ gắn với đơn và hiện trong lịch sử thanh toán. Thanh toán online chỉ được xác nhận qua IPN của
          cổng thanh toán.
        </Callout>
      </div>
    </Modal>
  );
}

function methodLabel(method: string) {
  return { vnpay: "VNPay", momo: "MoMo", cash: "Tiền mặt", bank_transfer: "Chuyển khoản" }[method] ?? method;
}

export function ScanHint() {
  return <IconScan width={14} height={14} />;
}
