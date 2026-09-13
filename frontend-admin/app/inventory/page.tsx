"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ConditionChip, UnitCode, UnitStatusChip } from "@/components/domain/Chips";
import { UnitTagDialog } from "@/components/domain/UnitTagDialog";
import { DataTable, type Column, type Density } from "@/components/ui/DataTable";
import { IconBox, IconDownload, IconPrinter, IconSwap } from "@/components/ui/Icons";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { ActiveFilters, PageHeader, Toolbar } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, Meter, MoreMenu, Skeleton, StatusChip } from "@/components/ui/Primitives";
import { QrCode } from "@/components/ui/Qr";
import { useToast } from "@/components/ui/Toast";
import { MAINTENANCE, UNITS, bookingsOfUnit, nextBookingOfUnit } from "@/data/operations";
import { CATEGORIES } from "@/data/catalog";
import { getProduct } from "@/data/products";
import { useMounted } from "@/hooks";
import type { RentalUnit, UnitStatus } from "@/lib/admin-types";
import { formatDate, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { MAINTENANCE_STATUS, MAINTENANCE_TYPE, UNIT_STATUS, UNIT_TRANSITIONS } from "@/lib/unit-status";
import { cn, deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

const STATUSES: UnitStatus[] = ["available", "reserved", "rented", "cleaning", "repairing", "retired", "lost"];

export default function InventoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
      <InventoryView />
    </Suspense>
  );
}

