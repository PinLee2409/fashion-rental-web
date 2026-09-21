"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconDownload, IconShield } from "@/components/ui/Icons";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { EmptyState, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { AUDIT_LOGS, auditActor, STAFF } from "@/data/operations";
import { addDays, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import type { AuditAction, AuditLog } from "@/lib/admin-types";
import { ROLE_SHORT, type AdminRole } from "@/lib/permissions";
import { cn, deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

/**
 * Nhãn tiếng Việt + mức độ nhạy cảm của từng hành động. Thao tác đụng tới tiền
 * (duyệt hoàn cọc, miễn phí) tô cảnh báo để rà soát cuối ngày nhìn là thấy.
 */
const ACTION_META: Record<AuditAction, { label: string; tone: "danger" | "warning" | "info" | "success" | "neutral" }> = {
  "order.create": { label: "Tạo đơn", tone: "success" },
  "order.cancel": { label: "Huỷ đơn", tone: "warning" },
  "order.expire": { label: "Tự huỷ (hết hạn)", tone: "neutral" },
  "order.return_inspect": { label: "Lập biên bản trả", tone: "info" },
  "refund.approve": { label: "Duyệt hoàn cọc", tone: "danger" },
  "fee.waive": { label: "Miễn / giảm phí", tone: "danger" },
  "unit.assign": { label: "Gán cá thể", tone: "info" },
  "unit.lifecycle": { label: "Đổi vòng đời cá thể", tone: "info" },
  "catalog.manage": { label: "Sửa catalog", tone: "neutral" },
  "promotion.manage": { label: "Sửa khuyến mãi", tone: "neutral" },
  "user.manage": { label: "Quản lý người dùng", tone: "warning" },
  "role.manage": { label: "Đổi phân quyền", tone: "danger" },
  "settings.update": { label: "Đổi cấu hình", tone: "warning" },
};

const TARGET_LABEL: Record<AuditLog["targetType"], string> = {
  order: "Đơn thuê",
  unit: "Cá thể",
  product: "Sản phẩm",
  promotion: "Khuyến mãi",
  user: "Người dùng",
  role: "Vai trò",
  setting: "Cấu hình",
};

const QUICK = [
  { key: "all", label: "Tất cả" },
  { key: "money", label: "Đụng tới tiền" },
  { key: "system", label: "Cấu hình & phân quyền" },
  { key: "orders", label: "Đơn thuê" },
  { key: "warehouse", label: "Kho" },
];

const RANGES = [
  { key: "1", label: "Hôm nay" },
  { key: "7", label: "7 ngày" },
  { key: "30", label: "30 ngày" },
  { key: "all", label: "Tất cả" },
];

const MONEY_ACTIONS: AuditAction[] = ["refund.approve", "fee.waive", "order.cancel"];
const SYSTEM_ACTIONS: AuditAction[] = ["settings.update", "role.manage", "user.manage"];
const ORDER_ACTIONS: AuditAction[] = ["order.create", "order.cancel", "order.expire", "order.return_inspect"];
const WAREHOUSE_ACTIONS: AuditAction[] = ["unit.assign", "unit.lifecycle"];

export default function AuditPage() {
  const session = useSession();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState("all");
  const [actor, setActor] = useState<string>("all");
  const [range, setRange] = useState("7");

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    // So sánh theo chuỗi ngày (YYYY-MM-DD) thay vì mốc thời gian: giá trị giống
    // nhau giữa server và client nên không lệch hydration.
    const from = range === "all" ? null : addDays(todayISO(), -(Number(range) - 1));

    return AUDIT_LOGS.filter((log) => {
      if (from !== null && log.at.slice(0, 10) < from) return false;
      if (actor !== "all" && log.actorId !== actor) return false;

      switch (quick) {
        case "money":
          if (!MONEY_ACTIONS.includes(log.action)) return false;
          break;
        case "system":
          if (!SYSTEM_ACTIONS.includes(log.action)) return false;
          break;
        case "orders":
          if (!ORDER_ACTIONS.includes(log.action)) return false;
          break;
        case "warehouse":
          if (!WAREHOUSE_ACTIONS.includes(log.action)) return false;
          break;
        default:
          break;
      }

      if (q) {
        const who = auditActor(log.actorId);
        const hay = deaccent(
          `${who.name} ${log.targetLabel} ${log.summary} ${ACTION_META[log.action].label} ${TARGET_LABEL[log.targetType]}`,
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  }, [search, quick, actor, range]);

  // Nhật ký cho biết ai đã đụng vào tiền và phân quyền — chỉ Admin được xem.
  if (!session.can("role.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconShield width={22} height={22} />}
          title="Chỉ Admin xem được nhật ký"
          body="Nhật ký ghi lại thao tác của mọi nhân viên, kể cả duyệt tiền, nên chỉ Admin hệ thống mới truy cập được."
        />
      </div>
    );
  }

  const columns: Column<AuditLog>[] = [
    {
      key: "at",
      header: "Thời điểm",
      width: "132px",
      sortValue: (l) => l.at,
      render: (l) => <span className="num whitespace-nowrap text-[12.5px]">{formatDateTime(l.at)}</span>,
    },
    {
      key: "actor",
      header: "Người thực hiện",
      width: "168px",
      sortValue: (l) => auditActor(l.actorId).name,
      render: (l) => {
        const who = auditActor(l.actorId);
        return (
          <div className="min-w-0">
            <p className="truncate text-[13px]">{who.name}</p>
            <p data-row-detail className="truncate text-[11px] text-ink-3">
              {l.actorId === "system" ? "Tác vụ nền" : ROLE_SHORT[who.role as AdminRole]}
            </p>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Hành động",
      width: "176px",
      sortValue: (l) => ACTION_META[l.action].label,
      render: (l) => <StatusChip tone={ACTION_META[l.action].tone}>{ACTION_META[l.action].label}</StatusChip>,
    },
    {
      key: "target",
      header: "Bản ghi",
      width: "184px",
      hideBelow: "3xl",
      sortValue: (l) => l.targetLabel,
      render: (l) => (
        <div className="min-w-0">
          {l.href ? (
            <Link href={l.href} className="num block truncate text-[12.5px] underline-offset-2 hover:underline">
              {l.targetLabel}
            </Link>
          ) : (
            <span className="num block truncate text-[12.5px]">{l.targetLabel}</span>
          )}
          <p data-row-detail className="text-[11px] text-ink-3">
            {TARGET_LABEL[l.targetType]}
          </p>
        </div>
      ),
    },
    {
      key: "summary",
      header: "Nội dung",
      // Chuỗi dài nhất bảng — phải chốt bề rộng, nếu để auto thì min-content của nó
      // kéo cả bảng rộng hơn vùng chứa dù đã truncate.
      width: "260px",
      hideBelow: "6xl",
      render: (l) => <span className="block truncate text-[12.5px] text-ink-2">{l.summary}</span>,
    },
    {
      key: "amount",
      header: "Số tiền",
      align: "right",
      width: "116px",
      hideBelow: "4xl",
      sortValue: (l) => l.amount ?? 0,
      render: (l) =>
        l.amount ? (
          <span className={cn("num text-[12.5px]", MONEY_ACTIONS.includes(l.action) ? "text-danger" : "text-ink-2")}>
            {formatVnd(l.amount)}
          </span>
        ) : (
          <span className="text-[12.5px] text-ink-3">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Nhật ký hoạt động"
        description="Vết truy của mọi thao tác thay đổi dữ liệu. Dùng để đối chiếu khi có tranh chấp tiền cọc hoặc rà soát quyền cuối tháng."
        breadcrumb={[{ label: "Hệ thống" }, { label: "Cài đặt", href: "/settings" }, { label: "Nhật ký hoạt động" }]}
        actions={
          <button
            type="button"
            onClick={() => toast.push({ tone: "info", title: `Đang xuất ${rows.length} dòng nhật ký` })}
            className="btn btn-outline btn-sm gap-1.5"
          >
            <IconDownload width={14} height={14} />
            Xuất CSV
          </button>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm theo người, bản ghi hoặc nội dung..."
        resultLabel={`${rows.length} dòng`}
        quickFilters={QUICK}
        activeQuick={quick}
        onQuickChange={setQuick}
        right={
          <>
            <label className="sr-only" htmlFor="audit-actor">
              Người thực hiện
            </label>
            <select
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="h-[34px] rounded-md border border-line bg-surface px-2.5 text-[12.5px] outline-none transition-colors hover:border-ink-3"
            >
              <option value="all">Mọi người dùng</option>
              {STAFF.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
              <option value="system">Hệ thống</option>
            </select>

            <label className="sr-only" htmlFor="audit-range">
              Khoảng thời gian
            </label>
            <select
              id="audit-range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="h-[34px] rounded-md border border-line bg-surface px-2.5 text-[12.5px] outline-none transition-colors hover:border-ink-3"
            >
              {RANGES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(l) => l.id}
        initialSort={{ key: "at", dir: "desc" }}
        empty={
          <EmptyState
            icon={<IconShield width={22} height={22} />}
            title="Không có thao tác nào khớp"
            body="Thử nới khoảng thời gian, hoặc bỏ lọc người thực hiện."
          />
        }
        cardRender={(l) => {
          const who = auditActor(l.actorId);
          return (
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px]">{who.name}</p>
                  <p className="num mt-0.5 text-[11px] text-ink-3">{formatDateTime(l.at)}</p>
                </div>
                <StatusChip tone={ACTION_META[l.action].tone}>{ACTION_META[l.action].label}</StatusChip>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{l.summary}</p>
              <p className="num mt-1.5 text-[11.5px] text-ink-3">
                {TARGET_LABEL[l.targetType]} · {l.targetLabel}
                {l.amount ? ` · ${formatVnd(l.amount)}` : ""}
              </p>
            </div>
          );
        }}
      />
    </>
  );
}
