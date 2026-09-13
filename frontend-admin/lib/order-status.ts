import type { Order, OrderStatus } from "./types";

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface StatusMeta {
  /** Nhãn khách đọc được — không lộ enum kỹ thuật */
  label: string;
  tone: StatusTone;
  /** Một câu giải thích khách đang ở đâu trong hành trình */
  description: string;
  /** Việc khách cần làm tiếp theo, nếu có */
  nextAction?: string;
}

/** §4.1 — bảng trạng thái đơn thuê, dịch sang ngôn ngữ khách hàng. */
export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  draft: {
    label: "Đơn nháp",
    tone: "neutral",
    description: "Đơn chưa được gửi đi.",
  },
  pending_payment: {
    label: "Chờ thanh toán",
    tone: "warning",
    description: "Đơn đang được giữ chỗ, hoàn tất thanh toán để xác nhận.",
    nextAction: "Thanh toán trong 30 phút, quá hạn đơn sẽ tự huỷ và nhả đồ cho khách khác.",
  },
  confirmed: {
    label: "Đã xác nhận",
    tone: "success",
    description: "Shop đã nhận đơn và khoá lịch những món bạn thuê.",
    nextAction: "Chúng tôi sẽ soạn đồ trước ngày nhận.",
  },
  preparing: {
    label: "Đang soạn đồ",
    tone: "accent",
    description: "Nhân viên đang chọn và kiểm tra từng món trước khi bàn giao.",
  },
  ready: {
    label: "Sẵn sàng bàn giao",
    tone: "accent",
    description: "Đồ đã đóng gói xong, chờ bạn đến nhận hoặc chờ shipper lấy hàng.",
    nextAction: "Mang theo giấy tờ thế chân khi đến nhận đồ.",
  },
  in_use: {
    label: "Đang thuê",
    tone: "accent",
    description: "Đồ đang ở chỗ bạn. Nhớ mốc hẹn trả để tránh phí trễ.",
    nextAction: "Trả đúng hạn, hoặc gửi yêu cầu gia hạn trước hạn trả ít nhất 12 giờ.",
  },
  overdue: {
    label: "Quá hạn trả",
    tone: "danger",
    description: "Đã qua hạn trả, hệ thống đang tính phí trễ theo ngày.",
    nextAction: "Trả đồ sớm nhất có thể để dừng phát sinh phí.",
  },
  inspecting: {
    label: "Đang kiểm tra khi trả",
    tone: "accent",
    description: "Shop đã nhận lại đồ và đang lập biên bản kiểm tra tình trạng.",
    nextAction: "Bạn sẽ nhận thông báo số tiền cọc được hoàn ngay sau khi kiểm tra xong.",
  },
  pending_approval: {
    label: "Chờ quản lý duyệt",
    tone: "warning",
    description: "Khoản phí phát sinh vượt hạn mức nhân viên, đang chờ quản lý xét duyệt.",
  },
  disputed: {
    label: "Đang khiếu nại",
    tone: "danger",
    description: "Bạn đã gửi khiếu nại về biên bản kiểm tra, shop đang xử lý.",
  },
  completed: {
    label: "Hoàn tất",
    tone: "success",
    description: "Đơn đã quyết toán xong và cọc đã được hoàn theo biên bản.",
    nextAction: "Chia sẻ đánh giá của bạn trong vòng 30 ngày.",
  },
  cancelled: {
    label: "Đã huỷ",
    tone: "neutral",
    description: "Đơn đã được huỷ, tiền hoàn theo chính sách huỷ.",
  },
  expired: {
    label: "Hết hạn thanh toán",
    tone: "neutral",
    description: "Đơn tự huỷ vì quá 30 phút chưa thanh toán.",
  },
};

/* ==========================================================================
   Timeline khách nhìn thấy (S09)
   Đặt → Xác nhận → Soạn đồ → Nhận đồ → Trả đồ → Hoàn tất
   ========================================================================== */

export interface TimelineStep {
  key: string;
  label: string;
  caption: string;
}

export const ORDER_TIMELINE: TimelineStep[] = [
  { key: "placed", label: "Đặt đơn", caption: "Đã gửi yêu cầu thuê" },
  { key: "confirmed", label: "Xác nhận", caption: "Thanh toán thành công, khoá lịch" },
  { key: "preparing", label: "Soạn đồ", caption: "Chọn cá thể, kiểm tra, đóng gói" },
  { key: "handover", label: "Nhận đồ", caption: "Bàn giao tại shop hoặc giao tận nơi" },
  { key: "return", label: "Trả đồ", caption: "Nhận lại và lập biên bản kiểm tra" },
  { key: "completed", label: "Hoàn tất", caption: "Quyết toán cọc, đơn khép lại" },
];

const STEP_INDEX: Record<OrderStatus, number> = {
  draft: 0,
  pending_payment: 0,
  confirmed: 1,
  preparing: 2,
  ready: 2,
  in_use: 3,
  overdue: 3,
  inspecting: 4,
  pending_approval: 4,
  disputed: 4,
  completed: 5,
  cancelled: -1,
  expired: -1,
};

/** Chỉ số bước hiện tại; -1 nghĩa là đơn đã dừng giữa chừng. */
export function currentStepIndex(status: OrderStatus): number {
  return STEP_INDEX[status];
}

export function isTerminated(status: OrderStatus): boolean {
  return status === "cancelled" || status === "expired";
}

export function isActiveRental(status: OrderStatus): boolean {
  return ["confirmed", "preparing", "ready", "in_use", "overdue", "inspecting", "pending_approval", "disputed"].includes(
    status,
  );
}

/** Nhóm tab ở màn "Đơn thuê của tôi" (S08). */
export type OrderTab = "all" | "upcoming" | "active" | "completed" | "cancelled";

export const ORDER_TABS: { key: OrderTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "upcoming", label: "Sắp nhận" },
  { key: "active", label: "Đang thuê" },
  { key: "completed", label: "Hoàn tất" },
  { key: "cancelled", label: "Đã huỷ" },
];

export function matchesTab(order: Order, tab: OrderTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "upcoming":
      return ["pending_payment", "confirmed", "preparing", "ready"].includes(order.status);
    case "active":
      return ["in_use", "overdue", "inspecting", "pending_approval", "disputed"].includes(order.status);
    case "completed":
      return order.status === "completed";
    case "cancelled":
      return order.status === "cancelled" || order.status === "expired";
  }
}

/** BR-20 chỉ cho huỷ ở `pending_payment` và `confirmed` (xem bảng chuyển trạng thái §4.1). */
export function canCancel(status: OrderStatus): boolean {
  return status === "pending_payment" || status === "confirmed";
}

/** BR-40 — gửi yêu cầu gia hạn khi đang thuê. */
export function canExtend(status: OrderStatus): boolean {
  return status === "in_use";
}

/** BR-60 — chỉ đơn `completed` mới được đánh giá. */
export function canReview(status: OrderStatus): boolean {
  return status === "completed";
}

export function canPay(status: OrderStatus): boolean {
  return status === "pending_payment";
}

export const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-line-2 text-ink-2",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};
