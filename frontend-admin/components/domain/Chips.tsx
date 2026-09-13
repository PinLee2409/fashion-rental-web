"use client";

import { StatusChip } from "@/components/ui/Primitives";
import { ORDER_STATUS } from "@/lib/order-status";
import type { ConditionGrade, MaintenanceStatus, MaintenanceType, UnitStatus } from "@/lib/admin-types";
import { CONDITION_GRADE, MAINTENANCE_STATUS, MAINTENANCE_TYPE, UNIT_STATUS, type Tone } from "@/lib/unit-status";
import type { OrderStatus } from "@/lib/types";

/** Badge trạng thái đơn — nhãn tiếng Việt, không lộ enum. */
export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS[status];
  return <StatusChip tone={meta.tone as Tone}>{meta.label}</StatusChip>;
}

export function UnitStatusChip({ status }: { status: UnitStatus }) {
  const meta = UNIT_STATUS[status];
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

export function ConditionChip({ grade }: { grade: ConditionGrade }) {
  const meta = CONDITION_GRADE[grade];
  return (
    <StatusChip tone={meta.tone} dot={false}>
      {meta.label}
    </StatusChip>
  );
}

export function MaintenanceTypeChip({ type }: { type: MaintenanceType }) {
  const meta = MAINTENANCE_TYPE[type];
  return (
    <StatusChip tone={meta.tone} dot={false}>
      {meta.label}
    </StatusChip>
  );
}

export function MaintenanceStatusChip({ status }: { status: MaintenanceStatus }) {
  const meta = MAINTENANCE_STATUS[status];
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
}

/** Mã cá thể — luôn hiển thị dạng mono để dễ đối chiếu với mã QR in trên tem. */
export function UnitCode({ code, muted }: { code: string; muted?: boolean }) {
  return (
    <span
      className={`num rounded border px-1.5 py-0.5 text-[11.5px] tracking-tight ${
        muted ? "border-line text-ink-3" : "border-line bg-surface-2 text-ink"
      }`}
    >
      {code}
    </span>
  );
}
