"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";
import { cn, routeOf } from "@/lib/utils";
import { useSession } from "@/store/session";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/** Những route tự vẽ toàn bộ màn hình, không nằm trong khung vận hành. */
const BARE_ROUTES = ["/login"];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [collapsed, setCollapsed] = usePersistentState<boolean>("stylerent.admin.sidebar", false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const bare = BARE_ROUTES.includes(routeOf(pathname));
  const blocked = session.hydrated && !session.signedIn && !bare;

  // Chưa đăng nhập thì đẩy về màn đăng nhập, giữ lại đường dẫn đang muốn vào.
  useEffect(() => {
    if (!blocked) return;
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [blocked, pathname, router]);

  if (bare) return <>{children}</>;
  if (!session.hydrated || blocked) return <BootScreen />;

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "lg:pl-[var(--sidebar-w-collapsed)]" : "lg:pl-[var(--sidebar-w)]",
        )}
      >
        <Header onOpenSidebar={() => setMobileOpen(true)} collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6">
          <div className="mx-auto w-full max-w-[1560px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Màn chờ trong lúc đọc phiên từ localStorage — tránh nháy giao diện. */
function BootScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-2.5 text-ink-3">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">S</span>
        <span className="text-[12.5px]">Đang mở phiên làm việc…</span>
      </div>
    </div>
  );
}
