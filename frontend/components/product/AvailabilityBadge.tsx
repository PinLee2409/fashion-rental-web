import { AVAILABILITY_LABEL } from "@/lib/availability";
import type { AvailabilityLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT: Record<AvailabilityLevel, string> = {
  plenty: "bg-success",
  limited: "bg-warning",
  none: "bg-danger",
  closed: "bg-ink-3",
};

const TEXT: Record<AvailabilityLevel, string> = {
  plenty: "text-success",
  limited: "text-warning",
  none: "text-danger",
  closed: "text-ink-3",
};

export function AvailabilityDot({ level, className }: { level: AvailabilityLevel; className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", DOT[level], className)} />;
}

/**
 * `<AvailabilityBadge>` — dùng ở S02, S03 và giỏ thuê.
 * Hiển thị đúng số cá thể còn rảnh theo khoảng ngày đang chọn (BR-01).
 */
export function AvailabilityBadge({
  level,
  free,
  total,
  unit = "bộ",
  variant = "inline",
  className,
}: {
  level: AvailabilityLevel;
  free: number;
  total: number;
  unit?: string;
  variant?: "inline" | "block";
  className?: string;
}) {
  const text = describe(level, free, total, unit);

  if (variant === "block") {
    const bg = {
      plenty: "bg-success-soft",
      limited: "bg-warning-soft",
      none: "bg-danger-soft",
      closed: "bg-line-2",
    }[level];
    return (
      <div className={cn("flex items-center gap-2 px-3.5 py-3 text-[13px]", bg, TEXT[level], className)}>
        <AvailabilityDot level={level} />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px]", TEXT[level], className)}>
      <AvailabilityDot level={level} />
      {text}
    </span>
  );
}

function describe(level: AvailabilityLevel, free: number, total: number, unit: string): string {
  switch (level) {
    case "plenty":
      return `Còn ${free}/${total} ${unit} cho ngày bạn chọn`;
    case "limited":
      return free === 1 ? `Chỉ còn 1 ${unit} — đặt sớm kẻo hết` : `Sắp hết · còn ${free}/${total} ${unit}`;
    case "none":
      return "Hết đồ trong khoảng ngày này";
    case "closed":
      return AVAILABILITY_LABEL.closed;
  }
}
