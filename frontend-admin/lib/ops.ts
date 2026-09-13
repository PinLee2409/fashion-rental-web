import {
  APPROVALS,
  BOOKINGS,
  CUSTOMERS,
  MAINTENANCE,
  NOTIFICATIONS,
  ORDERS,
  ORDER_PICKUP_HOUR,
  UNITS,
} from "@/data/operations";
import type { OpsEvent } from "./admin-types";
import { addDays, diffDays, todayISO } from "./date";
import type { Order, OrderStatus } from "./types";
import type { AdminRole } from "./permissions";

const TODAY = todayISO();

/* ------------------------------------------------------------- bộ đếm --- */

export interface OpsCounters {
  todayPickups: number;
  todayReturns: number;
  activeRentals: number;
  overdue: number;
  pendingPayment: number;
  cleaning: number;
  repairing: number;
  pendingApproval: number;
  inspecting: number;
  reviewsPending: number;
  unitsUnavailable: number;
  revenue30d: number;
  depositHeld: number;
}

export function counters(): OpsCounters {
  const activeStatuses: OrderStatus[] = ["in_use", "overdue"];
  return {
    todayPickups: ORDERS.filter((o) => o.pickupDate === TODAY && ["ready", "preparing", "confirmed"].includes(o.status))
      .length,
    todayReturns: ORDERS.filter((o) => o.returnDate === TODAY && activeStatuses.includes(o.status)).length,
    activeRentals: ORDERS.filter((o) => activeStatuses.includes(o.status)).length,
    overdue: ORDERS.filter((o) => o.status === "overdue").length,
    pendingPayment: ORDERS.filter((o) => o.status === "pending_payment").length,
    cleaning: UNITS.filter((u) => u.status === "cleaning").length,
    repairing: UNITS.filter((u) => u.status === "repairing").length,
    pendingApproval: APPROVALS.filter((a) => a.status === "pending").length,
    inspecting: ORDERS.filter((o) => o.status === "inspecting").length,
    reviewsPending: 2,
    unitsUnavailable: UNITS.filter((u) => !["available"].includes(u.status)).length,
    revenue30d: revenueBetween(addDays(TODAY, -30), TODAY).rentalRevenue,
    depositHeld: ORDERS.filter((o) => ["confirmed", "preparing", "ready", "in_use", "overdue", "inspecting", "pending_approval", "disputed"].includes(o.status)).reduce(
      (sum, o) => sum + o.totalDeposit,
      0,
    ),
  };
}

export function badgeCounts() {
  const c = counters();
  return {
    orders: c.overdue + c.pendingPayment,
    returns: c.todayReturns + c.overdue,
    approvals: c.pendingApproval,
    maintenance: MAINTENANCE.filter((t) => t.status === "todo" || t.status === "failed").length,
    reviews: c.reviewsPending,
  };
}

/* ------------------------------------------------------- cần xử lý ngay -- */

export interface AttentionItem {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  /** Vai trò nào nên thấy mục này */
  roles: AdminRole[];
}

