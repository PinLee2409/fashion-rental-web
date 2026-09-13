"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { OrderStatusChip } from "@/components/domain/Chips";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { DataTable, type Column, type Density } from "@/components/ui/DataTable";
import { IconDownload, IconList, IconPlus, IconStore, IconTruck } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Overlay";
import { ActiveFilters, PageHeader, Toolbar } from "@/components/ui/PageParts";
import { EmptyState, KeyValue, MoreMenu, Skeleton, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ORDERS, customerOfOrder } from "@/data/operations";
import { useMounted } from "@/hooks";
import { describeDaysLeft, formatDate, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { canCancel, ORDER_STATUS } from "@/lib/order-status";
import type { Order, OrderStatus, PickupMethod } from "@/lib/types";
import { cn, deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

const QUICK = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Nhận hôm nay" },
  { key: "return_today", label: "Trả hôm nay" },
  { key: "pending_payment", label: "Chờ thanh toán" },
  { key: "preparing", label: "Đang soạn đồ" },
  { key: "ready", label: "Sẵn sàng" },
  { key: "in_use", label: "Đang thuê" },
  { key: "overdue", label: "Quá hạn" },
];

const ALL_STATUSES: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "preparing",
  "ready",
  "in_use",
  "overdue",
  "inspecting",
  "pending_approval",
  "disputed",
  "completed",
  "cancelled",
  "expired",
];

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("all");
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [methods, setMethods] = useState<PickupMethod[]>([]);
  const [channels, setChannels] = useState<("online" | "walk_in")[]>([]);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [density, setDensity] = useState<Density>("comfortable");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [preview, setPreview] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = params.get("quick");
    const s = params.get("status");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (q) setQuick(q);
    if (s) setStatuses([s as OrderStatus]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(id);
  }, [search, quick, statuses, methods, channels, unpaidOnly]);

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return ORDERS.filter((o) => {
      if (q) {
        const hay = deaccent(`${o.code} ${o.receiverName} ${o.receiverPhone} ${o.items.map((i) => i.productNameSnapshot).join(" ")}`);
        if (!hay.includes(q)) return false;
      }
      if (statuses.length && !statuses.includes(o.status)) return false;
      if (methods.length && !methods.includes(o.pickupMethod)) return false;
      if (channels.length && !channels.includes(o.channel)) return false;
      if (unpaidOnly && o.paidAmount >= o.grandTotal) return false;

      switch (quick) {
        case "today":
          return o.pickupDate === today && ["confirmed", "preparing", "ready"].includes(o.status);
        case "return_today":
          return o.returnDate === today && ["in_use", "overdue"].includes(o.status);
        case "pending_payment":
        case "preparing":
        case "ready":
        case "in_use":
        case "overdue":
          return o.status === quick;
        default:
          return true;
      }
    });
  }, [search, quick, statuses, methods, channels, unpaidOnly, today]);

  const activeFilters = [
    ...statuses.map((s) => ({
      label: ORDER_STATUS[s].label,
      onClear: () => setStatuses((p) => p.filter((x) => x !== s)),
    })),
    ...methods.map((m) => ({
      label: m === "at_store" ? "Nhận tại shop" : "Giao tận nơi",
      onClear: () => setMethods((p) => p.filter((x) => x !== m)),
    })),
    ...channels.map((ch) => ({
      label: ch === "online" ? "Đơn online" : "Đơn tại quầy",
      onClear: () => setChannels((p) => p.filter((x) => x !== ch)),
    })),
    ...(unpaidOnly ? [{ label: "Chưa thu đủ tiền", onClear: () => setUnpaidOnly(false) }] : []),
  ];

  const columns: Column<Order>[] = [
    {
      key: "code",
      header: "Mã đơn",
      width: "170px",
      sortValue: (o) => o.code,
      render: (o) => (
        <div className="flex flex-col gap-1">
          <Link href={`/orders/${o.code}`} className="num text-[12.5px] underline-offset-2 hover:underline">
            {o.code}
          </Link>
          <span data-row-detail className="text-[11px] text-ink-3">
            {o.channel === "walk_in" ? "Tại quầy" : "Online"} · {formatDate(o.createdAt.slice(0, 10))}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Khách hàng",
      sortValue: (o) => o.receiverName,
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate text-[13px]">{o.receiverName}</p>
          <p data-row-detail className="num truncate text-[11.5px] text-ink-3">{o.receiverPhone}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Món thuê",
      hideBelow: "lg",
      render: (o) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {o.items.slice(0, 2).map((it, i) => (
              <ProductMedia key={i} thumb image={it.image} ratio="1/1" className="h-7 w-7 rounded border border-surface" />
            ))}
          </div>
          <span className="min-w-0 truncate text-[12.5px] text-ink-2">
            {o.items[0].productNameSnapshot}
            {o.items.length > 1 && ` +${o.items.length - 1}`}
          </span>
        </div>
      ),
    },
    {
      key: "period",
      header: "Kỳ thuê",
      sortValue: (o) => o.pickupDate,
      render: (o) => (
        <div>
          <p className="num text-[12.5px]">
            {formatDate(o.pickupDate)} → {formatDate(o.returnDate)}
          </p>
          <p data-row-detail className="text-[11px] text-ink-3">
            {o.items[0].days} ngày
            {["in_use", "overdue"].includes(o.status) && (
              <span className={cn("ml-1.5", o.status === "overdue" ? "text-danger" : "text-ink-2")}>
                · {mounted ? describeDaysLeft(o.returnDate) : "—"}
              </span>
            )}
          </p>
        </div>
      ),
    },
    {
      key: "method",
      header: "Nhận đồ",
      hideBelow: "xl",
      width: "110px",
      render: (o) => (
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
          {o.pickupMethod === "at_store" ? <IconStore width={13} height={13} /> : <IconTruck width={13} height={13} />}
          {o.pickupMethod === "at_store" ? "Tại shop" : "Giao"}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Thanh toán",
      hideBelow: "md",
      width: "132px",
      sortValue: (o) => o.paidAmount / Math.max(1, o.grandTotal),
      render: (o) => {
        const done = o.paidAmount >= o.grandTotal;
        const rest = o.grandTotal - o.paidAmount;
        return (
          <div>
            <p className={cn("text-[12.5px]", done ? "text-success" : "text-warning")}>
              {done ? "Đã thu đủ" : o.paidAmount === 0 ? "Chưa thu" : "Thu một phần"}
            </p>
            {!done && <p data-row-detail className="num text-[11px] text-ink-3">còn {formatVnd(rest)}</p>}
          </div>
        );
      },
    },
    {
      key: "deposit",
      header: "Cọc giữ",
      align: "right",
      hideBelow: "xl",
      width: "110px",
      sortValue: (o) => o.totalDeposit,
      render: (o) => <span className="num text-[12.5px] text-ink-2">{formatVnd(o.totalDeposit)}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "150px",
      sortValue: (o) => ORDER_STATUS[o.status].label,
      render: (o) => <OrderStatusChip status={o.status} />,
    },
    {
      key: "total",
      header: "Giá trị đơn",
      align: "right",
      width: "120px",
      sortValue: (o) => o.grandTotal,
      render: (o) => <span className="num text-[13px]">{formatVnd(o.grandTotal)}</span>,
    },
    {
      key: "actions",
      header: "",
      width: "104px",
      align: "right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/orders/${o.code}`} className="btn btn-outline btn-sm">
            Xem
          </Link>
          <MoreMenu
            items={[
              { label: "Xem nhanh", onSelect: () => setPreview(o) },
              {
                label: "Bàn giao đồ",
                disabled: o.status !== "ready" || !session.can("order.handover"),
                onSelect: () => router.push(`/orders/${o.code}?action=handover`),
              },
              {
                label: "Nhận lại đồ",
                disabled: !["in_use", "overdue"].includes(o.status) || !session.can("order.return_inspect"),
                onSelect: () => router.push(`/returns?order=${o.code}`),
              },
              {
                label: "Ghi nhận thu tiền mặt",
                disabled: o.paidAmount >= o.grandTotal || !session.can("payment.record"),
                onSelect: () => router.push(`/orders/${o.code}?action=payment`),
              },
              {
                label: "Huỷ đơn",
                danger: true,
                disabled: !canCancel(o.status) || !session.can("order.cancel"),
                onSelect: () => router.push(`/orders/${o.code}?action=cancel`),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Đơn thuê"
        description="Toàn bộ đơn online và đơn tại quầy. Hành động khả dụng thay đổi theo trạng thái đơn và quyền của bạn."
        breadcrumb={[{ label: "Vận hành" }, { label: "Đơn thuê" }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => toast.push({ tone: "info", title: "Đang xuất Excel", body: `${rows.length} đơn theo bộ lọc hiện tại.` })}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <IconDownload width={14} height={14} />
              Xuất Excel
            </button>
            {session.can("order.create") && (
              <Link href="/orders/new" className="btn btn-sm gap-1.5">
                <IconPlus width={14} height={14} />
                Đơn tại quầy
              </Link>
            )}
          </>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm mã đơn, tên khách, số điện thoại..."
        quickFilters={QUICK.map((q) => ({
          ...q,
          count:
            q.key === "all"
              ? ORDERS.length
              : ORDERS.filter((o) =>
                  q.key === "today"
                    ? o.pickupDate === today && ["confirmed", "preparing", "ready"].includes(o.status)
                    : q.key === "return_today"
                      ? o.returnDate === today && ["in_use", "overdue"].includes(o.status)
                      : o.status === q.key,
                ).length,
        }))}
        activeQuick={quick}
        onQuickChange={setQuick}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilters.length}
        density={density}
        onDensityChange={setDensity}
        resultLabel={loading ? "Đang tải..." : `${rows.length} đơn`}
      />

      <ActiveFilters
        items={activeFilters}
        onClearAll={() => {
          setStatuses([]);
          setMethods([]);
          setChannels([]);
          setUnpaidOnly(false);
        }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(o) => o.code}
        density={density}
        loading={loading}
        onRowClick={(o) => router.push(`/orders/${o.code}`)}
        initialSort={{ key: "period", dir: "asc" }}
        empty={
          <EmptyState
            icon={<IconList width={22} height={22} />}
            title="Không có đơn nào khớp bộ lọc"
            body="Thử bỏ bớt điều kiện lọc, hoặc chuyển sang bộ lọc nhanh “Tất cả” để xem toàn bộ đơn."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuick("all");
                  setSearch("");
                  setStatuses([]);
                  setMethods([]);
                  setChannels([]);
                  setUnpaidOnly(false);
                }}
                className="btn btn-outline btn-sm"
              >
                Xoá toàn bộ bộ lọc
              </button>
            }
          />
        }
        cardRender={(o) => (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="num text-[12.5px]">{o.code}</p>
                <p className="truncate text-[13px]">{o.receiverName}</p>
              </div>
              <OrderStatusChip status={o.status} />
            </div>
            <p className="num mt-1.5 text-[12px] text-ink-2">
              {formatDate(o.pickupDate)} → {formatDate(o.returnDate)} · {formatVnd(o.grandTotal)}
            </p>
          </div>
        )}
      />

      {/* ------------------------------------------------- bộ lọc nâng cao -- */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Bộ lọc nâng cao"
        subtitle={`${rows.length} đơn khớp điều kiện`}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStatuses([]);
                setMethods([]);
                setChannels([]);
                setUnpaidOnly(false);
              }}
              className="btn btn-outline btn-sm flex-1"
            >
              Đặt lại
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="btn btn-sm flex-1">
              Áp dụng
            </button>
          </div>
        }
      >
        <div className="space-y-6 px-5 py-5">
          <div>
            <p className="label-xs mb-2">Trạng thái đơn</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_STATUSES.map((s) => {
                const active = statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatuses((p) => (active ? p.filter((x) => x !== s) : [...p, s]))}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors",
                      active ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                    )}
                  >
                    {ORDER_STATUS[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="label-xs mb-2">Hình thức nhận đồ</p>
            <div className="flex gap-1.5">
              {(["at_store", "delivery"] as PickupMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
                  className={cn(
                    "flex-1 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                    methods.includes(m) ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                  )}
                >
                  {m === "at_store" ? "Nhận tại shop" : "Giao tận nơi"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-xs mb-2">Kênh đặt</p>
            <div className="flex gap-1.5">
              {(["online", "walk_in"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannels((p) => (p.includes(ch) ? p.filter((x) => x !== ch) : [...p, ch]))}
                  className={cn(
                    "flex-1 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                    channels.includes(ch) ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                  )}
                >
                  {ch === "online" ? "Online" : "Tại quầy"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px]">
            <input
              type="checkbox"
              checked={unpaidOnly}
              onChange={() => setUnpaidOnly((v) => !v)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
            />
            <span>
              Chỉ hiện đơn chưa thu đủ tiền
              <span className="mt-0.5 block text-[11.5px] text-ink-3">
                Gồm đơn chờ thanh toán và đơn cọc giữ chỗ còn phần thu khi nhận đồ.
              </span>
            </span>
          </label>
        </div>
      </Drawer>

      {/* --------------------------------------------------- xem nhanh đơn -- */}
      <Drawer
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.code ?? ""}
        subtitle={preview ? `${preview.receiverName} · ${preview.receiverPhone}` : ""}
        footer={
          preview ? (
            <Link href={`/orders/${preview.code}`} className="btn btn-sm btn-block" onClick={() => setPreview(null)}>
              Mở màn hình xử lý đơn
            </Link>
          ) : null
        }
      >
        {preview && (
          <div className="space-y-5 px-5 py-5">
            <div className="flex items-center justify-between">
              <OrderStatusChip status={preview.status} />
              <span className="text-[11.5px] text-ink-3">Tạo lúc {formatDateTime(preview.createdAt)}</span>
            </div>

            <p className="text-[12.5px] leading-relaxed text-ink-2">{ORDER_STATUS[preview.status].description}</p>

            <div className="card divide-y divide-line">
              {preview.items.map((it, i) => (
                <div key={i} className="flex gap-3 p-3">
                  <ProductMedia image={it.image} ratio="3/4" className="w-12 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{it.productNameSnapshot}</p>
                    <p className="text-[11.5px] text-ink-2">
                      {it.variantSnapshot.size} · {it.variantSnapshot.color} · SL {it.quantity}
                    </p>
                    {it.unitCodes ? (
                      <p className="num mt-1 text-[11px] text-ink-3">{it.unitCodes.join(", ")}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-ink-3">Chưa gán cá thể</p>
                    )}
                  </div>
                  <span className="num shrink-0 text-[12.5px]">{formatVnd(it.lineRentalTotal)}</span>
                </div>
              ))}
            </div>

            <div className="card card-pad">
              <KeyValue label="Tiền thuê">{formatVnd(preview.subtotalRental)}</KeyValue>
              {preview.discount > 0 && <KeyValue label="Giảm giá">−{formatVnd(preview.discount)}</KeyValue>}
              <KeyValue label="Tiền cọc đang giữ">{formatVnd(preview.totalDeposit)}</KeyValue>
              <div className="mt-1 border-t border-line pt-1">
                <KeyValue label="Đã thu">{formatVnd(preview.paidAmount)}</KeyValue>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusChip tone="neutral" dot={false}>
                {preview.pickupMethod === "at_store" ? "Nhận tại shop" : "Giao tận nơi"}
              </StatusChip>
              <StatusChip tone="neutral" dot={false}>
                {preview.channel === "walk_in" ? "Đơn tại quầy" : "Đơn online"}
              </StatusChip>
              {customerOfOrder(preview.code)?.lateReturns ? (
                <StatusChip tone="warning">Khách từng trả trễ</StatusChip>
              ) : null}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
