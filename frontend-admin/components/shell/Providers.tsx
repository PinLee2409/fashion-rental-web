"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { SessionProvider } from "@/store/session";
import { AdminShell } from "./AdminShell";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <AdminShell>{children}</AdminShell>
      </SessionProvider>
    </ToastProvider>
  );
}
