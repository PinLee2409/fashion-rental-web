"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/unit-status";
import { IconAlert, IconCheck, IconClose, IconInfo } from "./Icons";

interface Toast {
  id: number;
  tone: Extract<Tone, "success" | "danger" | "info" | "warning">;
  title: string;
  body?: string;
  undo?: () => void;
}

const ToastContext = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải nằm trong <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        Toast neo ở góc trên bên phải, ngay dưới header (--header-h) để không
        che nút thông báo và menu người dùng. Trên mobile thì bám hai mép.
      */}
      <div className="pointer-events-none fixed inset-x-3 top-[calc(var(--header-h)+12px)] z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDone={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, toast.undo ? 6000 : 3800);
    return () => clearTimeout(id);
  }, [onDone, toast.undo]);

  const icon = {
    success: <IconCheck width={15} height={15} />,
    danger: <IconAlert width={15} height={15} />,
    warning: <IconAlert width={15} height={15} />,
    info: <IconInfo width={15} height={15} />,
  }[toast.tone];

  const color = {
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
  }[toast.tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className="a-toast pointer-events-auto flex w-full items-start gap-2.5 rounded-md border border-line bg-surface px-3.5 py-3 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.34)] sm:w-[336px]"
    >
      <span className={cn("mt-px shrink-0", color)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-snug">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{toast.body}</p>}
        {toast.undo && (
          <button
            type="button"
            onClick={() => {
              toast.undo?.();
              onDone();
            }}
            className="mt-1.5 text-[12px] font-medium underline underline-offset-2"
          >
            Hoàn tác
          </button>
        )}
      </div>
      <button type="button" onClick={onDone} aria-label="Đóng" className="-mr-1 -mt-1 p-1 text-ink-3 hover:text-ink">
        <IconClose width={13} height={13} />
      </button>
    </div>
  );
}
