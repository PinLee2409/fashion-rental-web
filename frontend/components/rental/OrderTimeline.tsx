"use client";

import { currentStepIndex, isTerminated, ORDER_TIMELINE } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * `<OrderTimeline>` — dịch state machine của đơn (§4.1) thành tiến trình khách hiểu được:
 * Đặt đơn → Xác nhận → Soạn đồ → Nhận đồ → Trả đồ → Hoàn tất.
 */
export function OrderTimeline({ status, compact }: { status: OrderStatus; compact?: boolean }) {
  const current = currentStepIndex(status);
  const stopped = isTerminated(status);

  if (stopped) {
    return (
      <div className="flex items-center gap-3 bg-line-2 px-4 py-3 text-[13px] text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
        {status === "cancelled" ? "Đơn đã huỷ — hành trình dừng tại đây." : "Đơn hết hạn thanh toán và đã tự huỷ."}
      </div>
    );
  }

  return (
    <ol className={cn("grid gap-y-4", compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 md:grid-cols-6")}>
      {ORDER_TIMELINE.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="relative pr-3">
            <div className="flex items-center">
              <span
                className={cn(
                  "relative z-10 grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full transition-colors duration-500",
                  done && "bg-ink",
                  active && "bg-accent",
                  !done && !active && "border border-line bg-canvas",
                )}
              >
                {active && <span className="absolute h-4 w-4 rounded-full border border-accent/40" />}
              </span>
              {i < ORDER_TIMELINE.length - 1 && (
                <span
                  className={cn(
                    "ml-1 h-px flex-1 transition-colors duration-500",
                    done ? "bg-ink" : "bg-line",
                  )}
                />
              )}
            </div>
            <p className={cn("mt-2.5 text-[12.5px]", active ? "text-ink" : done ? "text-ink-2" : "text-ink-3")}>
              {step.label}
            </p>
            {!compact && <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{step.caption}</p>}
          </li>
        );
      })}
    </ol>
  );
}
