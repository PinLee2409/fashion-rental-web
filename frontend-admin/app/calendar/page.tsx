"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UnitCode, UnitStatusChip } from "@/components/domain/Chips";
import { IconAlert, IconArrowLeft, IconArrowRight, IconCalendar } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Overlay";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, SegmentedControl } from "@/components/ui/Primitives";
import { BOOKINGS, UNITS } from "@/data/operations";
import { CATEGORIES } from "@/data/catalog";
import { getProduct } from "@/data/products";
import { useMounted } from "@/hooks";
import type { Booking } from "@/lib/admin-types";
import { addDays, diffDays, formatDate, parseISODate, todayISO, WEEKDAY_SHORT } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { UNIT_STATUS } from "@/lib/unit-status";
import { cn, deaccent } from "@/lib/utils";

type Range = "14" | "30" | "60";
const MAX_ROWS = 60;

export default function CalendarPage() {
  const mounted = useMounted();
  const today = todayISO();

  const [range, setRange] = useState<Range>("14");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyBusy, setOnlyBusy] = useState(false);
  const [picked, setPicked] = useState<{ booking: Booking; unitCode: string } | null>(null);

  const days = Number(range);
  const start = addDays(today, offset);
  const end = addDays(start, days - 1);

  const grid = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return UNITS.filter((u) => {
      if (category !== "all") {
        const product = getProduct(u.productSlug);
        if (product?.categorySlug !== category) return false;
      }
      if (q && !deaccent(`${u.unitCode} ${u.productName} ${u.color} ${u.size}`).includes(q)) return false;
      if (onlyBusy) {
        const busy = BOOKINGS.some(
          (b) => b.unitCode === u.unitCode && b.status !== "cancelled" && b.busyTo >= start && b.busyFrom <= end,
        );
        if (!busy && u.status === "available") return false;
      }
      return true;
    })
      .sort((a, b) => a.productName.localeCompare(b.productName, "vi") || a.unitCode.localeCompare(b.unitCode))
      .slice(0, MAX_ROWS);
  }, [search, category, onlyBusy, start, end]);

  const bookingsInView = useMemo(
    () => BOOKINGS.filter((b) => b.status !== "cancelled" && b.busyTo >= start && b.busyFrom <= end),
    [start, end],
  );

  return (
    <>
      <PageHeader
        title="Lịch thuê tổng"
        description="Mỗi hàng là một cá thể vật lý. Thanh đậm là thời gian khách giữ đồ, phần gạch chéo là ngày đệm giặt ủi — cả hai đều chặn đơn mới."
        breadcrumb={[{ label: "Vận hành" }, { label: "Lịch thuê" }]}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOffset((o) => o - days)} className="btn btn-outline btn-sm btn-icon" aria-label="Kỳ trước">
              <IconArrowLeft width={14} height={14} />
            </button>
            <button type="button" onClick={() => setOffset(0)} className="btn btn-outline btn-sm">
              Hôm nay
            </button>
            <button type="button" onClick={() => setOffset((o) => o + days)} className="btn btn-outline btn-sm btn-icon" aria-label="Kỳ sau">
              <IconArrowRight width={14} height={14} />
            </button>
            <SegmentedControl
              value={range}
              onChange={(r) => {
                setRange(r);
                setOffset(0);
              }}
              options={[
                { key: "14", label: "14 ngày" },
                { key: "30", label: "30 ngày" },
                { key: "60", label: "60 ngày" },
              ]}
            />
          </div>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm mã cá thể hoặc tên sản phẩm..."
        resultLabel={`${rows.length} cá thể · ${bookingsInView.length} lịch bận`}
        right={
          <>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field h-[28px] w-auto py-0 text-[12.5px]"
              aria-label="Lọc theo danh mục"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[12px] text-ink-2">
              <input
                type="checkbox"
                checked={onlyBusy}
                onChange={() => setOnlyBusy((v) => !v)}
                className="h-3.5 w-3.5 accent-[#181818]"
              />
              Chỉ cá thể có lịch
            </label>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-2">
        <Legend className="bg-ink" label="Đang thuê / đã đặt" />
        <Legend className="bg-info" label="Đã xác nhận, chưa giao" />
        <Legend className="bg-warning/70" label="Giữ tạm (chờ thanh toán)" />
        <Legend className="border border-dashed border-ink-3 bg-line-2" label="Ngày đệm giặt ủi" />
        <span className="text-ink-3">
          {formatDate(start)} → {formatDate(end)}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCalendar width={22} height={22} />}
            title="Không có cá thể nào khớp bộ lọc"
            body="Thử bỏ lọc danh mục, hoặc tắt “Chỉ cá thể có lịch” để xem cả những cá thể đang rảnh."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Hàng ngày */}
              <div className="sticky top-0 z-10 flex border-b border-line bg-surface-2">
                <div className="w-[220px] shrink-0 border-r border-line px-3 py-2 text-[11.5px] font-medium text-ink-2">
                  Cá thể
                </div>
                <div className="flex flex-1">
                  {grid.map((d) => {
                    const dow = parseISODate(d).getDay();
                    const isToday = d === today;
                    const weekend = dow === 0 || dow === 6;
                    return (
                      <div
                        key={d}
                        className={cn(
                          "flex-1 border-r border-line-2 py-1.5 text-center last:border-r-0",
                          weekend && "bg-canvas",
                          isToday && "bg-beige",
                        )}
                      >
                        <p className={cn("text-[10.5px]", isToday ? "text-ink" : "text-ink-3")}>
                          {WEEKDAY_SHORT[(dow + 6) % 7]}
                        </p>
                        <p className={cn("num text-[11.5px]", isToday && "font-semibold")}>{Number(d.slice(8, 10))}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hàng cá thể */}
              <ul>
                {rows.map((unit) => {
                  const unitBookings = bookingsInView.filter((b) => b.unitCode === unit.unitCode);
                  return (
                    <li key={unit.unitCode} className="flex border-b border-line-2 last:border-b-0">
                      <div className="w-[220px] shrink-0 border-r border-line px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <UnitCode code={unit.unitCode} />
                        </div>
                        <p className="mt-1 truncate text-[11.5px] text-ink-2">{unit.productName}</p>
                        <p className="truncate text-[11px] text-ink-3">
                          {unit.size} · {unit.color} · {UNIT_STATUS[unit.status].label}
                        </p>
                      </div>

                      <div className="relative flex-1">
                        {/* lưới nền */}
                        <div className="flex h-full">
                          {grid.map((d) => {
                            const dow = parseISODate(d).getDay();
                            return (
                              <div
                                key={d}
                                className={cn(
                                  "flex-1 border-r border-line-2 last:border-r-0",
                                  (dow === 0 || dow === 6) && "bg-canvas/70",
                                  d === today && "bg-beige/50",
                                )}
                              />
                            );
                          })}
                        </div>

                        {/* thanh lịch */}
                        <div className="absolute inset-0 py-2">
                          {unitBookings.map((b) => {
                            const rentalLeft = (Math.max(0, diffDays(start, b.pickupDate)) / days) * 100;
                            const rentalWidth =
                              ((Math.min(days, diffDays(start, b.returnDate) + 1) - Math.max(0, diffDays(start, b.pickupDate))) /
                                days) *
                              100;
                            const bufferStart = diffDays(start, b.returnDate) + 1;
                            const bufferWidth = ((Math.min(days, diffDays(start, b.busyTo) + 1) - bufferStart) / days) * 100;
                            const tone =
                              b.status === "held"
                                ? "bg-warning/70"
                                : b.orderCode && ["confirmed"].includes(b.status)
                                  ? "bg-info"
                                  : "bg-ink";

                            return (
                              <div key={b.id}>
                                <button
                                  type="button"
                                  onClick={() => setPicked({ booking: b, unitCode: unit.unitCode })}
                                  title={`${b.orderCode ?? "Booking"} · ${b.customerName ?? ""}`}
                                  className={cn(
                                    "absolute top-2 flex h-[22px] items-center overflow-hidden rounded-sm px-1.5 text-[10.5px] text-white transition-opacity hover:opacity-90",
                                    tone,
                                  )}
                                  style={{
                                    left: `${rentalLeft}%`,
                                    width: `${Math.max(1.5, rentalWidth)}%`,
                                  }}
                                >
                                  <span className="truncate">{b.orderCode ?? b.customerName ?? "Giữ chỗ"}</span>
                                </button>
                                {bufferWidth > 0 && (
                                  <span
                                    title="Ngày đệm giặt ủi"
                                    className="absolute top-2 h-[22px] rounded-sm border border-dashed border-ink-3 bg-line-2"
                                    style={{ left: `${(bufferStart / days) * 100}%`, width: `${bufferWidth}%` }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {UNITS.length > rows.length && (
            <div className="border-t border-line px-3.5 py-2 text-[11.5px] text-ink-3">
              Đang hiển thị {rows.length} trong tổng {UNITS.length} cá thể — dùng bộ lọc danh mục hoặc ô tìm kiếm để thu
              hẹp danh sách.
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------- chi tiết booking -- */}
      <Drawer
        open={Boolean(picked)}
        onClose={() => setPicked(null)}
        title={picked?.booking.orderCode ?? "Lịch giữ chỗ"}
        subtitle={picked ? `${picked.unitCode} · ${picked.booking.customerName ?? "—"}` : undefined}
        footer={
          picked?.booking.orderCode ? (
            <Link href={`/orders/${picked.booking.orderCode}`} className="btn btn-sm btn-block" onClick={() => setPicked(null)}>
              Mở màn hình xử lý đơn
            </Link>
          ) : null
        }
      >
        {picked && (
          <div className="space-y-4 px-5 py-5">
            <div className="card card-pad">
              <KeyValue label="Khách nhận">{formatDate(picked.booking.pickupDate)}</KeyValue>
              <KeyValue label="Khách trả">{formatDate(picked.booking.returnDate)}</KeyValue>
              <KeyValue label="Khoá lịch đến">{formatDate(picked.booking.busyTo)}</KeyValue>
              <KeyValue label="Trạng thái booking">
                {picked.booking.status === "held" ? "Giữ tạm" : picked.booking.status === "confirmed" ? "Đã khoá cứng" : "Đã hoàn tất"}
              </KeyValue>
            </div>

            {(() => {
              const unit = UNITS.find((u) => u.unitCode === picked.unitCode)!;
              const product = getProduct(unit.productSlug);
              return (
                <div className="card card-pad">
                  <p className="label-xs mb-2">Cá thể</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">{unit.productName}</p>
                      <p className="text-[11.5px] text-ink-2">
                        {unit.size} · {unit.color} · đã thuê {unit.rentalCount} lượt
                      </p>
                    </div>
                    <UnitStatusChip status={unit.status} />
                  </div>
                  {product && (
                    <p className="mt-2 text-[11.5px] text-ink-3">
                      Giá thuê từ {formatVnd(product.basePrice)}/ngày · cọc {formatVnd(product.baseDeposit)}
                    </p>
                  )}
                  <Link
                    href={`/inventory?unit=${unit.unitCode}`}
                    className="mt-3 inline-block text-[12px] underline underline-offset-2 hover:text-accent"
                    onClick={() => setPicked(null)}
                  >
                    Xem hồ sơ cá thể
                  </Link>
                </div>
              );
            })()}

            {picked.booking.status === "held" && (
              <Callout tone="warning" icon={<IconAlert width={14} height={14} />}>
                Booking đang giữ tạm theo đơn chưa thanh toán. Quá hạn giữ chỗ, job nền sẽ nhả lịch tự động.
              </Callout>
            )}
          </div>
        )}
      </Drawer>

      {!mounted && <span className="sr-only">Đang tải lịch</span>}
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-4 rounded-sm", className)} />
      {label}
    </span>
  );
}
