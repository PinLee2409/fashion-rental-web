"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconBell,
  IconCheck,
  IconLogout,
  IconMenu,
  IconPanel,
  IconPlus,
  IconScan,
  IconSearch,
  IconSettings,
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

export function Header({
  onOpenSidebar,
  collapsed,
  onToggleSidebar,
}: {
  onOpenSidebar: () => void;
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const menuWrap = useRef<HTMLDivElement>(null);

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

  // Đóng menu người dùng khi bấm ra ngoài hoặc bấm Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuWrap.current && !menuWrap.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const current = NAV.flatMap((g) => g.items).find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[var(--header-h)] items-center gap-2 border-b border-line bg-canvas/92 px-3 backdrop-blur-md sm:px-4">
        {/* ---------------------------------------------------------- trái -- */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Mở menu"
          className="btn btn-ghost btn-sm btn-icon shrink-0 lg:hidden"
        >
          <IconMenu width={17} height={17} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          className="btn btn-ghost btn-sm btn-icon hidden shrink-0 lg:inline-flex"
        >
          <IconPanel width={16} height={16} />
        </button>

        <span className="hidden shrink-0 text-[13px] font-medium md:block">
          {current?.label ?? "Bảng điều hành"}
        </span>

        {/* ------------------------------------ giữa: tìm kiếm toàn hệ thống --
            mx-auto chia đều khoảng trống hai bên nên ô tìm kiếm nằm giữa header
            và cụm thao tác luôn bám sát mép phải. */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mx-auto flex h-[34px] min-w-0 max-w-[420px] flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-left text-[12.5px] text-ink-3 transition-colors hover:border-ink-3"
        >
          <IconSearch width={15} height={15} className="shrink-0" />
          <span className="truncate">Tìm đơn, khách hàng, sản phẩm, mã cá thể...</span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] sm:block">
            ⌘K
          </kbd>
        </button>

        {/* --------------------------------------------------------- phải -- */}
        <div className="flex shrink-0 items-center gap-1.5">
          {session.can("order.return_inspect") && (
            <Link href="/returns" className="btn btn-outline btn-sm gap-1.5" title="Quầy nhận trả">
              <IconScan width={14} height={14} />
              <span className="hidden lg:inline">Nhận trả</span>
            </Link>
          )}
          {session.can("order.create") && (
            <Link href="/orders/new" className="btn btn-sm gap-1.5" title="Tạo đơn tại quầy">
              <IconPlus width={14} height={14} />
              <span className="hidden lg:inline">Đơn tại quầy</span>
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

          <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" />

          {/* Người dùng, vai trò & đăng xuất */}
          <div ref={menuWrap} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-md border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:border-ink-3"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-ink text-[10.5px] font-semibold text-white">
                {initials(session.user.name)}
              </span>
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block max-w-[120px] truncate text-[12px] leading-tight">{session.user.name}</span>
                <span className="block truncate text-[10.5px] leading-tight text-ink-3">
                  {ROLE_SHORT[session.role]}
                </span>
              </span>
              <IconSwap width={13} height={13} className="shrink-0 text-ink-3" />
            </button>

            {menuOpen && (
              <div className="a-pop absolute right-0 z-40 mt-1 w-[292px] rounded-md border border-line bg-surface p-1 shadow-[0_12px_36px_-16px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[12px] font-semibold text-white">
                    {initials(session.user.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{session.user.name}</span>
                    <span className="block truncate text-[11px] text-ink-3">{session.user.email}</span>
                  </span>
                </div>

                <p className="label-xs border-t border-line px-2.5 pb-1 pt-2">Xem hệ thống với vai trò</p>
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      session.setRole(role);
                      setMenuOpen(false);
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

                <div className="mt-1 border-t border-line pt-1">
                  {session.can("user.manage") && (
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-[12.5px] transition-colors hover:bg-line-2"
                    >
                      <IconSettings width={14} height={14} className="text-ink-3" />
                      Cấu hình hệ thống
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      session.signOut();
                      router.replace("/login");
                    }}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[12.5px] text-danger transition-colors hover:bg-danger-soft"
                  >
                    <IconLogout width={14} height={14} />
                    Đăng xuất
                  </button>
                </div>

                <p className="border-t border-line px-2.5 py-2 text-[11px] leading-snug text-ink-3">
                  Đổi vai trò để kiểm tra UI theo quyền. Hệ thống thật lấy vai trò từ phiên đăng nhập.
                </p>
              </div>
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
