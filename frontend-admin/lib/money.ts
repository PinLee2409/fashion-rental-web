/**
 * Định dạng tiền VNĐ.
 * Tự nhóm hàng nghìn bằng dấu chấm để kết quả tuyệt đối giống nhau
 * giữa server (Node) và client (browser) — tránh lệch hydration do ICU.
 */
export function formatVnd(amount: number, opts: { sign?: boolean; symbol?: boolean } = {}): string {
  const { sign = false, symbol = true } = opts;
  const rounded = Math.round(amount);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  let grouped = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += ".";
    grouped += digits[i];
  }
  const prefix = negative ? "−" : sign && rounded > 0 ? "+" : "";
  return `${prefix}${grouped}${symbol ? "₫" : ""}`;
}

/** "350.000₫ / ngày" */
export function formatPerDay(amount: number): string {
  return `${formatVnd(amount)} / ngày`;
}

/** Rút gọn cho chip, badge: 1.650.000₫ → 1,65 triệu */
export function formatCompactVnd(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const text = Number.isInteger(m) ? String(m) : m.toFixed(2).replace(/0$/, "").replace(".", ",");
    return `${text} triệu`;
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return formatVnd(amount);
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
