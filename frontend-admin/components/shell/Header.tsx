"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBell,
  IconCheck,
  IconMenu,
  IconPlus,
  IconScan,
  IconSearch,
  IconSwap,
} from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Overlay";
import { Dot, StatusChip } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/date";
import { notificationsFor } from "@/lib/ops";
import { ROLE_LABEL, ROLE_SCOPE, ROLE_SHORT, type AdminRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { CommandPalette } from "./CommandPalette";
import { NAV } from "./nav";

const ROLES: AdminRole[] = ["staff", "warehouse", "manager", "admin"];

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);

  const notifications = notificationsFor(session.role);
  const unread = notifications.filter((n) => !n.read && !read.includes(n.id));

  // ⌘K / Ctrl+K mở tìm kiếm toàn hệ thống
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = NAV.flatMap((g) => g.items).find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[56px] items-center gap-2 border-b border-line bg-canvas/92 px-3 backdrop-blur-md sm:px-4">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Mở menu"
          className="btn btn-ghost btn-sm btn-icon lg:hidden"
        >
          <IconMenu width={17} height={17} />
        </button>

        <span className="hidden text-[13px] font-medium sm:block">{current?.label ?? "Bảng điều hành"}</span>

        {/* Tìm kiếm toàn hệ thống */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-left text-[12.5px] text-ink-3 transition-colors hover:border-ink-3 sm:ml-4 sm:max-w-[420px]"
        >
          <IconSearch width={15} height={15} className="shrink-0" />
          <span className="truncate">Tìm đơn, khách hàng, sản phẩm, mã cá thể...</span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] sm:block">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          {session.can("order.return_inspect") && (
            <Link href="/returns" className="btn btn-outline btn-sm gap-1.5" title="Quầy nhận trả">
              <IconScan width={14} height={14} />
              <span className="hidden md:inline">Nhận trả</span>
            </Link>
          )}
          {session.can("order.create") && (
            <Link href="/orders/new" className="btn btn-sm gap-1.5" title="Tạo đơn tại quầy">
              <IconPlus width={14} height={14} />
              <span className="hidden md:inline">Đơn tại quầy</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            aria-label={`Thông báo${unread.length ? ` (${unread.length} chưa đọc)` : ""}`}
            className="btn btn-ghost btn-sm btn-icon relative"
          >
            <IconBell width={16} height={16} />
            {unread.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
            )}
          </button>

          {/* Người dùng & vai trò */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:border-ink-3"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-ink text-[10.5px] font-semibold text-white">
                {initials(session.user.name)}
              </span>
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block truncate text-[12px] leading-tight">{session.user.name}</span>
                <span className="block truncate text-[10.5px] leading-tight text-ink-3">
                  {ROLE_SHORT[session.role]}
                </span>
              </span>
              <IconSwap width={13} height={13} className="shrink-0 text-ink-3" />
            </button>

            {roleOpen && (
              <>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setRoleOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="a-pop absolute right-0 z-40 mt-1 w-[292px] rounded-md border border-line bg-surface p-1 shadow-[0_12px_36px_-16px_rgba(0,0,0,0.3)]">
                  <p className="label-xs px-2.5 pb-1 pt-2">Xem hệ thống với vai trò</p>
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        session.setRole(role);
                        setRoleOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left transition-colors",
                        session.role === role ? "bg-beige" : "hover:bg-line-2",
                      )}
                    >
                      <span className="mt-0.5 w-4 shrink-0">
                        {session.role === role && <IconCheck width={14} height={14} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px]">{ROLE_LABEL[role]}</span>
                        <span className="block text-[11px] leading-snug text-ink-3">{ROLE_SCOPE[role]}</span>
                      </span>
                    </button>
                  ))}
                  <p className="border-t border-line px-2.5 py-2 text-[11px] leading-snug text-ink-3">
                    Đổi vai trò để kiểm tra UI theo quyền. Hệ thống thật lấy vai trò từ phiên đăng nhập.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Drawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Thông báo vận hành"
        subtitle={unread.length > 0 ? `${unread.length} thông báo chưa đọc` : "Đã đọc hết"}
        footer={
          unread.length > 0 ? (
            <button
              type="button"
              onClick={() => setRead(notifications.map((n) => n.id))}
              className="btn btn-outline btn-sm btn-block"
            >
              Đánh dấu đã đọc tất cả
            </button>
          ) : null
        }
      >
        <ul className="divide-y divide-line">
          {notifications.map((n) => {
            const isRead = n.read || read.includes(n.id);
            return (
              <li key={n.id}>
                <Link
                  href={n.href ?? "#"}
                  onClick={() => {
                    setRead((p) => [...p, n.id]);
                    setNotifOpen(false);
                  }}
                  className={cn("flex gap-3 px-5 py-3.5 transition-colors hover:bg-surface", !isRead && "bg-surface")}
                >
                  <span className="mt-1.5">
                    <Dot tone={isRead ? "neutral" : n.type === "overdue" ? "danger" : "info"} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{n.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink-2">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-ink-3">{formatDateTime(n.createdAt)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {notifications.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-[13px]">Chưa có thông báo</p>
            <p className="mt-1 text-[12px] text-ink-2">Nhắc hạn trả, duyệt phí và cảnh báo kho sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </Drawer>
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 2]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export function RolePill({ role }: { role: AdminRole }) {
  return <StatusChip tone="neutral">{ROLE_SHORT[role]}</StatusChip>;
}
