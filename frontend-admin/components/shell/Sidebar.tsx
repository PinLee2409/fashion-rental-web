"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconBox,
  IconCalendar,
  IconChart,
  IconChevronDown,
  IconClose,
  IconGrid,
  IconList,
  IconPanel,
  IconScan,
  IconSettings,
  IconShield,
  IconSparkle,
  IconStar,
  IconTag,
  IconUsers,
  IconWrench,
} from "@/components/ui/Icons";
import { badgeCounts } from "@/lib/ops";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { NAV, type NavItem } from "./nav";

const ICONS: Record<string, (p: { width?: number; height?: number; className?: string }) => ReactNode> = {
  grid: IconGrid,
  list: IconList,
  calendar: IconCalendar,
  scan: IconScan,
  box: IconBox,
  wrench: IconWrench,
  shield: IconShield,
  tag: IconTag,
  sparkle: IconSparkle,
  star: IconStar,
  users: IconUsers,
  chart: IconChart,
  settings: IconSettings,
};

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const session = useSession();
  const badges = badgeCounts();

  const visible = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permissions || session.canAny(item.permissions)),
  })).filter((group) => group.items.length > 0);

  function isActive(item: NavItem) {
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const content = (
    <div className="flex h-full flex-col">
      {/* Thương hiệu */}
      <div className={cn("flex h-[56px] shrink-0 items-center gap-2.5 border-b border-line px-4", collapsed && "justify-center px-0")}>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-ink text-[12px] font-semibold text-white">
          S
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold leading-tight">StyleRent</span>
            <span className="block truncate text-[11px] leading-tight text-ink-3">Operations</span>
          </span>
        )}
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Đóng menu"
          className="btn btn-ghost btn-sm btn-icon ml-auto lg:hidden"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      {/* Điều hướng */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-2 py-3">
        {visible.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            {!collapsed && <p className="label-xs px-2 pb-1.5">{group.title}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? IconGrid;
                const active = isActive(item);
                const badge = item.badge ? badges[item.badge] : 0;
                const children = item.children?.filter((c) => !c.permissions || session.canAny(c.permissions)) ?? [];

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md py-1.5 text-[13px] transition-colors duration-150",
                        collapsed ? "justify-center px-0" : "px-2",
                        active ? "bg-beige text-ink" : "text-ink-2 hover:bg-line-2 hover:text-ink",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r bg-ink" />
                      )}
                      <Icon width={16} height={16} className="shrink-0" />
                      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span
                          className={cn(
                            "num rounded-full px-1.5 text-[10.5px] leading-[16px]",
                            item.badge === "approvals" || item.badge === "returns"
                              ? "bg-danger-soft text-danger"
                              : "bg-line text-ink-2",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                      {collapsed && badge > 0 && (
                        <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
                      )}
                    </Link>

                    {!collapsed && children.length > 0 && active && (
                      <ul className="mb-1 ml-[27px] mt-0.5 space-y-0.5 border-l border-line pl-2.5">
                        {children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onCloseMobile}
                              className={cn(
                                "block rounded-md px-2 py-1 text-[12.5px] transition-colors",
                                pathname === child.href ? "text-ink" : "text-ink-2 hover:text-ink",
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Thu gọn */}
      <div className="hidden shrink-0 border-t border-line p-2 lg:block">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-line-2 hover:text-ink",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
          <IconPanel width={16} height={16} className="shrink-0" />
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-surface transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
        )}
      >
        {content}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={onCloseMobile}
            className="a-fade fixed inset-0 z-40 cursor-default bg-ink/28 lg:hidden"
          />
          <aside className="a-drawer fixed inset-y-0 left-0 z-50 w-[248px] border-r border-line bg-surface lg:hidden" style={{ animationName: "ad-fade" }}>
            {content}
          </aside>
        </>
      )}
    </>
  );
}

export function SidebarChevron() {
  return <IconChevronDown width={12} height={12} />;
}
