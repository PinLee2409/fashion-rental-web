"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/lib/unit-status";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconMore } from "./Icons";

/* ------------------------------------------------------------------ chips -- */

const TONE_BG: Record<Tone, string> = {
  neutral: "bg-line-2 text-ink-2",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-ink-2",
  info: "text-info",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** Badge trạng thái — có chấm màu để không phụ thuộc hoàn toàn vào màu nền. */
export function StatusChip({
  tone = "neutral",
  children,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("chip", dot && "chip-dot", TONE_BG[tone], className)}>{children}</span>
  );
}

export function ToneText({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={TONE_TEXT[tone]}>{children}</span>;
}

export function Dot({ tone }: { tone: Tone }) {
  const bg: Record<Tone, string> = {
    neutral: "bg-ink-3",
    info: "bg-info",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", bg[tone])} />;
}

/* -------------------------------------------------------------- skeletons -- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-28" : c === cols - 1 ? "w-16" : "w-full max-w-[160px]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ empty state -- */

export function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "py-10" : "py-20",
      )}
    >
      {icon && <div className="mb-3 text-ink-3">{icon}</div>}
      <p className="text-[14px] font-medium">{title}</p>
      <p className="mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------- callouts -- */

export function Callout({
  tone = "info",
  icon,
  title,
  children,
  action,
}: {
  tone?: Tone;
  icon?: ReactNode;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md px-3.5 py-3 text-[12.5px]", TONE_BG[tone])}>
      {icon && <span className="mt-px shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-medium">{title}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- key/value -- */

export function KeyValue({
  label,
  children,
  align = "between",
}: {
  label: string;
  children: ReactNode;
  align?: "between" | "stack";
}) {
  if (align === "stack") {
    return (
      <div>
        <p className="text-[11.5px] text-ink-3">{label}</p>
        <div className="mt-0.5 text-[13px]">{children}</div>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <span className="num text-right text-[13px]">{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------ disclosure -- */

export function Accordion({
  title,
  children,
  defaultOpen = false,
  meta,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  meta?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    if (ref.current) setH(open ? ref.current.scrollHeight : 0);
  }, [open, children]);

  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
      >
        <span className="text-[13.5px] font-medium">{title}</span>
        <span className="flex items-center gap-3">
          {meta}
          <IconChevronDown
            width={15}
            height={15}
            className={cn("text-ink-3 transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>
      <div style={{ height: h }} className="overflow-hidden transition-[height] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div ref={ref} className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- menu (more) -- */

export function MoreMenu({
  items,
  label = "Thao tác khác",
  align = "right",
}: {
  items: { label: string; onSelect?: () => void; danger?: boolean; disabled?: boolean; hint?: string }[];
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const enabled = items.filter((i) => !i.disabled);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        disabled={enabled.length === 0}
        className="btn btn-outline btn-sm btn-icon"
      >
        <IconMore width={15} height={15} />
      </button>
      {open && (
        <div
          className={cn(
            "a-pop absolute z-30 mt-1 min-w-[208px] rounded-md border border-line bg-surface py-1 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.22)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect?.();
              }}
              className={cn(
                "flex w-full flex-col items-start px-3 py-1.5 text-left text-[13px] transition-colors",
                item.danger ? "text-danger hover:bg-danger-soft" : "hover:bg-line-2",
                item.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
              )}
            >
              {item.label}
              {item.hint && <span className="mt-0.5 text-[11px] text-ink-3">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- tabs --- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-0.5 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "relative shrink-0 px-3 py-2 text-[13px] transition-colors",
              active ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("num ml-1.5 text-[11.5px]", active ? "text-ink-2" : "text-ink-3")}>{t.count}</span>
            )}
            <span
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 origin-left bg-ink transition-transform duration-200",
                active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- toggle --- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { key: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (key: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-md border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.title}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-[3px] px-2.5 transition-colors",
            size === "sm" ? "h-[24px] text-[12px]" : "h-[28px] text-[12.5px]",
            value === o.key ? "bg-ink text-white" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-ink" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          checked ? "translate-x-[16px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

/* ---------------------------------------------------------------- meter --- */

export function Meter({ value, tone = "info" }: { value: number; tone?: Tone }) {
  const bg: Record<Tone, string> = {
    neutral: "bg-ink-3",
    info: "bg-info",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line-2">
      <span
        className={cn("block h-full rounded-full transition-[width] duration-500", bg[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}
