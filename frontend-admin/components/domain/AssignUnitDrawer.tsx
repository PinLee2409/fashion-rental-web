"use client";

import { useMemo } from "react";
import { UnitCode, UnitStatusChip, ConditionChip } from "@/components/domain/Chips";
import { IconAlert, IconCheck, IconSparkle } from "@/components/ui/Icons";
import { Drawer } from "@/components/ui/Overlay";
import { Callout, EmptyState, StatusChip } from "@/components/ui/Primitives";
import { BOOKINGS, UNITS, nextBookingOfUnit } from "@/data/operations";
import { cleanBufferFor } from "@/data/catalog";
import { getProduct } from "@/data/products";
import { addDays, formatDate, formatDateTime, overlaps, type ISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  orderCode: string;
  productSlug: string;
  size: string;
  color: string;
  pickupDate: ISODate;
  returnDate: ISODate;
  assignedCode: string | null;
  onAssign: (unitCode: string) => void;
}

/**
 * Gán cá thể cho một dòng đơn — BR-06 (late binding).
 * Chỉ liệt kê cá thể `available`, không chồng lịch (đã cộng buffer giặt ủi),
 * sắp xếp theo `rental_count` tăng dần để mòn đều.
 */
export function AssignUnitDrawer({
  open,
  onClose,
  orderCode,
  productSlug,
  size,
  color,
  pickupDate,
  returnDate,
  assignedCode,
  onAssign,
}: Props) {
  const product = getProduct(productSlug);
  const cleanBuffer = product ? cleanBufferFor(product.categorySlug) : 1;
  const variant = product?.variants.find((v) => v.size === size && v.color === color);

  const candidates = useMemo(() => {
    if (!variant) return [];
    const busyFrom = pickupDate;
    const busyTo = addDays(returnDate, cleanBuffer);

    return UNITS.filter((u) => u.variantId === variant.id)
      .map((unit) => {
        const conflict = BOOKINGS.find(
          (b) =>
            b.unitCode === unit.unitCode &&
            b.orderCode !== orderCode &&
            ["held", "confirmed"].includes(b.status) &&
            overlaps(b.busyFrom, b.busyTo, busyFrom, busyTo),
        );
        const blockedByStatus = !["available", "reserved"].includes(unit.status) && unit.unitCode !== assignedCode;
        return {
          unit,
          conflict,
          selectable: !conflict && !blockedByStatus,
          next: nextBookingOfUnit(unit.unitCode, returnDate),
        };
      })
      .sort((a, b) => {
        if (a.selectable !== b.selectable) return a.selectable ? -1 : 1;
        return a.unit.rentalCount - b.unit.rentalCount;
      });
  }, [variant, pickupDate, returnDate, cleanBuffer, orderCode, assignedCode]);

  const recommended = candidates.find((c) => c.selectable)?.unit.unitCode;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Gán cá thể cho dòng đơn"
      subtitle={product ? `${product.name} · ${size} · ${color}` : undefined}
      width="max-w-[620px]"
    >
      <div className="space-y-4 px-5 py-5">
        <Callout tone="info" icon={<IconCheck width={14} height={14} />}>
          Khoảng bận cần trống: <span className="num">{formatDate(pickupDate)}</span> →{" "}
          <span className="num">{formatDate(addDays(returnDate, cleanBuffer))}</span> (đã cộng {cleanBuffer} ngày đệm
          giặt ủi). Cá thể ít lượt thuê nhất được gợi ý trước để mòn đều.
        </Callout>

        {candidates.length === 0 ? (
          <EmptyState
            title="Biến thể này chưa có cá thể nào"
            body="Cần nhập thêm cá thể cho biến thể trước khi có thể soạn đồ cho đơn."
          />
        ) : (
          <ul className="space-y-2">
            {candidates.map(({ unit, conflict, selectable, next }) => {
              const isAssigned = unit.unitCode === assignedCode;
              const isRecommended = unit.unitCode === recommended && !isAssigned;
              return (
                <li
                  key={unit.unitCode}
                  className={cn(
                    "card p-3 transition-colors",
                    isAssigned && "border-ink bg-beige",
                    !selectable && "opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <UnitCode code={unit.unitCode} />
                        <UnitStatusChip status={unit.status} />
                        <ConditionChip grade={unit.conditionGrade} />
                        {isRecommended && (
                          <StatusChip tone="success" dot={false}>
                            <IconSparkle width={11} height={11} />
                            Gợi ý
                          </StatusChip>
                        )}
                        {isAssigned && (
                          <StatusChip tone="accent" dot={false}>
                            Đang gán
                          </StatusChip>
                        )}
                      </div>
                      <p className="mt-2 text-[11.5px] text-ink-2">
                        Đã thuê <span className="num">{unit.rentalCount}</span> lượt · Vị trí{" "}
                        <span className="num">{unit.location ?? "—"}</span> · Giặt lần cuối{" "}
                        {unit.lastCleanedAt ? formatDateTime(unit.lastCleanedAt) : "chưa có"}
                      </p>
                      {next && (
                        <p className="mt-1 text-[11.5px] text-ink-3">
                          Booking kế tiếp: {formatDate(next.pickupDate)} → {formatDate(next.returnDate)}
                          {next.orderCode ? ` · ${next.orderCode}` : ""}
                        </p>
                      )}
                      {conflict && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-danger">
                          <IconAlert width={12} height={12} className="mt-px shrink-0" />
                          Chồng lịch với {conflict.orderCode ?? "một booking khác"} (
                          {formatDate(conflict.busyFrom)} → {formatDate(conflict.busyTo)})
                        </p>
                      )}
                      {!conflict && !selectable && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-warning">
                          <IconAlert width={12} height={12} className="mt-px shrink-0" />
                          Cá thể đang ở trạng thái không cho thuê được.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!selectable || isAssigned}
                      onClick={() => {
                        onAssign(unit.unitCode);
                        onClose();
                      }}
                      className={cn("btn btn-sm shrink-0", isAssigned ? "btn-outline" : "")}
                    >
                      {isAssigned ? "Đã gán" : assignedCode ? "Đổi sang cá thể này" : "Gán cá thể"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
