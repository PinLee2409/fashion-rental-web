import type { ISODate } from "./date";
import type { AdminRole } from "./permissions";
import type { OrderStatus } from "./types";

/* ==========================================================================
   §4.2 — Vòng đời cá thể trang phục (`rental_units.status`)
   ========================================================================== */

export type UnitStatus =
  | "available"
  | "reserved"
  | "rented"
  | "cleaning"
  | "repairing"
  | "retired"
  | "lost";

export type ConditionGrade = "new" | "good" | "fair" | "worn";

/** `rental_units` — bảng quan trọng nhất của hệ thống */
export interface RentalUnit {
  id: string;
  /** Mã in QR, ví dụ AD-M-DO-003 */
  unitCode: string;
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  colorHex: string;
  status: UnitStatus;
  conditionGrade: ConditionGrade;
  purchaseDate: ISODate;
  purchaseCost: number;
  /** Số lượt đã cho thuê — dùng để mòn đều (BR-06) */
  rentalCount: number;
  lastCleanedAt: string | null;
  /** Vị trí trên giá kệ */
  location: string | null;
  note?: string;
  /** Tổng doanh thu cá thể đã tạo ra — phục vụ ROI */
  revenueToDate: number;
  maintenanceCost: number;
}

/** `bookings` — khoá lịch ở cấp cá thể */
export interface Booking {
  id: string;
  orderCode: string | null;
  variantId: string;
  unitId: string | null;
  unitCode: string | null;
  pickupDate: ISODate;
  returnDate: ISODate;
  busyFrom: ISODate;
  busyTo: ISODate;
  status: "held" | "confirmed" | "fulfilled" | "released" | "cancelled";
  customerName: string | null;
}

/** `maintenance_tasks` */
export type MaintenanceType = "cleaning" | "repair" | "alteration";
export type MaintenanceStatus = "todo" | "doing" | "quality_check" | "done" | "failed";

export interface MaintenanceTask {
  id: string;
  unitId: string;
  unitCode: string;
  productName: string;
  variantLabel: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  /** Lý do đưa vào hàng đợi, lấy từ biên bản kiểm tra */
  reason: string;
  assignedTo: string | null;
  cost: number;
  startedAt: string | null;
  finishedAt: string | null;
  /** Hạn phải xong — suy từ booking kế tiếp của cá thể */
  dueAt: ISODate | null;
  /** Có booking kế tiếp gấp hay không */
  nextBookingDate: ISODate | null;
  note?: string;
}

/* ==========================================================================
   Khách hàng phía vận hành
   ========================================================================== */

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedAt: string;
  status: "active" | "blocked";
  blacklistReason?: string;
  idCardNote: string;
  address: string;
  measurements: { heightCm: number; weightKg: number; bust: number; waist: number; hip: number } | null;
  totalRentals: number;
  totalSpend: number;
  lateReturns: number;
  damageIncidents: number;
  lastRentalAt: string | null;
  note?: string;
}

/* ==========================================================================
   Biên bản kiểm tra & phí (UC-12, UC-13, BR-31)
   ========================================================================== */

export type ReturnCondition = "intact" | "dirty" | "damage_minor" | "damage_major" | "lost";

export const RETURN_CONDITIONS: {
  key: ReturnCondition;
  label: string;
  hint: string;
  /** Cá thể chuyển sang trạng thái nào sau khi nhận (BR-31) */
  nextUnitStatus: UnitStatus;
  requiresEvidence: boolean;
}[] = [
  {
    key: "intact",
    label: "Nguyên vẹn",
    hint: "Không phát sinh phí",
    nextUnitStatus: "cleaning",
    requiresEvidence: false,
  },
  {
    key: "dirty",
    label: "Bẩn nặng",
    hint: "Dính màu, mùi, vết khó tẩy — phí giặt đặc biệt",
    nextUnitStatus: "cleaning",
    requiresEvidence: true,
  },
  {
    key: "damage_minor",
    label: "Hư hỏng nhẹ",
    hint: "Bung chỉ, rách nhỏ, mất hạt — 10–30% giá trị đồ",
    nextUnitStatus: "repairing",
    requiresEvidence: true,
  },
  {
    key: "damage_major",
    label: "Hư hỏng nặng",
    hint: "Không sửa được — 100% giá trị đồ",
    nextUnitStatus: "retired",
    requiresEvidence: true,
  },
  {
    key: "lost",
    label: "Mất",
    hint: "100% giá trị đồ + 20% phí cơ hội",
    nextUnitStatus: "lost",
    requiresEvidence: true,
  },
];

/* ==========================================================================
   Hàng đợi duyệt của Manager (BR-23, BR-33)
   ========================================================================== */

export type ApprovalKind = "fee_over_limit" | "refund_over_limit" | "fee_waive" | "dispute";

export interface ApprovalRequest {
  id: string;
  kind: ApprovalKind;
  orderCode: string;
  customerName: string;
  requestedBy: string;
  requestedByRole: AdminRole;
  requestedAt: string;
  reason: string;
  /** Mức hệ thống gợi ý */
  suggestedAmount: number;
  /** Mức nhân viên đề xuất */
  staffAmount: number;
  unitCode?: string;
  evidenceCount: number;
  status: "pending" | "approved" | "rejected";
}

/* ==========================================================================
   Người dùng hệ thống & thông báo vận hành
   ========================================================================== */

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "disabled";
  lastActiveAt: string;
  shift?: string;
}

export type OpsNotificationType =
  | "overdue"
  | "payment_expiring"
  | "return_due"
  | "repair_needed"
  | "refund_approval"
  | "order_confirmed"
  | "review_pending";

export interface OpsNotification {
  id: string;
  type: OpsNotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
  /** Vai trò nào cần thấy thông báo này */
  audience: AdminRole[];
}

/* ==========================================================================
   Hàng đợi vận hành trong ngày (A01)
   ========================================================================== */

export interface OpsEvent {
  time: string;
  kind: "pickup" | "return" | "delivery" | "collect";
  orderCode: string;
  customerName: string;
  summary: string;
  status: OrderStatus;
  overdue?: boolean;
}
