/**
 * Ngày thuê được lưu dạng chuỗi `YYYY-MM-DD` (không kèm giờ) đúng như đặc tả:
 * "Ngày thuê lưu dạng date (không giờ) để tránh lệch ngày" — múi giờ hiển thị Asia/Ho_Chi_Minh.
 */
export type ISODate = string;

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const WEEKDAY_LONG = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse `YYYY-MM-DD` thành Date lúc 00:00 giờ địa phương. */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(iso: ISODate, months: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/** Số ngày giữa 2 mốc (b − a). */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * BR-10 — số_ngày = ceil(return_date − pickup_date), hoặc 1 nếu cùng ngày.
 * Ví dụ 12/10 → 15/10 = 3 ngày.
 */
export function rentalDays(pickup: ISODate, returnDate: ISODate): number {
  return Math.max(1, diffDays(pickup, returnDate));
}

export function isSameDay(a: ISODate, b: ISODate): boolean {
  return a === b;
}

export function isBefore(a: ISODate, b: ISODate): boolean {
  return a < b;
}

export function isAfter(a: ISODate, b: ISODate): boolean {
  return a > b;
}

export function isWithin(iso: ISODate, from: ISODate, to: ISODate): boolean {
  return iso >= from && iso <= to;
}

/** Hai khoảng chồng lấn — BR-03: a1 <= b2 AND b1 <= a2 */
export function overlaps(a1: ISODate, a2: ISODate, b1: ISODate, b2: ISODate): boolean {
  return a1 <= b2 && b1 <= a2;
}

/** "12/10/2026" */
export function formatDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "12/10" */
export function formatDateShort(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** "Thứ năm, 12/10/2026" */
export function formatDateLong(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${WEEKDAY_LONG[d.getDay()]}, ${formatDate(iso)}`;
}

/** "Tháng 10 / 2026" */
export function formatMonthTitle(iso: ISODate): string {
  const d = parseISODate(iso);
  return `Tháng ${d.getMonth() + 1} / ${d.getFullYear()}`;
}

/** "12/10 → 15/10 · 3 ngày" */
export function formatRange(pickup: ISODate, returnDate: ISODate): string {
  return `${formatDateShort(pickup)} → ${formatDateShort(returnDate)}`;
}

/** "12/10/2026 18:00" */
export function formatDateTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** "còn 2 ngày" / "quá hạn 1 ngày" / "hôm nay" */
export function describeDaysLeft(target: ISODate, from: ISODate = todayISO()): string {
  const d = diffDays(from, target);
  if (d === 0) return "hôm nay";
  if (d === 1) return "ngày mai";
  if (d > 1) return `còn ${d} ngày`;
  if (d === -1) return "quá hạn 1 ngày";
  return `quá hạn ${Math.abs(d)} ngày`;
}

/** Lưới 6 hàng × 7 cột cho 1 tháng, bắt đầu từ Thứ 2. */
export function monthGrid(monthAnchor: ISODate): ISODate[] {
  const anchor = parseISODate(monthAnchor);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  // getDay(): 0=CN → muốn 0=T2
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells: ISODate[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(toISODate(d));
  }
  return cells;
}

export function isSameMonth(iso: ISODate, monthAnchor: ISODate): boolean {
  return iso.slice(0, 7) === monthAnchor.slice(0, 7);
}

/** Đếm ngược mm:ss cho HoldTimer. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
