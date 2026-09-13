"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconAlert, IconCheck, IconInfo } from "./Icons";

type ToastTone = "success" | "info" | "error";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  action?: { label: string; href: string };
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDone={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 4200);
    return () => clearTimeout(id);
  }, [onDone]);

  const icons = {
    success: <IconCheck width={16} height={16} />,
    info: <IconInfo width={16} height={16} />,
    error: <IconAlert width={16} height={16} />,
  };
  const tones = {
    success: "text-success",
    info: "text-accent",
    error: "text-danger",
  };

  return (
    <div className="animate-fade-up pointer-events-auto flex w-full max-w-[380px] items-start gap-3 border border-line bg-surface px-4 py-3.5">
      <span className={cn("mt-0.5", tones[toast.tone])}>{icons[toast.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug">{toast.title}</p>
        {toast.body && <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{toast.body}</p>}
        {toast.action && (
          <a href={toast.action.href} className="link-line link-underline-in mt-2 inline-block text-[12px] uppercase tracking-[0.12em]">
            {toast.action.label}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onDone}
        aria-label="Đóng thông báo"
        className="-mr-1 -mt-1 p-1 text-ink-3 transition-colors hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}