export function attentionItems(): AttentionItem[] {
  const items: AttentionItem[] = [];

  const overdue = ORDERS.filter((o) => o.status === "overdue");
  if (overdue.length) {
    const worst = overdue.sort((a, b) => a.returnDate.localeCompare(b.returnDate))[0];
    items.push({
      id: "att-overdue",
      tone: "danger",
      title: `${overdue.length} đơn quá hạn trả`,
      detail: `${worst.code} — ${worst.receiverName}, quá hạn ${Math.abs(diffDays(TODAY, worst.returnDate))} ngày, phí trễ đang chạy.`,
      href: "/orders?quick=overdue",
      actionLabel: "Xem đơn quá hạn",
      roles: ["staff", "manager", "admin"],
    });
  }

  const inspecting = ORDERS.filter((o) => o.status === "inspecting");
  if (inspecting.length) {
    items.push({
      id: "att-inspect",
      tone: "warning",
      title: `${inspecting.length} đơn đang chờ lập biên bản`,
      detail: `${inspecting[0].code} đã nhận lại đồ nhưng chưa quyết toán cọc.`,
      href: "/returns",
      actionLabel: "Mở quầy nhận trả",
      roles: ["staff", "warehouse", "manager", "admin"],
    });
  }

  const pendingApprovals = APPROVALS.filter((a) => a.status === "pending");
  if (pendingApprovals.length) {
    items.push({
      id: "att-approval",
      tone: "warning",
      title: `${pendingApprovals.length} yêu cầu chờ Manager duyệt`,
      detail: pendingApprovals[0].reason,
      href: "/approvals",
      actionLabel: "Vào hàng đợi duyệt",
      roles: ["manager", "admin"],
    });
  }

  const repairBacklog = MAINTENANCE.filter((t) => t.status === "todo" || t.status === "failed");
  if (repairBacklog.length) {
    items.push({
      id: "att-maintenance",
      tone: "info",
      title: `${repairBacklog.length} cá thể đang chờ xử lý ở kho`,
      detail: repairBacklog[0].nextBookingDate
        ? `${repairBacklog[0].unitCode} có booking kế tiếp ngày ${repairBacklog[0].nextBookingDate} — cần xong trước đó.`
        : `${repairBacklog[0].unitCode}: ${repairBacklog[0].reason}`,
      href: "/maintenance",
      actionLabel: "Mở hàng đợi",
      roles: ["warehouse", "manager", "admin"],
    });
  }

  const pending = ORDERS.filter((o) => o.status === "pending_payment");
  if (pending.length) {
    items.push({
      id: "att-payment",
      tone: "warning",
      title: `${pending.length} đơn chưa thanh toán sắp hết hạn giữ chỗ`,
      detail: `Quá 30 phút hệ thống sẽ tự huỷ và nhả lịch giữ chỗ.`,
      href: "/orders?quick=pending_payment",
      actionLabel: "Xem đơn chờ thanh toán",
      roles: ["staff", "manager", "admin"],
    });
  }

  return items;
}

export function attentionFor(role: AdminRole): AttentionItem[] {
  return attentionItems().filter((i) => i.roles.includes(role));
}

/* ------------------------------------------------- hàng đợi trong ngày -- */

export function todayTimeline(): OpsEvent[] {
  const events: OpsEvent[] = [];

  for (const order of ORDERS) {
    if (order.pickupDate === TODAY && ["confirmed", "preparing", "ready"].includes(order.status)) {
      const hour = ORDER_PICKUP_HOUR[order.code] ?? 10;
      events.push({
        time: `${String(hour).padStart(2, "0")}:00`,
        kind: order.pickupMethod === "delivery" ? "delivery" : "pickup",
        orderCode: order.code,
        customerName: order.receiverName,
        summary: order.items.map((i) => i.productNameSnapshot).join(" · "),
        status: order.status,
      });
    }
    if (order.returnDate === TODAY && ["in_use", "overdue"].includes(order.status)) {
      events.push({
        time: "18:00",
        kind: "return",
        orderCode: order.code,
        customerName: order.receiverName,
        summary: order.items.map((i) => i.productNameSnapshot).join(" · "),
        status: order.status,
      });
    }
    if (order.status === "overdue") {
      events.push({
        time: "—",
        kind: "collect",
        orderCode: order.code,
        customerName: order.receiverName,
        summary: `Quá hạn ${Math.abs(diffDays(TODAY, order.returnDate))} ngày · ${order.items[0].productNameSnapshot}`,
        status: order.status,
        overdue: true,
      });
    }
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}

/* --------------------------------------------------- phân bố trạng thái -- */

export function statusDistribution(): { status: OrderStatus; count: number }[] {
  const order: OrderStatus[] = [
    "pending_payment",
    "confirmed",
    "preparing",
    "ready",
    "in_use",
    "overdue",
    "inspecting",
    "pending_approval",
    "disputed",
    "completed",
    "cancelled",
    "expired",
  ];
  return order
    .map((status) => ({ status, count: ORDERS.filter((o) => o.status === status).length }))
    .filter((row) => row.count > 0);
}

/* ------------------------------------------------------------ báo cáo --- */

export interface RevenueBreakdown {
  /** Tiền thuê thực thu — KHÔNG gồm tiền cọc (BR-14) */
  rentalRevenue: number;
  lateFees: number;
  damageFees: number;
  cleaningFees: number;
  discounts: number;
  refunds: number;
  depositCollected: number;
  orders: number;
}

export function revenueBetween(from: string, to: string): RevenueBreakdown {
  const scoped = ORDERS.filter((o) => {
    const d = o.createdAt.slice(0, 10);
    return d >= from && d <= to && !["cancelled", "expired", "pending_payment"].includes(o.status);
  });

  let lateFees = 0;
  let damageFees = 0;
  let cleaningFees = 0;
  for (const o of scoped) {
    for (const f of o.fees) {
      if (f.type === "late") lateFees += f.amount;
      else if (f.type === "dirty") cleaningFees += f.amount;
      else damageFees += f.amount;
    }
  }

  return {
    rentalRevenue: scoped.reduce((s, o) => s + o.subtotalRental - o.discount + o.shippingFee, 0),
    lateFees,
    damageFees,
    cleaningFees,
    discounts: scoped.reduce((s, o) => s + o.discount, 0),
    refunds: scoped.reduce((s, o) => s + (o.settlement?.refundAmount ?? 0), 0),
    depositCollected: scoped.reduce((s, o) => s + o.totalDeposit, 0),
    orders: scoped.length,
  };
}

/** Doanh thu theo ngày cho biểu đồ 30 ngày. */
export function revenueSeries(days = 30): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(TODAY, -i);
    const value = ORDERS.filter(
      (o) => o.createdAt.slice(0, 10) === date && !["cancelled", "expired", "pending_payment"].includes(o.status),
    ).reduce((s, o) => s + o.subtotalRental - o.discount, 0);
    out.push({ date, value });
  }
  return out;
}