function InventoryView() {
  const params = useSearchParams();
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();

  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<UnitStatus[]>([]);
  const [category, setCategory] = useState("all");
  const [density, setDensity] = useState<Density>("compact");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<RentalUnit | null>(null);
  const [tagUnits, setTagUnits] = useState<RentalUnit[] | null>(null);
  const [statusModal, setStatusModal] = useState<RentalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, UnitStatus>>({});

  useEffect(() => {
    const unit = params.get("unit");
    if (unit) {
      const found = UNITS.find((u) => u.unitCode === unit);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setDetail(found);
    }
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(id);
  }, [search, statuses, category]);

  const statusOf = (u: RentalUnit) => overrides[u.unitCode] ?? u.status;

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return UNITS.filter((u) => {
      if (q && !deaccent(`${u.unitCode} ${u.productName} ${u.size} ${u.color} ${u.location ?? ""}`).includes(q)) return false;
      if (statuses.length && !statuses.includes(statusOf(u))) return false;
      if (category !== "all" && getProduct(u.productSlug)?.categorySlug !== category) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statuses, category, overrides]);

  const columns: Column<RentalUnit>[] = [
    {
      key: "code",
      header: "Mã cá thể",
      width: "148px",
      sortValue: (u) => u.unitCode,
      render: (u) => <UnitCode code={u.unitCode} />,
    },
    {
      key: "product",
      header: "Sản phẩm",
      sortValue: (u) => u.productName,
      render: (u) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px]">{u.productName}</p>
          <p data-row-detail className="truncate text-[11px] text-ink-3">
            {u.size} · {u.color}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "140px",
      sortValue: (u) => UNIT_STATUS[statusOf(u)].label,
      render: (u) => <UnitStatusChip status={statusOf(u)} />,
    },
    {
      key: "condition",
      header: "Tình trạng",
      width: "100px",
      hideBelow: "lg",
      sortValue: (u) => u.conditionGrade,
      render: (u) => <ConditionChip grade={u.conditionGrade} />,
    },
    {
      key: "rentals",
      header: "Lượt thuê",
      align: "right",
      width: "86px",
      sortValue: (u) => u.rentalCount,
      render: (u) => <span className="num text-[12.5px]">{u.rentalCount}</span>,
    },
    {
      key: "location",
      header: "Vị trí",
      width: "90px",
      hideBelow: "xl",
      sortValue: (u) => u.location ?? "",
      render: (u) => <span className="num text-[12px] text-ink-2">{u.location ?? "—"}</span>,
    },
    {
      key: "cleaned",
      header: "Giặt lần cuối",
      width: "130px",
      hideBelow: "xl",
      sortValue: (u) => u.lastCleanedAt ?? "",
      render: (u) => (
        <span className="num text-[12px] text-ink-2">{u.lastCleanedAt ? formatDate(u.lastCleanedAt.slice(0, 10)) : "—"}</span>
      ),
    },
    {
      key: "next",
      header: "Booking kế tiếp",
      width: "148px",
      hideBelow: "lg",
      render: (u) => {
        const next = mounted ? nextBookingOfUnit(u.unitCode) : undefined;
        return next ? (
          <span className="num text-[12px]">
            {formatDate(next.pickupDate)}
            {next.orderCode && <span className="ml-1 text-ink-3">{next.orderCode.slice(-4)}</span>}
          </span>
        ) : (
          <span className="text-[12px] text-ink-3">Chưa có</span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "110px",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setDetail(u)} className="btn btn-outline btn-sm">
            Chi tiết
          </button>
          <MoreMenu
            items={[
              {
                label: "Đổi trạng thái",
                disabled: !session.can("unit.lifecycle"),
                onSelect: () => setStatusModal(u),
              },
              { label: "In lại tem QR", onSelect: () => setTagUnits([u]) },
              {
                label: "Xem lịch cá thể",
                onSelect: () => toast.push({ tone: "info", title: "Mở lịch thuê", body: u.unitCode }),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const activeFilters = [
    ...statuses.map((s) => ({ label: UNIT_STATUS[s].label, onClear: () => setStatuses((p) => p.filter((x) => x !== s)) })),
    ...(category !== "all"
      ? [{ label: CATEGORIES.find((c) => c.slug === category)?.name ?? category, onClear: () => setCategory("all") }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Kho cá thể"
        description="Tồn kho của hệ thống cho thuê là từng cá thể vật lý có mã QR riêng, không phải con số tồn. Trạng thái ở đây quyết định cá thể có gán được vào đơn mới hay không."
        breadcrumb={[{ label: "Kho & cá thể" }, { label: "Kho cá thể" }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => toast.push({ tone: "info", title: "Đang xuất Excel", body: `${rows.length} cá thể` })}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <IconDownload width={14} height={14} />
              Xuất Excel
            </button>
            {session.can("unit.manage") && (
              <button
                type="button"
                onClick={() =>
                  setTagUnits(selected.length > 0 ? rows.filter((u) => selected.includes(u.unitCode)) : rows)
                }
                className="btn btn-outline btn-sm gap-1.5"
              >
                <IconPrinter width={14} height={14} />
                In tem QR
              </button>
            )}
          </>
        }
        meta={
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
            <span>
              Tổng <span className="num text-ink">{UNITS.length}</span> cá thể
            </span>
            <span>
              Sẵn sàng <span className="num text-success">{UNITS.filter((u) => statusOf(u) === "available").length}</span>
            </span>
            <span>
              Không khai thác được{" "}
              <span className="num text-warning">{UNITS.filter((u) => !["available"].includes(statusOf(u))).length}</span>
            </span>
          </div>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm mã cá thể, sản phẩm, vị trí kệ..."
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilters.length}
        density={density}
        onDensityChange={setDensity}
        resultLabel={loading ? "Đang tải..." : `${rows.length} cá thể`}
        quickFilters={[
          { key: "all", label: "Tất cả", count: UNITS.length },
          ...STATUSES.map((s) => ({
            key: s,
            label: UNIT_STATUS[s].label,
            count: UNITS.filter((u) => statusOf(u) === s).length,
          })),
        ]}
        activeQuick={statuses.length === 1 ? statuses[0] : "all"}
        onQuickChange={(key) => setStatuses(key === "all" ? [] : [key as UnitStatus])}
      />

      <ActiveFilters items={activeFilters} onClearAll={() => { setStatuses([]); setCategory("all"); }} />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(u) => u.unitCode}
        density={density}
        loading={loading}
        onRowClick={(u) => setDetail(u)}
        selectable={session.can("unit.lifecycle")}
        selected={selected}
        onSelectedChange={setSelected}
        maxHeight="calc(100vh - 340px)"
        bulkBar={(sel, clear) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOverrides((p) => ({ ...p, ...Object.fromEntries(sel.map((code) => [code, "cleaning" as UnitStatus])) }));
                toast.push({ tone: "success", title: `Đã chuyển ${sel.length} cá thể sang Đang giặt ủi` });
                clear();
              }}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <IconSwap width={13} height={13} />
              Chuyển sang giặt ủi
            </button>
            <button type="button" onClick={clear} className="btn btn-ghost btn-sm">
              Bỏ chọn
            </button>
          </div>
        )}
        empty={
          <EmptyState
            icon={<IconBox width={22} height={22} />}
            title="Không có cá thể nào khớp bộ lọc"
            body="Thử xoá bộ lọc trạng thái, hoặc tìm bằng mã sản phẩm thay vì mã cá thể."
          />
        }
        cardRender={(u) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <UnitCode code={u.unitCode} />
              <UnitStatusChip status={statusOf(u)} />
            </div>
            <p className="mt-1.5 truncate text-[12.5px]">{u.productName}</p>
            <p className="text-[11.5px] text-ink-3">
              {u.size} · {u.color} · {u.rentalCount} lượt · {u.location ?? "—"}
            </p>
          </div>
        )}
      />

      {/* ------------------------------------------------------- bộ lọc -- */}
      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Bộ lọc kho">
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="label-xs mb-2">Trạng thái cá thể</p>
            <div className="space-y-1.5">
              {STATUSES.map((s) => (
                <label key={s} className="flex cursor-pointer items-start gap-2.5 text-[12.5px]">
                  <input
                    type="checkbox"
                    checked={statuses.includes(s)}
                    onChange={() => setStatuses((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))}
                    className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
                  />
                  <span>
                    {UNIT_STATUS[s].label}
                    <span className="mt-0.5 block text-[11px] text-ink-3">{UNIT_STATUS[s].description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="cat">
              Danh mục
            </label>
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Drawer>

      {/* ------------------------------------------------- chi tiết cá thể -- */}
      <UnitDrawer
        unit={detail}
        status={detail ? statusOf(detail) : undefined}
        onClose={() => setDetail(null)}
        onChangeStatus={(u) => setStatusModal(u)}
        onPrintTag={(u) => setTagUnits([u])}
      />

      {/* ---------------------------------------------------- tem QR cá thể -- */}
      <UnitTagDialog open={tagUnits !== null} onClose={() => setTagUnits(null)} units={tagUnits ?? []} />

      {/* ------------------------------------------------- đổi trạng thái -- */}
      <StatusModal
        unit={statusModal}
        current={statusModal ? statusOf(statusModal) : undefined}
        onClose={() => setStatusModal(null)}
        onConfirm={(unit, next) => {
          setOverrides((p) => ({ ...p, [unit.unitCode]: next }));
          setStatusModal(null);
          toast.push({
            tone: "success",
            title: "Đã đổi trạng thái cá thể",
            body: `${unit.unitCode} → ${UNIT_STATUS[next].label}`,
          });
        }}
      />
    </>
  );
}

/* ----------------------------------------------------------- drawer ----- */

function UnitDrawer({
  unit,
  status,
  onClose,
  onChangeStatus,
  onPrintTag,
}: {
  unit: RentalUnit | null;
  status?: UnitStatus;
  onClose: () => void;
  onChangeStatus: (u: RentalUnit) => void;
  onPrintTag: (u: RentalUnit) => void;
}) {
  const session = useSession();
  const today = todayISO();
  if (!unit) return null;

  const effective = status ?? unit.status;
  const product = getProduct(unit.productSlug);
  const bookings = bookingsOfUnit(unit.unitCode);
  const upcoming = bookings.filter((b) => b.returnDate >= today);
  const history = bookings.filter((b) => b.returnDate < today).slice(-4).reverse();
  const tasks = MAINTENANCE.filter((t) => t.unitCode === unit.unitCode);
  const roi = unit.purchaseCost > 0 ? unit.revenueToDate / unit.purchaseCost : 0;

  return (
    <Drawer
      open
      onClose={onClose}
      title={<span className="num">{unit.unitCode}</span>}
      subtitle={`${unit.productName} · ${unit.size} · ${unit.color}`}
      width="max-w-[560px]"
      footer={
        session.can("unit.lifecycle") ? (
          <button type="button" onClick={() => onChangeStatus(unit)} className="btn btn-outline btn-sm btn-block">
            Đổi trạng thái cá thể
          </button>
        ) : null
      }
    >
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPrintTag(unit)}
              title="Xem và in tem QR"
              className="grid shrink-0 place-items-center rounded-md border border-line bg-white p-1 transition-colors hover:border-ink"
            >
              <QrCode value={unit.unitCode} size={62} />
            </button>
            <div>
              <UnitStatusChip status={effective} />
              <p className="mt-1.5 text-[11.5px] text-ink-2">{UNIT_STATUS[effective].description}</p>
              <button
                type="button"
                onClick={() => onPrintTag(unit)}
                className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] text-ink-2 underline underline-offset-2 hover:text-ink"
              >
                <IconPrinter width={12} height={12} />
                In tem QR
              </button>
            </div>
          </div>
          <ConditionChip grade={unit.conditionGrade} />
        </div>

        <div className="card card-pad">
          <KeyValue label="Vị trí kệ">{unit.location ?? "—"}</KeyValue>
          <KeyValue label="Số lượt đã thuê">{unit.rentalCount}</KeyValue>
          <KeyValue label="Giặt lần cuối">{unit.lastCleanedAt ? formatDateTime(unit.lastCleanedAt) : "—"}</KeyValue>
          <KeyValue label="Ngày nhập">{formatDate(unit.purchaseDate)}</KeyValue>
          <KeyValue label="Giá nhập">{formatVnd(unit.purchaseCost)}</KeyValue>
          {product && <KeyValue label="Giá trị đền bù">{formatVnd(product.replacementValue)}</KeyValue>}
        </div>

        {/* ROI */}
        <div className="card card-pad">
          <div className="flex items-baseline justify-between">
            <p className="label-xs">Hiệu quả khai thác</p>
            <span className={cn("num text-[14px] font-medium", roi >= 1 ? "text-success" : "text-warning")}>
              ROI {roi.toFixed(2)}×
            </span>
          </div>
          <Meter value={Math.min(100, roi * 50)} tone={roi >= 1 ? "success" : "warning"} />
          <div className="mt-2 flex justify-between text-[11.5px] text-ink-2">
            <span>Doanh thu {formatVnd(unit.revenueToDate)}</span>
            <span>Chi phí bảo trì {formatVnd(unit.maintenanceCost)}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-3">
            ROI = tổng doanh thu cá thể ÷ giá nhập. Dưới 1× nghĩa là chưa hoàn vốn.
          </p>
        </div>

        {unit.note && (
          <Callout tone="warning" title="Ghi chú cá thể">
            {unit.note}
          </Callout>
        )}

        {/* Lịch sắp tới */}
        <section>
          <p className="label-xs mb-2">Lịch sắp tới</p>
          {upcoming.length === 0 ? (
            <p className="text-[12px] text-ink-3">Chưa có booking nào.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.slice(0, 4).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2">
                  <span className="min-w-0">
                    <span className="num block text-[12px]">
                      {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                    </span>
                    <span className="block truncate text-[11px] text-ink-3">{b.customerName ?? "—"}</span>
                  </span>
                  {b.orderCode ? (
                    <Link href={`/orders/${b.orderCode}`} className="num shrink-0 text-[11.5px] underline-offset-2 hover:underline">
                      {b.orderCode.slice(-7)}
                    </Link>
                  ) : (
                    <StatusChip tone="neutral" dot={false}>
                      Giữ chỗ
                    </StatusChip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bảo trì */}
        <section>
          <p className="label-xs mb-2">Lịch sử giặt ủi & sửa chữa</p>
          {tasks.length === 0 ? (
            <p className="text-[12px] text-ink-3">Chưa có việc bảo trì nào được ghi nhận.</p>
          ) : (
            <ul className="space-y-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="rounded-md border border-line px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px]">{MAINTENANCE_TYPE[t.type].label}</span>
                    <StatusChip tone={MAINTENANCE_STATUS[t.status].tone}>{MAINTENANCE_STATUS[t.status].label}</StatusChip>
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-2">{t.reason}</p>
                  {t.cost > 0 && <p className="num text-[11px] text-ink-3">Chi phí {formatVnd(t.cost)}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lịch sử thuê */}
        <section>
          <p className="label-xs mb-2">Lượt thuê gần đây</p>
          {history.length === 0 ? (
            <p className="text-[12px] text-ink-3">Chưa có lượt thuê nào trong dữ liệu hiện tại.</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="num text-ink-2">
                    {formatDate(b.pickupDate)} → {formatDate(b.returnDate)}
                  </span>
                  <span className="truncate text-ink-3">{b.customerName ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------ status modal ---- */

function StatusModal({
  unit,
  current,
  onClose,
  onConfirm,
}: {
  unit: RentalUnit | null;
  current?: UnitStatus;
  onClose: () => void;
  onConfirm: (unit: RentalUnit, next: UnitStatus) => void;
}) {
  const [next, setNext] = useState<UnitStatus | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setNext(null);
    setReason("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [unit?.unitCode]);

  if (!unit || !current) return null;
  const allowed = UNIT_TRANSITIONS[current];

  return (
    <Modal
      open
      onClose={onClose}
      title="Đổi trạng thái cá thể"
      description={`${unit.unitCode} — đang ở trạng thái ${UNIT_STATUS[current].label}.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" disabled={!next} onClick={() => next && onConfirm(unit, next)} className="btn btn-sm">
            Xác nhận
          </button>
        </>
      }
    >
      {allowed.length === 0 ? (
        <Callout tone="neutral">
          Trạng thái {UNIT_STATUS[current].label} là trạng thái kết thúc, không chuyển tiếp được nữa.
        </Callout>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {allowed.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNext(s)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
                  next === s ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                )}
              >
                <span className="mt-0.5">
                  <UnitStatusChip status={s} />
                </span>
                <span className="text-[11.5px] leading-snug text-ink-2">{UNIT_STATUS[s].description}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="field-label" htmlFor="unit-reason">
              Ghi chú (sẽ lưu vào nhật ký cá thể)
            </label>
            <input
              id="unit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: QC đạt, trả về kệ A1-03"
              className="field"
            />
          </div>

          <Callout tone="info">
            Mọi lần đổi trạng thái đều ghi `unit_logs`: ai đổi, lúc nào, từ trạng thái nào sang trạng thái nào.
          </Callout>
        </div>
      )}
    </Modal>
  );
}
