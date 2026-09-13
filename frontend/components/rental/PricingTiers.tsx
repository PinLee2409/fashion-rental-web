"use client";

import { Chip } from "@/components/ui/Primitives";
import { formatVnd } from "@/lib/money";
import { describeTiers } from "@/lib/pricing";
import type { Variant } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Bảng gói thuê của một biến thể (BR-11).
 * Gói nào đang được áp dụng cho khoảng ngày khách chọn sẽ được làm nổi.
 */
export function PricingTiers({
  variant,
  activeDays,
  onPick,
}: {
  variant: Variant;
  /** Số ngày khách đang chọn — để làm nổi gói tương ứng */
  activeDays?: number;
  onPick?: (days: number) => void;
}) {
  const rows = describeTiers(variant);

  return (
    <div className="grid grid-cols-3 gap-2">
      {rows.map((row) => {
        const active = activeDays !== undefined && activeDays === row.days;
        const Tag = onPick ? "button" : "div";
        return (
          <Tag
            key={row.days}
            {...(onPick ? { type: "button" as const, onClick: () => onPick(row.days) } : {})}
            className={cn(
              "relative border px-3 py-3 text-left transition-all duration-200 ease-luxe",
              active ? "border-ink bg-ink text-canvas" : "border-line bg-surface",
              onPick && !active && "hover:border-ink",
            )}
          >
            <p className={cn("text-[11px] uppercase tracking-[0.12em]", active ? "text-canvas/70" : "text-ink-3")}>
              {row.label}
            </p>
            <p className="mt-1.5 text-[14px] tabular-nums">{formatVnd(row.price)}</p>
            <p className={cn("mt-0.5 text-[11px] tabular-nums", active ? "text-canvas/70" : "text-ink-2")}>
              {formatVnd(row.perDay)}/ngày
            </p>
            {row.bestValue && !active && (
              <Chip tone="accent" className="absolute -top-2 right-2 px-1.5 py-0.5 text-[9px]">
                Tiết kiệm nhất
              </Chip>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
