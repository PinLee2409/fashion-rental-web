"use client";

import { useState } from "react";
import { OrderCard } from "@/components/account/OrderCard";
import { EmptyState, Reveal } from "@/components/ui/Primitives";
import { ORDERS } from "@/data/orders";
import { matchesTab, ORDER_TABS, type OrderTab } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const EMPTY_COPY: Record<OrderTab, { title: string; body: string }> = {
  all: {
    title: "Chưa có đơn thuê nào",
    body: "Khi bạn đặt thuê, mọi đơn sẽ xuất hiện ở đây kèm hạn trả và tình trạng hoàn cọc.",
  },
  upcoming: {
    title: "Không có đơn sắp nhận",
    body: "Chọn ngày cho dịp sắp tới và đặt trước — nhiều mẫu chỉ có một vài bộ.",
  },
  active: {
    title: "Bạn không có đơn đang thuê",
    body: "Khi đồ đã được bàn giao, đơn sẽ chuyển sang mục này kèm đếm ngược hạn trả.",
  },
  completed: {
    title: "Chưa có đơn nào hoàn tất",
    body: "Sau khi trả đồ và shop quyết toán cọc, đơn sẽ nằm ở đây cùng bảng quyết toán.",
  },
  cancelled: {
    title: "Không có đơn đã huỷ",
    body: "Đơn huỷ hoặc hết hạn thanh toán sẽ được lưu lại ở đây để bạn đối chiếu.",
  },
};

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>("all");
  const orders = ORDERS.filter((order) => matchesTab(order, tab));

  return (
    <div>
      <Reveal as="header" className="pb-6">
        <h2 className="display-3">Đơn thuê của tôi</h2>
        <p className="mt-2 text-[13px] text-ink-2">
          Theo dõi đơn từ lúc đặt tới lúc hoàn cọc. Mỗi đơn hiển thị đúng việc bạn cần làm tiếp theo.
        </p>
      </Reveal>

      <div className="no-scrollbar mb-8 flex gap-1 overflow-x-auto border-b border-line">
        {ORDER_TABS.map((item) => {
          const count = ORDERS.filter((order) => matchesTab(order, item.key)).length;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-[13px] transition-colors",
                tab === item.key ? "text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {item.label}
              <span className="ml-1.5 text-[11.5px] tabular-nums text-ink-3">{count}</span>
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-400 ease-luxe",
                  tab === item.key ? "scale-x-100 bg-ink" : "scale-x-0 bg-ink",
                )}
              />
            </button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={EMPTY_COPY[tab].title}
          body={EMPTY_COPY[tab].body}
          action={{ label: "Khám phá bộ sưu tập", href: "/collections/tat-ca" }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <Reveal key={order.code} delay={i * 60}>
              <OrderCard order={order} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
