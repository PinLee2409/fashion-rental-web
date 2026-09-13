"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MaintenanceStatusChip, MaintenanceTypeChip, UnitCode } from "@/components/domain/Chips";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconAlert, IconCheck, IconGrid, IconList, IconPlus, IconWrench } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { Callout, EmptyState, SegmentedControl, StatusChip, Tabs } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { MAINTENANCE, STAFF } from "@/data/operations";
import { useMounted } from "@/hooks";
import type { MaintenanceStatus, MaintenanceTask, MaintenanceType } from "@/lib/admin-types";
import { diffDays, formatDate, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { MAINTENANCE_STATUS } from "@/lib/unit-status";
import { deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

const COLUMNS: { key: MaintenanceStatus; label: string; hint: string }[] = [
  { key: "todo", label: "Chờ xử lý", hint: "Sắp theo hạn — cá thể có booking gần nhất lên trước" },
  { key: "doing", label: "Đang làm", hint: "Đã có người nhận việc" },
  { key: "quality_check", label: "Chờ QC", hint: "Kiểm tra trước khi trả về kho" },
  { key: "done", label: "Hoàn tất", hint: "Cá thể đã về trạng thái sẵn sàng" },
];

type TabKey = "all" | MaintenanceType;

export default function MaintenancePage() {
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();
  const today = todayISO();

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, MaintenanceStatus>>({});
  const [detail, setDetail] = useState<MaintenanceTask | null>(null);

  const statusOf = (t: MaintenanceTask) => statusOverrides[t.id] ?? t.status;

  const tasks = useMemo(() => {
    const q = deaccent(search.trim());
    return MAINTENANCE.filter((t) => {
      if (tab !== "all" && t.type !== tab) return false;
      if (q && !deaccent(`${t.unitCode} ${t.productName} ${t.reason}`).includes(q)) return false;
      return true;
    });
  }, [tab, search]);

  function move(task: MaintenanceTask, next: MaintenanceStatus) {
    setStatusOverrides((p) => ({ ...p, [task.id]: next }));
    toast.push({
      tone: next === "failed" ? "warning" : "success",
      title:
        next === "done"
          ? `${task.unitCode} đã xong — cá thể về kho`
          : next === "failed"
            ? `${task.unitCode} QC không đạt`
            : `${task.unitCode} → ${MAINTENANCE_STATUS[next].label}`,
      body: next === "done" ? "Trạng thái cá thể chuyển sang Sẵn sàng." : undefined,
    });
  }

  function urgency(task: MaintenanceTask) {
    if (!task.dueAt) return null;
    const left = diffDays(today, task.dueAt);
    if (left < 0) return { tone: "danger" as const, label: `Trễ hạn ${Math.abs(left)} ngày` };
    if (left <= 1) return { tone: "danger" as const, label: left === 0 ? "Cần xong hôm nay" : "Còn 1 ngày" };
    if (left <= 3) return { tone: "warning" as const, label: `Còn ${left} ngày` };
    return { tone: "neutral" as const, label: `Còn ${left} ngày` };
  }

  if (!session.can("unit.lifecycle")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconWrench width={22} height={22} />}
          title="Bạn không có quyền vào hàng đợi kho"
          body="Chức năng giặt ủi và sửa chữa dành cho nhân viên kho, quản lý và admin."
        />
      </div>
    );
  }

  const columns: Column<MaintenanceTask>[] = [
    { key: "unit", header: "Cá thể", width: "150px", sortValue: (t) => t.unitCode, render: (t) => <UnitCode code={t.unitCode} /> },
    {
      key: "product",
      header: "Sản phẩm",
      sortValue: (t) => t.productName,
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px]">{t.productName}</p>
          <p className="truncate text-[11px] text-ink-3">{t.variantLabel}</p>
        </div>
      ),
    },
    { key: "type", header: "Loại việc", width: "120px", render: (t) => <MaintenanceTypeChip type={t.type} /> },
    {
      key: "reason",
      header: "Lý do",
      hideBelow: "lg",
      render: (t) => <span className="text-[12px] text-ink-2">{t.reason}</span>,
    },
    {
      key: "assignee",
      header: "Phụ trách",
      width: "140px",
      hideBelow: "xl",
      render: (t) => (
        <span className="text-[12px] text-ink-2">{STAFF.find((s) => s.id === t.assignedTo)?.name ?? "Chưa nhận"}</span>
      ),
    },
    {
      key: "due",
      header: "Hạn",
      width: "130px",
      sortValue: (t) => t.dueAt ?? "9999",
      render: (t) => {
        const u = mounted ? urgency(t) : null;
        return u ? (
          <StatusChip tone={u.tone}>{u.label}</StatusChip>
        ) : (
          <span className="text-[12px] text-ink-3">Không gấp</span>
        );
      },
    },
    { key: "status", header: "Trạng thái", width: "128px", render: (t) => <MaintenanceStatusChip status={statusOf(t)} /> },
    {
      key: "actions",
      header: "",
      width: "96px",
      align: "right",
      render: (t) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); setDetail(t); }} className="btn btn-outline btn-sm">
          Chi tiết
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Giặt ủi & sửa chữa"
        description="Hàng đợi hậu thuê. Cá thể nào có booking kế tiếp gần nhất phải được xử lý trước, nếu không sẽ vỡ lịch khách."
        breadcrumb={[{ label: "Kho & cá thể" }, { label: "Giặt ủi & sửa chữa" }]}
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { key: "kanban", label: <IconGrid width={13} height={13} />, title: "Dạng bảng Kanban" },
                { key: "list", label: <IconList width={13} height={13} />, title: "Dạng danh sách" },
              ]}
            />
            <button
              type="button"
              onClick={() => toast.push({ tone: "info", title: "Tạo việc thủ công", body: "Chọn cá thể cần xử lý ở màn hình Kho." })}
              className="btn btn-sm gap-1.5"
            >
              <IconPlus width={14} height={14} />
              Tạo việc
            </button>
          </>
        }
      />

      <div className="mb-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "all", label: "Tất cả", count: MAINTENANCE.length },
            { key: "cleaning", label: "Giặt ủi", count: MAINTENANCE.filter((t) => t.type === "cleaning").length },
            { key: "repair", label: "Sửa chữa", count: MAINTENANCE.filter((t) => t.type === "repair").length },
            { key: "alteration", label: "Sửa vừa người", count: MAINTENANCE.filter((t) => t.type === "alteration").length },
          ]}
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm mã cá thể hoặc sản phẩm..."
        resultLabel={`${tasks.length} việc`}
      />

      {tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCheck width={22} height={22} />}
            title="Hàng đợi trống"
            body="Không còn cá thể nào chờ giặt ủi hay sửa chữa trong bộ lọc hiện tại."
          />
        </div>
      ) : view === "kanban" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = tasks
              .filter((t) => statusOf(t) === col.key || (col.key === "todo" && statusOf(t) === "failed"))
              .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));

            return (
              <section key={col.key} className="card flex flex-col overflow-hidden">
                <header className="border-b border-line px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[13px] font-medium">{col.label}</h2>
                    <span className="num text-[12px] text-ink-3">{items.length}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{col.hint}</p>
                </header>

                <ul className="flex-1 space-y-2 p-2">
                  {items.length === 0 && (
                    <li className="px-2 py-6 text-center text-[11.5px] text-ink-3">Không có việc nào</li>
                  )}
                  {items.map((t) => {
                    const u = mounted ? urgency(t) : null;
                    const current = statusOf(t);
                    const nextStatus: MaintenanceStatus | null =
                      current === "todo" || current === "failed"
                        ? "doing"
                        : current === "doing"
                          ? "quality_check"
                          : current === "quality_check"
                            ? "done"
                            : null;

                    return (
                      <li key={t.id} className="rounded-md border border-line bg-surface p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <UnitCode code={t.unitCode} />
                          <MaintenanceTypeChip type={t.type} />
                        </div>
                        <p className="mt-1.5 truncate text-[12.5px]">{t.productName}</p>
                        <p className="truncate text-[11px] text-ink-3">{t.variantLabel}</p>
                        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">{t.reason}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {current === "failed" && <StatusChip tone="danger">QC không đạt</StatusChip>}
                          {u && <StatusChip tone={u.tone}>{u.label}</StatusChip>}
                          {t.cost > 0 && (
                            <span className="num text-[11px] text-ink-3">{formatVnd(t.cost)}</span>
                          )}
                        </div>

                        {t.nextBookingDate && (
                          <p className="mt-1.5 text-[11px] text-ink-3">
                            Booking kế tiếp {formatDate(t.nextBookingDate)}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2">
                          <span className="truncate text-[11px] text-ink-3">
                            {STAFF.find((s) => s.id === t.assignedTo)?.name ?? "Chưa nhận việc"}
                          </span>
                          <div className="flex gap-1.5">
                            {current === "quality_check" && (
                              <button
                                type="button"
                                onClick={() => move(t, "failed")}
                                className="btn btn-danger btn-sm"
                                title="QC không đạt, trả lại hàng đợi"
                              >
                                Không đạt
                              </button>
                            )}
                            {nextStatus && (
                              <button type="button" onClick={() => move(t, nextStatus)} className="btn btn-outline btn-sm">
                                {nextStatus === "doing" ? "Nhận việc" : nextStatus === "quality_check" ? "Gửi QC" : "QC đạt"}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={tasks}
          getKey={(t) => t.id}
          density="comfortable"
          onRowClick={(t) => setDetail(t)}
          initialSort={{ key: "due", dir: "asc" }}
          cardRender={(t) => (
            <div>
              <div className="flex items-start justify-between gap-2">
                <UnitCode code={t.unitCode} />
                <MaintenanceStatusChip status={statusOf(t)} />
              </div>
              <p className="mt-1.5 truncate text-[12.5px]">{t.productName}</p>
              <p className="text-[11.5px] text-ink-3">{t.reason}</p>
            </div>
          )}
        />
      )}

      {/* ---------------------------------------------------- chi tiết -- */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Việc kho · ${detail.unitCode}` : ""}
        description={detail ? `${detail.productName} · ${detail.variantLabel}` : undefined}
        footer={
          detail ? (
            <>
              <Link href={`/inventory?unit=${detail.unitCode}`} className="btn btn-outline btn-sm">
                Mở hồ sơ cá thể
              </Link>
              <button type="button" onClick={() => setDetail(null)} className="btn btn-sm">
                Đóng
              </button>
            </>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <MaintenanceTypeChip type={detail.type} />
              <MaintenanceStatusChip status={statusOf(detail)} />
              {detail.dueAt && mounted && <StatusChip tone={urgency(detail)!.tone}>{urgency(detail)!.label}</StatusChip>}
            </div>

            <div className="card card-pad space-y-1.5 text-[12.5px]">
              <p>
                <span className="text-ink-2">Lý do: </span>
                {detail.reason}
              </p>
              <p>
                <span className="text-ink-2">Phụ trách: </span>
                {STAFF.find((s) => s.id === detail.assignedTo)?.name ?? "Chưa nhận việc"}
              </p>
              <p>
                <span className="text-ink-2">Bắt đầu: </span>
                {detail.startedAt ? formatDateTime(detail.startedAt) : "—"}
              </p>
              {detail.cost > 0 && (
                <p>
                  <span className="text-ink-2">Chi phí: </span>
                  <span className="num">{formatVnd(detail.cost)}</span>
                </p>
              )}
              {detail.nextBookingDate && (
                <p>
                  <span className="text-ink-2">Booking kế tiếp: </span>
                  {formatDate(detail.nextBookingDate)}
                </p>
              )}
            </div>

            {detail.note && <Callout tone="warning" icon={<IconAlert width={14} height={14} />}>{detail.note}</Callout>}

            <Callout tone="info">
              Khi việc hoàn tất và QC đạt, cá thể tự chuyển sang trạng thái Sẵn sàng và mở lại lịch cho đơn mới.
            </Callout>
          </div>
        )}
      </Modal>
    </>
  );
}
