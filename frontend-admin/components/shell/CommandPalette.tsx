"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowRight, IconBox, IconList, IconSearch, IconTag, IconUsers } from "@/components/ui/Icons";
import { CommandOverlay } from "@/components/ui/Overlay";
import { StatusChip } from "@/components/ui/Primitives";
import { CUSTOMERS, ORDERS, UNITS } from "@/data/operations";
import { PRODUCTS } from "@/data/products";
import { formatDate } from "@/lib/date";
import { ORDER_STATUS } from "@/lib/order-status";
import { UNIT_STATUS } from "@/lib/unit-status";
import { cn, deaccent } from "@/lib/utils";

interface Result {
  group: "Đơn thuê" | "Sản phẩm" | "Cá thể" | "Khách hàng" | "Điều hướng";
  id: string;
  title: string;
  meta: string;
  href: string;
  right?: React.ReactNode;
}

const QUICK_LINKS: Result[] = [
  { group: "Điều hướng", id: "nav-returns", title: "Quầy nhận trả", meta: "Quét QR, lập biên bản, quyết toán cọc", href: "/returns" },
  { group: "Điều hướng", id: "nav-calendar", title: "Lịch thuê tổng", meta: "Timeline lịch bận từng cá thể", href: "/calendar" },
  { group: "Điều hướng", id: "nav-pos", title: "Tạo đơn tại quầy", meta: "POS cho khách walk-in", href: "/orders/new" },
  { group: "Điều hướng", id: "nav-approvals", title: "Hàng đợi duyệt", meta: "Phí vượt hạn mức, hoàn cọc lớn", href: "/approvals" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setCursor(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      const id = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(id);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = deaccent(query.trim());
    if (!q) return QUICK_LINKS;

    const match = (text: string) => deaccent(text).includes(q);
    const out: Result[] = [];

    for (const o of ORDERS) {
      if (match(o.code) || match(o.receiverName) || match(o.receiverPhone)) {
        const meta = ORDER_STATUS[o.status];
        out.push({
          group: "Đơn thuê",
          id: o.code,
          title: o.code,
          meta: `${o.receiverName} · ${formatDate(o.pickupDate)} → ${formatDate(o.returnDate)}`,
          href: `/orders/${o.code}`,
          right: <StatusChip tone={toneOf(meta.tone)}>{meta.label}</StatusChip>,
        });
      }
      if (out.length >= 5) break;
    }

    for (const u of UNITS) {
      if (match(u.unitCode) || match(u.productName)) {
        out.push({
          group: "Cá thể",
          id: u.unitCode,
          title: u.unitCode,
          meta: `${u.productName} · ${u.size} · ${u.color}`,
          href: `/inventory?unit=${u.unitCode}`,
          right: <StatusChip tone={UNIT_STATUS[u.status].tone}>{UNIT_STATUS[u.status].label}</StatusChip>,
        });
      }
      if (out.filter((r) => r.group === "Cá thể").length >= 5) break;
    }

    for (const p of PRODUCTS) {
      if (match(p.name) || match(p.sku)) {
        out.push({
          group: "Sản phẩm",
          id: p.slug,
          title: p.name,
          meta: `${p.sku} · ${p.variants.length} biến thể`,
          href: `/products/${p.slug}`,
        });
      }
      if (out.filter((r) => r.group === "Sản phẩm").length >= 4) break;
    }

    for (const c of CUSTOMERS) {
      if (match(c.name) || match(c.phone) || match(c.email)) {
        out.push({
          group: "Khách hàng",
          id: c.id,
          title: c.name,
          meta: `${c.phone} · ${c.totalRentals} lượt thuê`,
          href: `/customers/${c.id}`,
        });
      }
      if (out.filter((r) => r.group === "Khách hàng").length >= 4) break;
    }

    return out;
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    results.forEach((r) => {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    });
    return [...map.entries()];
  }, [results]);

  const flat = grouped.flatMap(([, items]) => items);

  function go(result?: Result) {
    const target = result ?? flat[cursor];
    if (!target) return;
    onClose();
    router.push(target.href);
  }

  return (
    <CommandOverlay open={open} onClose={onClose}>
      <div className="flex items-center gap-2.5 border-b border-line px-4">
        <IconSearch width={16} height={16} className="shrink-0 text-ink-3" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(flat.length - 1, c + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(0, c - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go();
            }
          }}
          placeholder="Tìm đơn, khách hàng, sản phẩm, mã cá thể..."
          className="h-[46px] flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3"
          aria-label="Tìm kiếm toàn hệ thống"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10.5px] text-ink-3 sm:block">ESC</kbd>
      </div>

      <div className="max-h-[52vh] overflow-y-auto py-1.5">
        {flat.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px]">Không tìm thấy “{query}”</p>
            <p className="mt-1 text-[12px] text-ink-2">
              Thử mã đơn (CR2026…), mã cá thể (AD-M-DO-003), số điện thoại hoặc tên sản phẩm.
            </p>
          </div>
        ) : (
          grouped.map(([group, items]) => (
            <div key={group} className="mb-1 last:mb-0">
              <p className="label-xs px-4 py-1.5">{group}</p>
              {items.map((r) => {
                const index = flat.indexOf(r);
                const active = index === cursor;
                const Icon =
                  r.group === "Đơn thuê"
                    ? IconList
                    : r.group === "Cá thể"
                      ? IconBox
                      : r.group === "Sản phẩm"
                        ? IconTag
                        : r.group === "Khách hàng"
                          ? IconUsers
                          : IconArrowRight;
                return (
                  <button
                    key={`${r.group}-${r.id}`}
                    type="button"
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                      active ? "bg-beige" : "hover:bg-line-2",
                    )}
                  >
                    <Icon width={15} height={15} className="shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{r.title}</span>
                      <span className="block truncate text-[11.5px] text-ink-2">{r.meta}</span>
                    </span>
                    {r.right}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2 text-[11px] text-ink-3">
        <span>↑↓ di chuyển · ↵ mở</span>
        <span>Tìm được đơn, khách, sản phẩm và mã QR cá thể</span>
      </div>
    </CommandOverlay>
  );
}

function toneOf(tone: string) {
  const map: Record<string, "neutral" | "info" | "accent" | "success" | "warning" | "danger"> = {
    neutral: "neutral",
    accent: "accent",
    success: "success",
    warning: "warning",
    danger: "danger",
  };
  return map[tone] ?? "neutral";
}
