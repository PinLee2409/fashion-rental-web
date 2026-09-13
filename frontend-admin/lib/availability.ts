import { addDays, diffDays, monthGrid, overlaps, todayISO, type ISODate } from "./date";
import { SETTINGS } from "./settings";
import type { AvailabilityLevel, Product, UnitBooking, Variant, VariantAvailability } from "./types";

/* ==========================================================================
   BR-01 → BR-03 — Engine kiểm tra lịch trống
   Một cá thể U rảnh trong [D1, D2] khi U.status = available VÀ không tồn tại
   booking B (held | confirmed) của U chồng lấn [D1 − prep_buffer, D2 + clean_buffer].
   ========================================================================== */

export interface BusyWindow {
  busyFrom: ISODate;
  busyTo: ISODate;
}

/** BR-02 — khoảng bận thực tế = ngày thuê + buffer chuẩn bị / giặt ủi. */
export function busyWindow(
  pickupDate: ISODate,
  returnDate: ISODate,
  cleanBufferDays: number,
  prepBufferDays: number = SETTINGS.prep_buffer_days,
): BusyWindow {
  return {
    busyFrom: addDays(pickupDate, -prepBufferDays),
    busyTo: addDays(returnDate, cleanBufferDays),
  };
}

/** Đếm số cá thể rảnh của một biến thể trong khoảng ngày (tương đương câu SQL ở BR-03). */
export function countFreeUnits(
  variant: Variant,
  bookings: UnitBooking[],
  pickupDate: ISODate,
  returnDate: ISODate,
  cleanBufferDays: number,
): number {
  const wanted = busyWindow(pickupDate, returnDate, cleanBufferDays);
  let free = 0;
  for (let unitIndex = 0; unitIndex < variant.unitCount; unitIndex++) {
    const busy = bookings.some((b) => {
      if (b.variantId !== variant.id || b.unitIndex !== unitIndex) return false;
      const w = busyWindow(b.pickupDate, b.returnDate, cleanBufferDays);
      return overlaps(w.busyFrom, w.busyTo, wanted.busyFrom, wanted.busyTo);
    });
    if (!busy) free += 1;
  }
  return free;
}

export function levelFor(freeUnits: number, totalUnits: number): AvailabilityLevel {
  if (freeUnits <= 0) return "none";
  if (freeUnits === 1 || freeUnits / Math.max(1, totalUnits) <= 0.34) return "limited";
  return "plenty";
}

export function variantAvailability(
  variant: Variant,
  bookings: UnitBooking[],
  pickupDate: ISODate,
  returnDate: ISODate,
  cleanBufferDays: number,
): VariantAvailability {
  const freeUnits = countFreeUnits(variant, bookings, pickupDate, returnDate, cleanBufferDays);
  return {
    variantId: variant.id,
    totalUnits: variant.unitCount,
    freeUnits,
    level: levelFor(freeUnits, variant.unitCount),
  };
}

export function productAvailability(
  product: Product,
  bookings: UnitBooking[],
  pickupDate: ISODate,
  returnDate: ISODate,
  cleanBufferDays: number,
): Record<string, VariantAvailability> {
  const map: Record<string, VariantAvailability> = {};
  for (const variant of product.variants) {
    map[variant.id] = variantAvailability(variant, bookings, pickupDate, returnDate, cleanBufferDays);
  }
  return map;
}

/** Tổng số cá thể rảnh trên toàn bộ biến thể — dùng cho thẻ sản phẩm ở trang danh mục. */
export function productFreeUnits(
  product: Product,
  bookings: UnitBooking[],
  pickupDate: ISODate,
  returnDate: ISODate,
  cleanBufferDays: number,
  filter?: { sizes?: string[]; colors?: string[] },
): { free: number; total: number; level: AvailabilityLevel } {
  let free = 0;
  let total = 0;
  for (const variant of product.variants) {
    if (filter?.sizes?.length && !filter.sizes.includes(variant.size)) continue;
    if (filter?.colors?.length && !filter.colors.includes(variant.color)) continue;
    total += variant.unitCount;
    free += countFreeUnits(variant, bookings, pickupDate, returnDate, cleanBufferDays);
  }
  return { free, total, level: levelFor(free, total) };
}