export interface UtilizationRow {
  unitCode: string;
  productName: string;
  variantLabel: string;
  rentalCount: number;
  daysRented: number;
  utilization: number;
  revenue: number;
  idleDays: number;
  roi: number;
}

/** Tỷ lệ khai thác trong `windowDays` ngày gần nhất. */
export function utilization(windowDays = 90): UtilizationRow[] {
  const from = addDays(TODAY, -windowDays);
  return UNITS.map((unit) => {
    const daysRented = BOOKINGS.filter(
      (b) => b.unitCode === unit.unitCode && b.status !== "cancelled" && b.returnDate >= from && b.pickupDate <= TODAY,
    ).reduce((sum, b) => sum + Math.max(1, diffDays(b.pickupDate, b.returnDate)), 0);
    return {
      unitCode: unit.unitCode,
      productName: unit.productName,
      variantLabel: `${unit.size} · ${unit.color}`,
      rentalCount: unit.rentalCount,
      daysRented,
      utilization: Math.round((daysRented / windowDays) * 100),
      revenue: unit.revenueToDate,
      idleDays: windowDays - daysRented,
      roi: unit.purchaseCost > 0 ? Math.round((unit.revenueToDate / unit.purchaseCost) * 100) / 100 : 0,
    };
  }).sort((a, b) => b.utilization - a.utilization);
}

export function topProducts(limit = 6) {
  const map = new Map<string, { name: string; rentals: number; revenue: number }>();
  for (const unit of UNITS) {
    const cur = map.get(unit.productSlug) ?? { name: unit.productName, rentals: 0, revenue: 0 };
    cur.rentals += unit.rentalCount;
    cur.revenue += unit.revenueToDate;
    map.set(unit.productSlug, cur);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function idleStock(limit = 8) {
  return utilization()
    .filter((u) => u.utilization < 12)
    .sort((a, b) => a.utilization - b.utilization)
    .slice(0, limit);
}

/* ------------------------------------------------------------ tiện ích -- */

export function notificationsFor(role: AdminRole) {
  return NOTIFICATIONS.filter((n) => n.audience.includes(role));
}

export function customerById(id: string) {
  return CUSTOMERS.find((c) => c.id === id);
}

export function isOverdue(order: Order): boolean {
  return order.status === "overdue";
}

export { TODAY };

/* --------------------------------------------- tồn kho theo khoảng ngày -- */

/**
 * Cá thể còn rảnh của một biến thể trong khoảng ngày (BR-01 → BR-03).
 * Khoảng bận = [pickup, return + buffer giặt ủi của danh mục].
 */
export function freeUnitsFor(variantId: string, from: string, to: string, cleanBufferDays: number) {
  const busyTo = addDays(to, cleanBufferDays);
  return UNITS.filter((unit) => {
    if (unit.variantId !== variantId) return false;
    if (unit.status !== "available") return false;
    return !BOOKINGS.some(
      (b) =>
        b.unitCode === unit.unitCode &&
        ["held", "confirmed"].includes(b.status) &&
        b.busyFrom <= busyTo &&
        b.busyTo >= from,
    );
  });
}
