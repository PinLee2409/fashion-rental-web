"use client";

import Link from "next/link";
import { useMemo } from "react";
import { OrderStatusChip } from "@/components/domain/Chips";
import {
  IconAlert,
  IconArrowRight,
  IconBox,
  IconCheck,
  IconClock,
  IconScan,
  IconShield,
  IconStore,
  IconTruck,
  IconWrench,
} from "@/components/ui/Icons";
import { PageHeader, Section, StatCard } from "@/components/ui/PageParts";
import { Dot, EmptyState, Meter, StatusChip } from "@/components/ui/Primitives";
import { MAINTENANCE, ORDERS, UNITS } from "@/data/operations";
import { useMounted } from "@/hooks";
import { formatDate, formatDateLong, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import {
  attentionFor,
  counters,
  revenueSeries,
  statusDistribution,
  todayTimeline,
  topProducts,
} from "@/lib/ops";
import { UNIT_STATUS } from "@/lib/unit-status";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

export default function DashboardPage() {
  const session = useSession();
  const mounted = useMounted();
  const c = useMemo(() => counters(), []);
  const attention = useMemo(() => attentionFor(session.role), [session.role]);
  const timeline = useMemo(() => todayTimeline(), []);
  const distribution = useMemo(() => statusDistribution(), []);

  const isWarehouse = session.role === "warehouse";

  return (
    <>
      <PageHeader
        title="Bảng điều hành"
        description={`Hôm nay ${formatDateLong(todayISO())} · ${session.user.name}${session.user.shift ? ` · ${session.user.shift}` : ""}`}
        actions={
          <>
            {session.can("order.return_inspect") && (
              <Link href="/returns" className="btn btn-outline btn-sm gap-1.5">
                <IconScan width={14} height={14} />
                Quầy nhận trả
              </Link>
            )}
            {session.can("order.view.all") && (
              <Link href="/orders" className="btn btn-sm gap-1.5">
                Xem đơn thuê
                <IconArrowRight width={14} height={14} />
              </Link>
            )}
          </>
        }
      />

      {/* ------------------------------------------------ cần xử lý ngay -- */}
      <Section
        title="Cần xử lý ngay"
        description="Việc có rủi ro phát sinh chi phí hoặc làm lỡ lịch khách nếu để qua ngày."
        className="mb-6"
      >
        {attention.length === 0 ? (
          <div className="card">
            <EmptyState
              compact
              icon={<IconCheck width={22} height={22} />}
              title="Không có việc tồn"
              body="Mọi đơn và cá thể trong phạm vi của bạn đang ở trạng thái bình thường."
            />
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {attention.map((item) => (
              <li key={item.id} className="card card-pad flex min-w-0 flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md",
                      item.tone === "danger"
                        ? "bg-danger-soft text-danger"
                        : item.tone === "warning"
                          ? "bg-warning-soft text-warning"
                          : "bg-info-soft text-info",
                    )}
                  >
                    <IconAlert width={13} height={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-snug">{item.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{item.detail}</p>
                  </div>
                </div>
                <Link href={item.href} className="btn btn-outline btn-sm self-start">
                  {item.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ------------------------------------------------------ chỉ số -- */}
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {!isWarehouse && (
          <>
            <StatCard
              label="Nhận đồ hôm nay"
              value={c.todayPickups}
              sub="Đơn đến hạn bàn giao"
              icon={<IconStore width={15} height={15} />}
              href="/orders?quick=today"
            />
            <StatCard
              label="Trả đồ hôm nay"
              value={c.todayReturns}
              sub="Chuẩn bị quầy nhận trả"
              icon={<IconTruck width={15} height={15} />}
              href="/returns"
            />
            <StatCard label="Đang thuê" value={c.activeRentals} sub="Đồ đang ở chỗ khách" />
            <StatCard
              label="Quá hạn"
              value={c.overdue}
              tone={c.overdue > 0 ? "danger" : "neutral"}
              sub={c.overdue > 0 ? "Phí trễ đang được tính" : "Không có đơn quá hạn"}
              icon={<IconClock width={15} height={15} />}
              href="/orders?quick=overdue"
              alert={c.overdue > 0}
            />
          </>
        )}
        <StatCard
          label="Đang giặt ủi"
          value={c.cleaning}
          tone="warning"
          sub="Cá thể chưa thể cho thuê"
          icon={<IconWrench width={15} height={15} />}
          href="/maintenance"
        />
        <StatCard
          label="Đang sửa chữa"
          value={c.repairing}
          tone="warning"
          sub="Chờ QC trước khi về kho"
          icon={<IconBox width={15} height={15} />}
          href="/maintenance"
        />
        {isWarehouse && (
          <>
            <StatCard label="Cá thể sẵn sàng" value={UNITS.filter((u) => u.status === "available").length} tone="success" sub="Có thể gán vào đơn mới" href="/inventory" />
            <StatCard label="Đang ở chỗ khách" value={UNITS.filter((u) => u.status === "rented").length} sub="Chờ nhận lại" href="/inventory" />
            <StatCard label="Đã giữ cho đơn" value={UNITS.filter((u) => u.status === "reserved").length} tone="info" sub="Đã soạn, chờ bàn giao" href="/inventory" />
            <StatCard label="Ngừng khai thác" value={UNITS.filter((u) => u.status === "retired" || u.status === "lost").length} sub="Thanh lý hoặc mất" href="/inventory" />
          </>
        )}
        {session.can("refund.approve") && (
          <StatCard
            label="Chờ duyệt"
            value={c.pendingApproval}
            tone={c.pendingApproval > 0 ? "warning" : "neutral"}
            sub="Phí vượt hạn mức & hoàn cọc lớn"
            icon={<IconShield width={15} height={15} />}
            href="/approvals"
          />
        )}
        {session.can("report.view") && (
          <StatCard
            label="Doanh thu thuê 30 ngày"
            value={formatVnd(c.revenue30d)}
            sub="Chưa gồm tiền cọc đang giữ"
            href="/reports"
          />
        )}
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.25fr_1fr]">
        {/* -------------------------------------------- việc trong ngày -- */}
        <Section
          title="Hàng đợi hôm nay"
          description="Sắp theo giờ hẹn. Đơn quá hạn luôn nằm đầu danh sách."
          action={
            session.can("order.view.all") ? (
              <Link href="/orders" className="text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink">
                Tất cả đơn
              </Link>
            ) : null
          }
        >
          <div className="card overflow-hidden">
            {timeline.length === 0 ? (
              <EmptyState
                compact
                title="Hôm nay không có lịch giao nhận"
                body="Khi có đơn đến ngày nhận hoặc ngày trả, việc sẽ hiện ở đây kèm giờ hẹn."
              />
            ) : (
              <ul className="divide-y divide-line">
                {timeline.map((e, i) => (
                  <li key={`${e.orderCode}-${e.kind}-${i}`} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className={cn("num w-[46px] shrink-0 text-[12.5px]", e.overdue ? "text-danger" : "text-ink-2")}>
                      {e.time}
                    </span>
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-md",
                        e.kind === "return"
                          ? "bg-info-soft text-info"
                          : e.kind === "collect"
                            ? "bg-danger-soft text-danger"
                            : e.kind === "delivery"
                              ? "bg-accent-soft text-accent"
                              : "bg-success-soft text-success",
                      )}
                    >
                      {e.kind === "return" || e.kind === "collect" ? (
                        <IconScan width={14} height={14} />
                      ) : e.kind === "delivery" ? (
                        <IconTruck width={14} height={14} />
                      ) : (
                        <IconStore width={14} height={14} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">
                        <span className="font-medium">{kindLabel(e.kind)}</span>
                        <span className="text-ink-3"> · </span>
                        <Link href={`/orders/${e.orderCode}`} className="underline-offset-2 hover:underline">
                          {e.orderCode}
                        </Link>
                      </p>
                      <p className="truncate text-[11.5px] text-ink-2">
                        {e.customerName} — {e.summary}
                      </p>
                    </div>
                    <OrderStatusChip status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <div className="min-w-0 space-y-5">
          {/* ------------------------------------ phân bố trạng thái đơn -- */}
          <Section title="Đơn thuê theo trạng thái" description="Tổng quan toàn bộ đơn đang có trong hệ thống.">
            <div className="card card-pad space-y-2.5">
              {distribution.map((row) => {
                const meta = ORDER_STATUS[row.status];
                const pct = Math.round((row.count / ORDERS.length) * 100);
                return (
                  <Link
                    key={row.status}
                    href={`/orders?status=${row.status}`}
                    className="flex items-center gap-3 rounded px-1 py-0.5 transition-colors hover:bg-line-2"
                  >
                    <span className="flex w-[140px] shrink-0 items-center gap-2 text-[12.5px]">
                      <Dot tone={meta.tone as never} />
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span className="flex-1">
                      <Meter value={pct} tone={meta.tone as never} />
                    </span>
                    <span className="num w-7 shrink-0 text-right text-[12.5px]">{row.count}</span>
                  </Link>
                );
              })}
            </div>
          </Section>

          {/* --------------------------------------------- tình trạng kho -- */}
          <Section title="Kho cá thể" description="Cá thể không sẵn sàng là doanh thu đang bị khoá.">
            <div className="card card-pad">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {(["available", "rented", "reserved", "cleaning", "repairing", "retired"] as const).map((status) => {
                  const count = UNITS.filter((u) => u.status === status).length;
                  const meta = UNIT_STATUS[status];
                  return (
                    <div key={status} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[12.5px] text-ink-2">
                        <Dot tone={meta.tone} />
                        {meta.label}
                      </span>
                      <span className="num text-[13px]">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[12px] text-ink-2">Tổng cá thể đang quản lý</span>
                <span className="num text-[14px] font-medium">{UNITS.length}</span>
              </div>
              {MAINTENANCE.filter((t) => t.status === "todo").length > 0 && (
                <Link
                  href="/maintenance"
                  className="mt-3 flex items-center justify-between rounded-md bg-warning-soft px-3 py-2 text-[12px] text-warning transition-opacity hover:opacity-90"
                >
                  <span>{MAINTENANCE.filter((t) => t.status === "todo").length} việc chưa ai nhận trong hàng đợi</span>
                  <IconArrowRight width={13} height={13} />
                </Link>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* ------------------------------------------------------ báo cáo -- */}
      {session.can("report.view") && (
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <Section title="Doanh thu thuê 30 ngày" description="Chỉ tính tiền thuê và phí — tiền cọc không phải doanh thu.">
            <div className="card card-pad">
              {mounted ? <RevenueChart /> : <div className="skeleton h-[132px] w-full" />}
            </div>
          </Section>

          <Section title="Sản phẩm khai thác tốt nhất" description="Xếp theo doanh thu luỹ kế của toàn bộ cá thể.">
            <div className="card overflow-hidden">
              <ul className="divide-y divide-line">
                {topProducts(5).map((p, i) => (
                  <li key={p.slug} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="num w-4 shrink-0 text-[12px] text-ink-3">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/products/${p.slug}`} className="block truncate text-[13px] underline-offset-2 hover:underline">
                        {p.name}
                      </Link>
                      <span className="block text-[11.5px] text-ink-3">{p.rentals} lượt thuê</span>
                    </span>
                    <span className="num shrink-0 text-[12.5px]">{formatVnd(p.revenue)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/reports"
                className="flex items-center justify-between border-t border-line px-3.5 py-2.5 text-[12px] text-ink-2 transition-colors hover:text-ink"
              >
                Xem báo cáo tỷ lệ khai thác
                <IconArrowRight width={13} height={13} />
              </Link>
            </div>
          </Section>
        </div>
      )}
    </>
  );
}

function kindLabel(kind: string) {
  return { pickup: "Khách nhận tại shop", return: "Nhận lại đồ", delivery: "Giao tận nơi", collect: "Thu hồi quá hạn" }[
    kind
  ];
}

function RevenueChart() {
  const series = revenueSeries(30);
  const max = Math.max(...series.map((s) => s.value), 1);
  const total = series.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="num text-[20px] font-medium">{formatVnd(total)}</p>
        <StatusChip tone="success" dot={false}>
          {series.filter((s) => s.value > 0).length} ngày có đơn
        </StatusChip>
      </div>
      <div className="mt-4 flex h-[92px] items-end gap-[3px]">
        {series.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className={cn(
                "w-full rounded-sm transition-colors",
                d.value > 0 ? "bg-ink/80 group-hover:bg-ink" : "bg-line-2",
              )}
              style={{ height: `${Math.max(3, (d.value / max) * 92)}px` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface px-2 py-1 text-[11px] shadow-sm group-hover:block">
              {formatDate(d.date)} · {formatVnd(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-3">
        <span>{formatDate(series[0].date)}</span>
        <span>{formatDate(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}