/* ==========================================================================
   Lịch tô màu — GET /products/{slug}/calendar?month=
   ========================================================================== */

export interface CalendarDay {
  date: ISODate;
  level: AvailabilityLevel;
  freeUnits: number;
  totalUnits: number;
  inMonth: boolean;
}

/**
 * Với mỗi ngày trong lưới tháng, tính số cá thể còn rảnh nếu thuê đúng ngày đó.
 * Ngày nằm ngoài cửa sổ đặt trước (BR-07) trả về level `closed`.
 */
export function buildCalendar(
  variants: Variant[],
  bookings: UnitBooking[],
  monthAnchor: ISODate,
  cleanBufferDays: number,
  today: ISODate = todayISO(),
): CalendarDay[] {
  const { min, max } = bookingWindow(today);
  return monthGrid(monthAnchor).map((date) => {
    const inMonth = date.slice(0, 7) === monthAnchor.slice(0, 7);
    if (date < min || date > max) {
      return { date, level: "closed" as AvailabilityLevel, freeUnits: 0, totalUnits: 0, inMonth };
    }
    // Không truyền biến thể nào (ví dụ thanh chọn ngày chung cho cả catalog)
    // → chỉ kiểm tra cửa sổ đặt trước, không tô màu theo tồn kho.
    if (variants.length === 0) {
      return { date, level: "plenty" as AvailabilityLevel, freeUnits: 0, totalUnits: 0, inMonth };
    }
    let free = 0;
    let total = 0;
    for (const variant of variants) {
      total += variant.unitCount;
      free += countFreeUnits(variant, bookings, date, date, cleanBufferDays);
    }
    return { date, level: levelFor(free, total), freeUnits: free, totalUnits: total, inMonth };
  });
}

/* ==========================================================================
   BR-07 — Giới hạn đặt trước & thời gian thuê
   ========================================================================== */

export function bookingWindow(today: ISODate = todayISO()): { min: ISODate; max: ISODate } {
  return {
    min: addDays(today, SETTINGS.min_lead_days),
    max: addDays(today, SETTINGS.max_advance_days),
  };
}

export interface RangeValidation {
  ok: boolean;
  message?: string;
}

export function validateRange(
  pickupDate: ISODate | null,
  returnDate: ISODate | null,
  today: ISODate = todayISO(),
): RangeValidation {
  if (!pickupDate || !returnDate) return { ok: false, message: "Chọn ngày nhận và ngày trả" };
  const { min, max } = bookingWindow(today);
  if (pickupDate < min) return { ok: false, message: "Ngày nhận không thể ở quá khứ" };
  if (returnDate > max)
    return { ok: false, message: `Chỉ nhận đặt trước tối đa ${SETTINGS.max_advance_days} ngày` };
  if (returnDate < pickupDate) return { ok: false, message: "Ngày trả phải sau ngày nhận" };
  const days = Math.max(1, diffDays(pickupDate, returnDate));
  if (days < SETTINGS.min_rental_days)
    return { ok: false, message: `Thuê tối thiểu ${SETTINGS.min_rental_days} ngày` };
  if (days > SETTINGS.max_rental_days)
    return {
      ok: false,
      message: `Thuê tối đa ${SETTINGS.max_rental_days} ngày — vượt mức này vui lòng liên hệ shop`,
    };
  return { ok: true };
}

/** Gợi ý ngày rảnh gần nhất khi khoảng ngày khách chọn đã hết đồ. */
export function suggestNextAvailableRange(
  variant: Variant,
  bookings: UnitBooking[],
  pickupDate: ISODate,
  days: number,
  cleanBufferDays: number,
  horizon = 45,
): { pickupDate: ISODate; returnDate: ISODate } | null {
  for (let offset = 1; offset <= horizon; offset++) {
    const nextPickup = addDays(pickupDate, offset);
    const nextReturn = addDays(nextPickup, days);
    if (countFreeUnits(variant, bookings, nextPickup, nextReturn, cleanBufferDays) > 0) {
      return { pickupDate: nextPickup, returnDate: nextReturn };
    }
  }
  return null;
}

export const AVAILABILITY_LABEL: Record<AvailabilityLevel, string> = {
  plenty: "Còn nhiều",
  limited: "Sắp hết",
  none: "Hết đồ",
  closed: "Không nhận",
};
