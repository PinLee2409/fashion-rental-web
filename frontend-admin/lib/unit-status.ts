import type { ConditionGrade, MaintenanceStatus, MaintenanceType, UnitStatus } from "./admin-types";

export type Tone = "neutral" | "info" | "accent" | "success" | "warning" | "danger";

/** §4.2 — trạng thái cá thể và khả năng cho thuê. */
export const UNIT_STATUS: Record<
  UnitStatus,
  { label: string; tone: Tone; rentable: boolean; description: string }
> = {
  available: {
    label: "Sẵn sàng",
    tone: "success",
    rentable: true,
    description: "Đang ở kho, có thể gán vào đơn mới.",
  },
  reserved: {
    label: "Đã giữ cho đơn",
    tone: "info",
    rentable: false,
    description: "Đã gán cho một đơn, chưa bàn giao.",
  },
  rented: {
    label: "Đang ở chỗ khách",
    tone: "accent",
    rentable: false,
    description: "Đã bàn giao, đang trong thời gian thuê.",
  },
  cleaning: {
    label: "Đang giặt ủi",
    tone: "warning",
    rentable: false,
    description: "Trong hàng đợi giặt ủi sau khi khách trả.",
  },
  repairing: {
    label: "Đang sửa chữa",
    tone: "warning",
    rentable: false,
    description: "Đang sửa, chỉ về kho khi QC đạt.",
  },
  retired: {
    label: "Đã thanh lý",
    tone: "neutral",
    rentable: false,
    description: "Ngừng khai thác, giữ lại để tham chiếu đơn cũ.",
  },
  lost: {
    label: "Mất",
    tone: "danger",
    rentable: false,
    description: "Khách làm mất, đã ghi nhận bồi thường.",
  },
};

export const CONDITION_GRADE: Record<ConditionGrade, { label: string; tone: Tone }> = {
  new: { label: "Mới", tone: "success" },
  good: { label: "Tốt", tone: "success" },
  fair: { label: "Khá", tone: "warning" },
  worn: { label: "Đã cũ", tone: "danger" },
};

export const MAINTENANCE_TYPE: Record<MaintenanceType, { label: string; tone: Tone }> = {
  cleaning: { label: "Giặt ủi", tone: "info" },
  repair: { label: "Sửa chữa", tone: "warning" },
  alteration: { label: "Sửa vừa người", tone: "accent" },
};

export const MAINTENANCE_STATUS: Record<MaintenanceStatus, { label: string; tone: Tone }> = {
  todo: { label: "Chờ xử lý", tone: "neutral" },
  doing: { label: "Đang làm", tone: "info" },
  quality_check: { label: "Chờ QC", tone: "warning" },
  done: { label: "Hoàn tất", tone: "success" },
  failed: { label: "QC không đạt", tone: "danger" },
};

/** Chuyển trạng thái cá thể hợp lệ theo sơ đồ §4.2. */
export const UNIT_TRANSITIONS: Record<UnitStatus, UnitStatus[]> = {
  available: ["reserved", "cleaning", "repairing", "retired", "lost"],
  reserved: ["rented", "available"],
  rented: ["cleaning", "repairing", "lost"],
  cleaning: ["available", "repairing"],
  repairing: ["available", "retired"],
  retired: [],
  lost: [],
};

export function canTransitionUnit(from: UnitStatus, to: UnitStatus): boolean {
  return UNIT_TRANSITIONS[from].includes(to);
}
