"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { NotificationsProvider } from "@/store/notifications";
import { SessionProvider } from "@/store/session";
import { AdminShell } from "./AdminShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <NotificationsProvider>
          <AdminShell>{children}</AdminShell>
        </NotificationsProvider>
      </SessionProvider>
    </ToastProvider>
  );
}
