"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UnitCode } from "@/components/domain/Chips";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconAlert, IconChart, IconDownload } from "@/components/ui/Icons";
import { PageHeader, Section, StatCard } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, Meter, SegmentedControl, StatusChip, Tabs } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { UNITS } from "@/data/operations";
import { useMounted } from "@/hooks";
import { addDays, formatDate, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { idleStock, revenueBetween, revenueSeries, topProducts, utilization, type UtilizationRow } from "@/lib/ops";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

type Tab = "revenue" | "utilization" | "idle";
type Period = "7" | "30" | "90";

export default function ReportsPage() {
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();
  const today = todayISO();

  const [tab, setTab] = useState<Tab>("revenue");
  const [period, setPeriod] = useState<Period>("30");

  const days = Number(period);
  const from = addDays(today, -days);
  const revenue = useMemo(() => revenueBetween(from, today), [from, today]);
  const series = useMemo(() => revenueSeries(days), [days]);
  const util = useMemo(() => utilization(90), []);
  const idle = useMemo(() => idleStock(10), []);

  if (!session.can("report.view")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconChart width={22} height={22} />}
          title="Bạn không có quyền xem báo cáo"
          body="Báo cáo doanh thu và tỷ lệ khai thác dành cho Quản lý và Admin."
        />
      </div>
    );
  }

  const totalFees = revenue.lateFees + revenue.damageFees + revenue.cleaningFees;

  const utilColumns: Column<UtilizationRow>[] = [
    { key: "unit", header: "Cá thể", width: "150px", sortValue: (r) => r.unitCode, render: (r) => <UnitCode code={r.unitCode} /> },
    {
      key: "product",
      header: "Sản phẩm",
      sortValue: (r) => r.productName,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px]">{r.productName}</p>
          <p className="truncate text-[11px] text-ink-3">{r.variantLabel}</p>
        </div>
      ),
    },
    {
      key: "rentals",
      header: "Lượt thuê",
      align: "right",
      width: "96px",
      sortValue: (r) => r.rentalCount,
      render: (r) => <span className="num text-[12.5px]">{r.rentalCount}</span>,
    },
    {
      key: "daysRented",
      header: "Ngày cho thuê",
      align: "right",
      width: "120px",
      hideBelow: "lg",
      sortValue: (r) => r.daysRented,
      render: (r) => <span className="num text-[12.5px]">{r.daysRented}</span>,
    },
    {
      key: "utilization",
      header: "Tỷ lệ khai thác",
      width: "160px",
      sortValue: (r) => r.utilization,
      render: (r) => (
        <div>
          <div className="flex items-baseline justify-between text-[11.5px]">
            <span className="num">{r.utilization}%</span>
            <span className="text-ink-3">{r.idleDays} ngày rảnh</span>
          </div>
          <Meter value={r.utilization} tone={r.utilization > 30 ? "success" : r.utilization > 12 ? "warning" : "danger"} />
        </div>
      ),
    },
    {
      key: "revenue",
      header: "Doanh thu luỹ kế",
      align: "right",
      width: "140px",
      sortValue: (r) => r.revenue,
      render: (r) => <span className="num text-[12.5px]">{formatVnd(r.revenue)}</span>,
    },
    {
      key: "roi",
      header: "ROI",
      align: "right",
      width: "90px",
      sortValue: (r) => r.roi,
      render: (r) => (
        <span className={cn("num text-[12.5px]", r.roi >= 1 ? "text-success" : "text-warning")}>{r.roi.toFixed(2)}×</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Số liệu vận hành của hệ thống cho thuê. Tiền cọc không được tính là doanh thu — chỉ phần cọc bị trừ do phí phát sinh mới ghi nhận."
        breadcrumb={[{ label: "Phân tích" }, { label: "Báo cáo" }]}
        actions={
          <>
            <SegmentedControl
              value={period}
              onChange={setPeriod}
              options={[
                { key: "7", label: "7 ngày" },
                { key: "30", label: "30 ngày" },
                { key: "90", label: "90 ngày" },
              ]}
            />
            <button
              type="button"
              onClick={() => toast.push({ tone: "info", title: "Đang xuất báo cáo", body: `Kỳ ${days} ngày` })}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <IconDownload width={14} height={14} />
              Xuất
            </button>
          </>
        }
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "revenue", label: "Doanh thu" },
            { key: "utilization", label: "Tỷ lệ khai thác" },
            { key: "idle", label: "Tồn ế" },
          ]}
        />
      </div>

      {/* ------------------------------------------------------ doanh thu -- */}
      {tab === "revenue" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label="Doanh thu thuê" value={formatVnd(revenue.rentalRevenue)} sub={`${revenue.orders} đơn trong kỳ`} />
            <StatCard label="Phí phát sinh" value={formatVnd(totalFees)} tone={totalFees > 0 ? "warning" : "neutral"} sub="Trễ hạn · giặt đặc biệt · hư hỏng" />
            <StatCard label="Giảm giá đã dùng" value={formatVnd(revenue.discounts)} sub="Chỉ áp lên tiền thuê" />
            <StatCard label="Đã hoàn cọc" value={formatVnd(revenue.refunds)} sub="Không phải chi phí, chỉ là trả lại khách" />
          </div>

          <Callout tone="info" icon={<IconAlert width={14} height={14} />} title="Cọc không phải doanh thu">
            Trong kỳ này shop đã thu {formatVnd(revenue.depositCollected)} tiền cọc. Khoản này hạch toán vào &ldquo;phải trả
            người thuê&rdquo; và sẽ hoàn lại khi khách trả đồ nguyên vẹn.
          </Callout>

          <Section title={`Doanh thu thuê ${days} ngày`} description="Tính theo ngày tạo đơn, đã trừ giảm giá.">
            <div className="card card-pad">
              {mounted ? (
                <>
                  <div className="flex items-end gap-[3px]" style={{ height: 140 }}>
                    {series.map((d) => {
                      const max = Math.max(...series.map((s) => s.value), 1);
                      return (
                        <div key={d.date} className="group relative flex-1">
                          <div
                            className={cn("w-full rounded-sm transition-colors", d.value > 0 ? "bg-ink/80 group-hover:bg-ink" : "bg-line-2")}
                            style={{ height: `${Math.max(3, (d.value / max) * 140)}px` }}
                          />
                          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface px-2 py-1 text-[11px] shadow-sm group-hover:block">
                            {formatDate(d.date)} · {formatVnd(d.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-ink-3">
                    <span>{formatDate(series[0].date)}</span>
                    <span>{formatDate(series[series.length - 1].date)}</span>
                  </div>
                </>
              ) : (
                <div className="skeleton h-[160px] w-full" />
              )}
            </div>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Cấu phần doanh thu" description="Tách rõ tiền thuê và các khoản phí phát sinh.">
              <div className="card card-pad">
                <KeyValue label="Tiền thuê (đã trừ giảm giá)">{formatVnd(revenue.rentalRevenue)}</KeyValue>
                <KeyValue label="Phí trễ hạn">{formatVnd(revenue.lateFees)}</KeyValue>
                <KeyValue label="Phí giặt đặc biệt">{formatVnd(revenue.cleaningFees)}</KeyValue>
                <KeyValue label="Phí hư hỏng / mất">{formatVnd(revenue.damageFees)}</KeyValue>
                <div className="mt-1 border-t border-line pt-1.5">
                  <KeyValue label="Tổng ghi nhận doanh thu">
                    <span className="text-[14px] font-medium">{formatVnd(revenue.rentalRevenue + totalFees)}</span>
                  </KeyValue>
                </div>
                <div className="mt-3 border-t border-line pt-2.5">
                  <KeyValue label="Cọc đã thu (không tính doanh thu)">
                    <span className="text-ink-2">{formatVnd(revenue.depositCollected)}</span>
                  </KeyValue>
                </div>
              </div>
            </Section>

            <Section title="Sản phẩm mang lại doanh thu cao nhất">
              <div className="card overflow-hidden">
                <ul className="divide-y divide-line">
                  {topProducts(6).map((p, i) => (
                    <li key={p.slug} className="flex items-center gap-3 px-3.5 py-2.5">
                      <span className="num w-4 shrink-0 text-[12px] text-ink-3">{i + 1}</span>
                      <Link href={`/products/${p.slug}`} className="min-w-0 flex-1 truncate text-[12.5px] underline-offset-2 hover:underline">
                        {p.name}
                      </Link>
                      <span className="num shrink-0 text-[11.5px] text-ink-3">{p.rentals} lượt</span>
                      <span className="num w-[110px] shrink-0 text-right text-[12.5px]">{formatVnd(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- khai thác ---- */}
      {tab === "utilization" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label="Tổng cá thể" value={UNITS.length} sub="Đang quản lý trong kho" />
            <StatCard
              label="Khai thác trung bình"
              value={`${Math.round(util.reduce((s, r) => s + r.utilization, 0) / Math.max(1, util.length))}%`}
              sub="Số ngày cho thuê / 90 ngày"
            />
            <StatCard
              label="Cá thể trên 30%"
              value={util.filter((r) => r.utilization > 30).length}
              tone="success"
              sub="Nhóm đang chạy tốt"
            />
            <StatCard
              label="Cá thể dưới 12%"
              value={util.filter((r) => r.utilization < 12).length}
              tone="warning"
              sub="Cân nhắc giảm giá hoặc thanh lý"
            />
          </div>

          <DataTable
            columns={utilColumns}
            rows={util.slice(0, 40)}
            getKey={(r) => r.unitCode}
            density="compact"
            initialSort={{ key: "utilization", dir: "desc" }}
            maxHeight="calc(100vh - 420px)"
          />
          <p className="text-[11.5px] text-ink-3">
            Tỷ lệ khai thác = số ngày cá thể được thuê ÷ 90 ngày gần nhất. ROI = doanh thu luỹ kế ÷ giá nhập cá thể.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------- tồn ế --- */}
      {tab === "idle" && (
        <div className="space-y-4">
          <Callout tone="warning" icon={<IconAlert width={14} height={14} />} title="Tồn ế đang giữ vốn">
            {idle.length} cá thể gần như không được thuê trong 90 ngày qua. Cân nhắc đưa vào combo khuyến mãi, chụp lại
            ảnh, hoặc thanh lý để thu hồi vốn.
          </Callout>

          <div className="card overflow-hidden">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cá thể</th>
                  <th>Sản phẩm</th>
                  <th className="text-right">Ngày rảnh</th>
                  <th className="text-right">Khai thác</th>
                  <th className="text-right">Doanh thu</th>
                  <th className="text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {idle.map((r) => (
                  <tr key={r.unitCode}>
                    <td>
                      <UnitCode code={r.unitCode} />
                    </td>
                    <td>
                      <p className="text-[12.5px]">{r.productName}</p>
                      <p className="text-[11px] text-ink-3">{r.variantLabel}</p>
                    </td>
                    <td className="num text-right text-[12.5px] text-warning">{r.idleDays}</td>
                    <td className="num text-right text-[12.5px]">{r.utilization}%</td>
                    <td className="num text-right text-[12.5px]">{formatVnd(r.revenue)}</td>
                    <td className="text-right">
                      <StatusChip tone={r.roi >= 1 ? "success" : "danger"} dot={false}>
                        {r.roi.toFixed(2)}×
                      </StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
