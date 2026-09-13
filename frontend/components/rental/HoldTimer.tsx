"use client";

import { useEffect, useState } from "react";
import { IconClock } from "@/components/ui/Icons";
import { useMounted } from "@/hooks";
import { formatCountdown } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * `<HoldTimer>` — đếm ngược TTL giữ chỗ (BR-05).
 * Hết giờ thì giỏ phải được làm mới: đặc tả yêu cầu nhả booking `held`
 * và báo cho khách biết món đồ đã mở lại cho người khác.
 */
export function HoldTimer({
  expiresAt,
  onExpire,
  label = "Giữ chỗ còn",
  className,
}: {
  expiresAt: number;
  onExpire?: () => void;
  label?: string;
  className?: string;
}) {
  const mounted = useMounted();
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(Math.max(0, expiresAt - Date.now()));
    const id = setInterval(() => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  if (!mounted) return null;

  const seconds = Math.floor(remaining / 1000);
  const urgent = seconds <= 120;
  const expired = seconds <= 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-[12px] tabular-nums",
        expired ? "bg-danger-soft text-danger" : urgent ? "bg-warning-soft text-warning" : "bg-warm text-ink-2",
        className,
      )}
    >
      <IconClock width={13} height={13} />
      {expired ? "Hết thời gian giữ chỗ" : `${label} ${formatCountdown(seconds)}`}
    </span>
  );
}
