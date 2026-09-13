import { addDays, todayISO } from "@/lib/date";
import type { Promotion } from "@/lib/types";

/**
 * BR-50 — mã giảm giá có loại, giá trị, giảm tối đa, đơn tối thiểu, hiệu lực.
 * BR-51 — không cộng dồn nhiều mã, riêng 1 mã freeship được cộng với 1 mã giảm giá.
 * BR-12 — giảm giá CHỈ áp lên tiền thuê, không áp lên tiền cọc.
 */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SEN10",
    type: "percent",
    value: 10,
    maxDiscount: 300_000,
    minOrder: 800_000,
    description: "Giảm 10% tiền thuê, tối đa 300.000₫ cho đơn từ 800.000₫",
    endsAt: addDays(todayISO(), 45),
  },
  {
    code: "STYLE150",
    type: "fixed",
    value: 150_000,
    maxDiscount: null,
    minOrder: 1_000_000,
    description: "Giảm thẳng 150.000₫ tiền thuê cho đơn từ 1.000.000₫",
    endsAt: addDays(todayISO(), 20),
  },
  {
    code: "FREESHIP",
    type: "freeship",
    value: 0,
    maxDiscount: null,
    minOrder: 500_000,
    description: "Miễn phí giao nhận 2 chiều trong nội thành",
    endsAt: addDays(todayISO(), 60),
  },
  {
    code: "CUOI2026",
    type: "percent",
    value: 15,
    maxDiscount: 800_000,
    minOrder: 3_000_000,
    description: "Ưu đãi mùa cưới — giảm 15% tiền thuê, tối đa 800.000₫",
    endsAt: addDays(todayISO(), 90),
  },
];

export function findPromotion(code: string): Promotion | undefined {
  return PROMOTIONS.find((p) => p.code.toLowerCase() === code.trim().toLowerCase());
}
