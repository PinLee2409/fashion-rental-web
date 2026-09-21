"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChevronRight, IconClose, IconFilter, IconSearch } from "./Icons";
import { SegmentedControl } from "./Primitives";
import type { Density } from "./DataTable";

/* ------------------------------------------------------------ page header -- */

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  meta,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-[12px] text-ink-3">
          {breadcrumb.map((b, i) => (
            <span key={`${b.label}-${i}`} className="flex items-center gap-1">
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-ink">
                  {b.label}
                </Link>
              ) : (
                <span>{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && <IconChevronRight width={12} height={12} />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="h-page">{title}</h1>
          {description && <p className="mt-1 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-2">{description}</p>}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- toolbar -- */

export function Toolbar({
  search,
  onSearch,
  searchPlaceholder = "Tìm kiếm...",
  quickFilters,
  activeQuick,
  onQuickChange,
  onOpenFilters,
  activeFilterCount = 0,
  density,
  onDensityChange,
  resultLabel,
  right,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  quickFilters?: { key: string; label: string; count?: number }[];
  activeQuick?: string;
  onQuickChange?: (key: string) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
  density?: Density;
  onDensityChange?: (d: Density) => void;
  resultLabel?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[340px]">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="field pl-8"
            aria-label={searchPlaceholder}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Xoá tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink"
            >
              <IconClose width={13} height={13} />
            </button>
          )}
        </div>

        {onOpenFilters && (
          <button type="button" onClick={onOpenFilters} className="btn btn-outline btn-sm gap-1.5">
            <IconFilter width={14} height={14} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="num ml-0.5 rounded-full bg-ink px-1.5 text-[11px] text-white">{activeFilterCount}</span>
            )}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {resultLabel && <span className="hidden text-[12px] text-ink-2 sm:inline">{resultLabel}</span>}
          {density && onDensityChange && (
            <SegmentedControl
              size="sm"
              value={density}
              onChange={onDensityChange}
              options={[
                { key: "comfortable", label: "Thoáng", title: "Hàng thoáng" },
                { key: "compact", label: "Gọn", title: "Hàng gọn" },
              ]}
            />
          )}
          {right}
        </div>
      </div>

      {quickFilters && quickFilters.length > 0 && onQuickChange && (
        /* Dải lọc nhanh: trên mobile cuộn ngang (kèm vệt mờ mép phải để biết còn
           chip phía sau), từ tablet trở lên xuống hàng cho thấy hết — trước đây
           luôn cuộn ngang mà lại ẩn thanh cuộn nên không ai biết còn bộ lọc. */
        <div className="no-scrollbar scroll-hint-x flex gap-1.5 overflow-x-auto pb-0.5 @2xl:flex-wrap @2xl:overflow-visible @2xl:[animation:none] @2xl:[mask-image:none]">
          {quickFilters.map((q) => {
            const active = activeQuick === q.key;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => onQuickChange(q.key)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[12.5px] transition-colors",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink",
                )}
              >
                {q.label}
                {q.count !== undefined && (
                  <span className={cn("num ml-1.5 text-[11.5px]", active ? "text-white/70" : "text-ink-3")}>
                    {q.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- filter chips -- */

export function ActiveFilters({
  items,
  onClearAll,
}: {
  items: { label: string; onClear: () => void }[];
  onClearAll: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {items.map((f, i) => (
        <button
          key={`${f.label}-${i}`}
          type="button"
          onClick={f.onClear}
          className="inline-flex items-center gap-1.5 rounded-full bg-beige px-2.5 py-1 text-[12px] transition-colors hover:bg-line"
        >
          {f.label}
          <IconClose width={11} height={11} />
        </button>
      ))}
      <button type="button" onClick={onClearAll} className="px-2 text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink">
        Xoá tất cả
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- stat card -- */

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  href,
  icon,
  alert,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  href?: string;
  icon?: ReactNode;
  alert?: boolean;
}) {
  const valueTone = {
    neutral: "text-ink",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
    accent: "text-accent",
  }[tone];

  const inner = (
    <div className={cn("card card-pad flex h-full flex-col transition-colors", href && "hover:border-ink-3")}>
      <div className="flex items-start justify-between gap-2">
        {/* min-h giữ hai dòng chỗ trống: nhãn dài ("Doanh thu thuê 30 ngày") xuống
            hàng còn nhãn ngắn thì không, nếu không ép chiều cao thì các con số
            trong cùng một hàng lệch chân nhau. */}
        <p className="min-h-[2.4em] text-[12px] leading-snug text-ink-2">{label}</p>
        {icon && <span className={cn("shrink-0 text-ink-3", alert && "text-danger")}>{icon}</span>}
      </div>
      {/* Số tiền không được ngắt giữa chừng ("22.070.00 / 0đ") — thu nhỏ cỡ chữ
          theo bề rộng ô thay vì cho xuống dòng. */}
      <p
        className={cn(
          "num mt-1 text-[clamp(17px,1.35cqw+11px,24px)] font-medium leading-tight whitespace-nowrap",
          valueTone,
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-auto pt-2 text-[11.5px] leading-snug text-ink-3">{sub}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* -------------------------------------------------------------- section -- */

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="h-section">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-ink-2">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
