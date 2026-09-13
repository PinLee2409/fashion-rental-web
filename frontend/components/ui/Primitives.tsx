"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRevealRef } from "@/hooks";
import { cn } from "@/lib/utils";
import { IconChevronDown, IconMinus, IconPlus, IconStar } from "./Icons";

/* ---------------------------------------------------------------- Reveal -- */

export function Reveal({
  children,
  delay = 0,
  y,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "header" | "span" | "figure";
  className?: string;
}) {
  const revealRef = useRevealRef();
  const style: Record<string, string> = { "--reveal-delay": `${delay}ms` };
  if (y !== undefined) style["--reveal-y"] = `${y}px`;
  return (
    <Tag ref={revealRef} data-reveal className={className} style={style as React.CSSProperties}>
      {children}
    </Tag>
  );
}

/** Tiêu đề lớn kiểu biên tập, chữ trượt lên từ dưới lớp mặt nạ. */
export function ClipHeading({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="clip-mask">
          <span style={{ transitionDelay: `${i * 90}ms` }}>{line}</span>
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------- Skeleton -- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/* ----------------------------------------------------------------- Stars -- */

export function Stars({ value, size = 13, showValue = false }: { value: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="inline-flex" aria-label={`${value} trên 5 sao`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar
            key={i}
            width={size}
            height={size}
            filled={i <= Math.round(value)}
            className={i <= Math.round(value) ? "text-ink" : "text-ink-3"}
          />
        ))}
      </span>
      {showValue && <span className="text-[12px] text-ink-2">{value.toFixed(1).replace(".", ",")}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ Chip -- */

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "ink";
  className?: string;
}) {
  const tones = {
    neutral: "bg-line-2 text-ink-2",
    accent: "bg-accent-soft text-accent",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    ink: "bg-ink text-canvas",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------- QuantityStepper -- */

export function QuantityStepper({
  value,
  min = 1,
  max = 9,
  onChange,
  compact = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  compact?: boolean;
}) {
  const size = compact ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="inline-flex items-center border border-line bg-surface">
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(size, "grid place-items-center transition-colors hover:bg-warm disabled:opacity-30")}
      >
        <IconMinus width={14} height={14} />
      </button>
      <span className={cn("min-w-9 text-center text-sm tabular-nums", compact && "text-[13px]")}>{value}</span>
      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(size, "grid place-items-center transition-colors hover:bg-warm disabled:opacity-30")}
      >
        <IconPlus width={14} height={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- Accordion -- */

export function Accordion({
  items,
  defaultOpen = -1,
}: {
  items: { title: string; content: ReactNode }[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <AccordionRow
          key={i}
          title={item.title}
          isOpen={open === i}
          onToggle={() => setOpen(open === i ? -1 : i)}
        >
          {item.content}
        </AccordionRow>
      ))}
    </div>
  );
}

function AccordionRow({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    setHeight(isOpen ? ref.current.scrollHeight : 0);
  }, [isOpen, children]);

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-accent"
      >
        <span className="text-[15px]">{title}</span>
        <IconChevronDown
          width={16}
          height={16}
          className={cn("shrink-0 transition-transform duration-300", isOpen && "rotate-180")}
        />
      </button>
      <div
        style={{ height }}
        className="overflow-hidden transition-[height] duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
      >
        <div ref={ref} className="pb-6 text-[14px] leading-relaxed text-ink-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ EmptyState -- */

export function EmptyState({
  title,
  body,
  action,
  onAction,
  icon,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
  onAction?: { label: string; run: () => void };
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      {icon && <div className="mb-6 text-ink-3">{icon}</div>}
      <h3 className="display-3 max-w-[16ch]">{title}</h3>
      <p className="lede mt-4 max-w-[42ch] text-[14px]">{body}</p>
      {action && (
        <Link href={action.href} className="btn btn-outline mt-8">
          {action.label}
        </Link>
      )}
      {onAction && (
        <button type="button" onClick={onAction.run} className="btn btn-outline mt-8">
          {onAction.label}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Note -- */

export function Note({
  tone = "info",
  children,
  icon,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  icon?: ReactNode;
}) {
  const tones = {
    info: "bg-warm text-ink-2",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <div className={cn("flex items-start gap-2.5 px-3.5 py-3 text-[13px] leading-relaxed", tones[tone])}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
