"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconAlert, IconBell, IconBox, IconCheck, IconClock, IconShield, IconStar, IconTruck } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageParts";
import { Dot, EmptyState, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { useMounted } from "@/hooks";
import { formatDateTime } from "@/lib/date";
import { notificationsFor } from "@/lib/ops";
import type { OpsNotificationType } from "@/lib/admin-types";
import { cn } from "@/lib/utils";
import { useNotificationReads } from "@/store/notifications";
import { useSession } from "@/store/session";

/** Gom 7 loại thông báo thành 4 nhóm khớp với cách nhân viên chia việc. */
const GROUPS = [
  { key: "all", label: "Tất cả", types: null as OpsNotificationType[] | null },
  { key: "orders", label: "Đơn thuê", types: ["overdue", "payment_expiring", "return_due", "order_confirmed"] },
  { key: "warehouse", label: "Kho & sửa chữa", types: ["repair_needed"] },
  { key: "approvals", label: "Duyệt & đánh giá", types: ["refund_approval", "review_pending"] },
] as const;

const TYPE_META: Record<OpsNotificationType, { label: string; tone: "danger" | "warning" | "info" | "success" | "neutral"; icon: typeof IconBell }> = {
  overdue: { label: "Quá hạn", tone: "danger", icon: IconAlert },
  payment_expiring: { label: "Hết hạn giữ chỗ", tone: "warning", icon: IconClock },
  return_due: { label: "Đến hạn trả", tone: "info", icon: IconTruck },
  repair_needed: { label: "Kho & sửa chữa", tone: "warning", icon: IconBox },
  refund_approval: { label: "Chờ duyệt", tone: "warning", icon: IconShield },
  order_confirmed: { label: "Đơn mới", tone: "success", icon: IconCheck },
  review_pending: { label: "Đánh giá", tone: "info", icon: IconStar },
};

export default function NotificationsPage() {
  const session = useSession();
  const reads = useNotificationReads();
  const toast = useToast();
  const mounted = useMounted();

  const [group, setGroup] = useState<(typeof GROUPS)[number]["key"]>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const all = useMemo(() => notificationsFor(session.role), [session.role]);

  // Chỉ đọc trạng thái "đã đọc" sau khi mount: localStorage không có trên server.
  const isRead = (id: string, fallback: boolean) => (mounted ? reads.isRead(id, fallback) : fallback);

  const unreadCount = all.filter((n) => !isRead(n.id, n.read)).length;

  const rows = useMemo(() => {
    const types = GROUPS.find((g) => g.key === group)?.types;
    return all
      .filter((n) => (types ? (types as readonly string[]).includes(n.type) : true))
      .filter((n) => (unreadOnly ? !isRead(n.id, n.read) : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, group, unreadOnly, reads.readIds, mounted]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    GROUPS.forEach((g) => {
      out[g.key] = g.types
        ? all.filter((n) => (g.types as readonly string[]).includes(n.type)).length
        : all.length;
    });
    return out;
  }, [all]);

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Nhắc hạn trả, cảnh báo kho, yêu cầu chờ duyệt — lọc theo nhóm việc bạn phụ trách."
        breadcrumb={[{ label: "Hệ thống" }, { label: "Thông báo" }]}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                reads.markAllRead(all.map((n) => n.id));
                toast.push({ tone: "success", title: `Đã đánh dấu ${unreadCount} thông báo là đã đọc` });
              }}
              className="btn btn-outline btn-sm"
            >
              Đánh dấu đã đọc tất cả
            </button>
          ) : null
        }
      />

      {/* Bộ lọc — chip xuống hàng từ tablet, không cuộn ngang ẩn trên laptop. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(g.key)}
            aria-pressed={group === g.key}
            className={cn(
              "rounded-full border px-3 py-1 text-[12.5px] transition-colors",
              group === g.key
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
            )}
          >
            {g.label}
            <span className={cn("num ml-1.5 text-[11.5px]", group === g.key ? "text-white/70" : "text-ink-3")}>
              {counts[g.key]}
            </span>
          </button>
        ))}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#181818]"
          />
          Chỉ chưa đọc
          {mounted && unreadCount > 0 && <span className="num text-ink-3">({unreadCount})</span>}
        </label>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<IconBell width={22} height={22} />}
            title={unreadOnly ? "Đã đọc hết" : "Chưa có thông báo"}
            body={
              unreadOnly
                ? "Không còn thông báo nào chưa đọc trong nhóm này."
                : "Nhắc hạn trả, duyệt phí và cảnh báo kho sẽ xuất hiện ở đây."
            }
          />
        ) : (
          <ul className="divide-y divide-line-2">
            {rows.map((n) => {
              const meta = TYPE_META[n.type];
              const Icon = meta.icon;
              const read = isRead(n.id, n.read);

              return (
                <li key={n.id} className={cn("transition-colors", !read && "bg-surface-2")}>
                  <div className="flex items-start gap-3 px-3.5 py-3.5 @2xl:px-5">
                    <span className="mt-1 shrink-0">
                      <Dot tone={read ? "neutral" : meta.tone} />
                    </span>

                    <span
                      className={cn(
                        "mt-0.5 hidden h-7 w-7 shrink-0 place-items-center rounded-md @lg:grid",
                        meta.tone === "danger"
                          ? "bg-danger-soft text-danger"
                          : meta.tone === "warning"
                            ? "bg-warning-soft text-warning"
                            : meta.tone === "success"
                              ? "bg-success-soft text-success"
                              : "bg-info-soft text-info",
                      )}
                    >
                      <Icon width={14} height={14} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <p className={cn("text-[13.5px]", read ? "text-ink-2" : "font-medium text-ink")}>{n.title}</p>
                        <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{n.body}</p>
                      <p className="num mt-1.5 text-[11px] text-ink-3">{formatDateTime(n.createdAt)}</p>
                    </div>

                    {/* Hành động: gọn thành cột dọc khi hẹp để không đẩy vỡ dòng. */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5 @lg:flex-row @lg:items-center">
                      {n.href && (
                        <Link
                          href={n.href}
                          onClick={() => reads.markRead(n.id)}
                          className="btn btn-outline btn-sm whitespace-nowrap"
                        >
                          Mở
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => (read ? reads.markUnread(n.id) : reads.markRead(n.id))}
                        className="whitespace-nowrap text-[11.5px] text-ink-3 transition-colors hover:text-ink"
                      >
                        {read ? "Đánh dấu chưa đọc" : "Đã đọc"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
