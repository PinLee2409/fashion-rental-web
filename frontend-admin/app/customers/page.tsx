"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column, type Density } from "@/components/ui/DataTable";
import { IconUsers } from "@/components/ui/Icons";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { EmptyState, StatusChip } from "@/components/ui/Primitives";
import { CUSTOMERS, ORDERS, ordersOfCustomer } from "@/data/operations";
import { useMounted } from "@/hooks";
import type { AdminCustomer } from "@/lib/admin-types";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { isActiveRental } from "@/lib/order-status";
import { deaccent } from "@/lib/utils";

export default function CustomersPage() {
  const router = useRouter();
  const mounted = useMounted();
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("all");
  const [density, setDensity] = useState<Density>("comfortable");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(id);
  }, [search, quick]);

  const activeByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of CUSTOMERS) {
      map.set(c.id, ordersOfCustomer(c.id).filter((o) => isActiveRental(o.status)).length);
    }
    return map;
  }, []);

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return CUSTOMERS.filter((c) => {
      if (q && !deaccent(`${c.name} ${c.phone} ${c.email}`).includes(q)) return false;
      if (quick === "active") return (activeByCustomer.get(c.id) ?? 0) > 0;
      if (quick === "risk") return c.lateReturns > 0 || c.damageIncidents > 0;
      if (quick === "blocked") return c.status === "blocked";
      return true;
    });
  }, [search, quick, activeByCustomer]);

  const columns: Column<AdminCustomer>[] = [
    {
      key: "name",
      header: "Khách hàng",
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span data-thumb className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-beige text-[11px] font-medium">
            {c.name.split(" ").slice(-1)[0][0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px]">{c.name}</p>
            <p data-row-detail className="num truncate text-[11px] text-ink-3">{c.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "rentals",
      header: "Lượt thuê",
      align: "right",
      width: "92px",
      sortValue: (c) => c.totalRentals,
      render: (c) => <span className="num text-[12.5px]">{c.totalRentals}</span>,
    },
    {
      key: "active",
      header: "Đang thuê",
      align: "right",
      width: "96px",
      render: (c) => {
        const n = activeByCustomer.get(c.id) ?? 0;
        return n > 0 ? <StatusChip tone="accent">{n} đơn</StatusChip> : <span className="text-[12px] text-ink-3">—</span>;
      },
    },
    {
      key: "spend",
      header: "Tổng chi tiêu",
      align: "right",
      width: "130px",
      sortValue: (c) => c.totalSpend,
      render: (c) => <span className="num text-[12.5px]">{formatVnd(c.totalSpend)}</span>,
    },
    {
      key: "late",
      header: "Trả trễ",
      align: "right",
      width: "82px",
      hideBelow: "lg",
      sortValue: (c) => c.lateReturns,
      render: (c) =>
        c.lateReturns > 0 ? (
          <span className="num text-[12.5px] text-warning">{c.lateReturns}</span>
        ) : (
          <span className="text-[12px] text-ink-3">0</span>
        ),
    },
    {
      key: "damage",
      header: "Hư hỏng",
      align: "right",
      width: "88px",
      hideBelow: "lg",
      sortValue: (c) => c.damageIncidents,
      render: (c) =>
        c.damageIncidents > 0 ? (
          <span className="num text-[12.5px] text-danger">{c.damageIncidents}</span>
        ) : (
          <span className="text-[12px] text-ink-3">0</span>
        ),
    },
    {
      key: "last",
      header: "Thuê gần nhất",
      width: "130px",
      hideBelow: "xl",
      sortValue: (c) => c.lastRentalAt ?? "",
      render: (c) => (
        <span className="num text-[12px] text-ink-2">{c.lastRentalAt ? formatDate(c.lastRentalAt.slice(0, 10)) : "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "112px",
      render: (c) =>
        c.status === "blocked" ? <StatusChip tone="danger">Bị khoá</StatusChip> : <StatusChip tone="success">Bình thường</StatusChip>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Khách hàng"
        description="Hồ sơ phục vụ vận hành: lịch sử thuê, số lần trả trễ và hư hỏng để nhân viên biết cần lưu ý gì khi bàn giao."
        breadcrumb={[{ label: "Khách hàng" }]}
        meta={
          <p className="text-[12px] text-ink-2">
            {CUSTOMERS.length} khách · {ORDERS.length} đơn trong hệ thống
          </p>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm tên, số điện thoại, email..."
        density={density}
        onDensityChange={setDensity}
        resultLabel={loading ? "Đang tải..." : `${rows.length} khách`}
        quickFilters={[
          { key: "all", label: "Tất cả", count: CUSTOMERS.length },
          { key: "active", label: "Đang thuê", count: CUSTOMERS.filter((c) => (activeByCustomer.get(c.id) ?? 0) > 0).length },
          { key: "risk", label: "Cần lưu ý", count: CUSTOMERS.filter((c) => c.lateReturns > 0 || c.damageIncidents > 0).length },
          { key: "blocked", label: "Bị khoá", count: CUSTOMERS.filter((c) => c.status === "blocked").length },
        ]}
        activeQuick={quick}
        onQuickChange={setQuick}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(c) => c.id}
        density={density}
        loading={loading}
        onRowClick={(c) => router.push(`/customers/${c.id}`)}
        initialSort={{ key: "spend", dir: "desc" }}
        empty={
          <EmptyState
            icon={<IconUsers width={22} height={22} />}
            title="Không tìm thấy khách hàng"
            body="Thử tìm bằng số điện thoại đầy đủ hoặc bỏ bớt bộ lọc."
          />
        }
        cardRender={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12.5px]">{c.name}</p>
              <p className="num text-[11.5px] text-ink-3">
                {c.phone} · {c.totalRentals} lượt
              </p>
            </div>
            {mounted && (activeByCustomer.get(c.id) ?? 0) > 0 && <StatusChip tone="accent">Đang thuê</StatusChip>}
          </div>
        )}
      />
    </>
  );
}
