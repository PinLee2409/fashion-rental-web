"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, Reveal } from "@/components/ui/Primitives";
import { NOTIFICATIONS } from "@/data/customer";
import { formatDateTime } from "@/lib/date";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<AppNotification["type"], string> = {
  order: "Đơn thuê",
  return: "Trả đồ",
  payment: "Thanh toán",
  review: "Đánh giá",
  promotion: "Ưu đãi",
};

export default function NotificationsPage() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <Reveal as="header" className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <h2 className="display-3">Thông báo</h2>
          <p className="mt-2 text-[13px] text-ink-2">
            {unread > 0 ? `${unread} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
            className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em] text-ink-2"
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </Reveal>

      {items.length === 0 ? (
        <EmptyState
          title="Chưa có thông báo"
          body="Nhắc hạn trả, xác nhận đơn và tin hoàn cọc sẽ xuất hiện ở đây."
          action={{ label: "Khám phá bộ sưu tập", href: "/collections/tat-ca" }}
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((n, i) => (
            <Reveal as="li" key={n.id} delay={i * 50}>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                className={cn(
                  "flex w-full items-start gap-4 px-1 py-5 text-left transition-colors hover:bg-warm",
                  !n.read && "bg-warm/50",
                )}
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-line" : "bg-accent")} />
                <span className="min-w-0 flex-1">
                  <span className="eyebrow text-ink-3">{TYPE_LABEL[n.type]}</span>
                  <span className="mt-1.5 block text-[14px]">{n.title}</span>
                  <span className="mt-1 block max-w-[70ch] text-[13px] leading-relaxed text-ink-2">{n.body}</span>
                  {n.href && (
                    <Link href={n.href} className="link-line link-underline-in mt-2 inline-block text-[11.5px] uppercase tracking-[0.12em]">
                      Xem chi tiết
                    </Link>
                  )}
                </span>
                <span className="shrink-0 text-[11.5px] text-ink-3">{formatDateTime(n.createdAt)}</span>
              </button>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
