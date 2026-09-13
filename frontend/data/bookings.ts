import { addDays, todayISO } from "@/lib/date";
import type { UnitBooking } from "@/lib/types";
import { hashString, seededRandom } from "@/lib/utils";
import { PRODUCTS } from "./products";

/**
 * Lịch bận mô phỏng — bảng `bookings` ở cấp cá thể (`rental_units`).
 * Sinh bằng PRNG có seed nên server và client luôn ra cùng một kết quả.
 * Availability engine (lib/availability.ts) cộng thêm buffer giặt ủi theo danh mục (BR-02).
 */
function buildBookings(): UnitBooking[] {
  const today = todayISO();
  const out: UnitBooking[] = [];

  for (const product of PRODUCTS) {
    const busyProduct = product.rentalCount > 90;
    for (const variant of product.variants) {
      for (let unitIndex = 0; unitIndex < variant.unitCount; unitIndex++) {
        const rnd = seededRandom(hashString(`${variant.id}#${unitIndex}`));
        const unitCode = `${variant.barcode}-${String(unitIndex + 1).padStart(3, "0")}`;
        const bookingCount = busyProduct ? 2 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 2);

        let cursor = Math.floor(rnd() * 12) - 4;
        for (let i = 0; i < bookingCount; i++) {
          cursor += 2 + Math.floor(rnd() * 13);
          if (cursor > 72) break;
          const duration = 1 + Math.floor(rnd() * 5);
          out.push({
            variantId: variant.id,
            unitIndex,
            unitCode,
            pickupDate: addDays(today, cursor),
            returnDate: addDays(today, cursor + duration),
            status: rnd() > 0.25 ? "confirmed" : "held",
          });
          cursor += duration + 2;
        }
      }
    }
  }

  return out;
}

export const BOOKINGS: UnitBooking[] = buildBookings();

const BY_VARIANT: Record<string, UnitBooking[]> = BOOKINGS.reduce(
  (acc, booking) => {
    (acc[booking.variantId] ??= []).push(booking);
    return acc;
  },
  {} as Record<string, UnitBooking[]>,
);

export function bookingsForVariant(variantId: string): UnitBooking[] {
  return BY_VARIANT[variantId] ?? [];
}

export function bookingsForProduct(productSlug: string): UnitBooking[] {
  const product = PRODUCTS.find((p) => p.slug === productSlug);
  if (!product) return [];
  return product.variants.flatMap((v) => bookingsForVariant(v.id));
}
