import { MEN_CHART, WOMEN_CHART } from "@/data/products";

export type SizeChartRow = { size: string; bust: string; waist: string; hip: string; length: string };
export type SizeChartKey = "women" | "men";

export const SIZE_CHARTS: Record<SizeChartKey, { label: string; note: string; rows: SizeChartRow[] }> = {
  women: {
    label: "Nữ",
    note: "Áo dài, đầm dạ hội, váy cưới, áo khoác nữ.",
    rows: WOMEN_CHART,
  },
  men: {
    label: "Nam",
    note: "Vest, tuxedo, áo dài nam. Số đo lấy ngoài áo sơ mi.",
    rows: MEN_CHART,
  },
};

/** Ba vòng cơ bản người dùng nhập để nhận gợi ý. */
export interface BodyInput {
  bustCm?: number;
  waistCm?: number;
  hipCm?: number;
}

export interface SizeFit {
  size: string;
  /** Tổng độ lệch (cm) so với khoảng của size — 0 nghĩa là nằm trọn trong khoảng. */
  gap: number;
  /** Ghi chú cho từng vòng: vừa / rộng / chật. */
  notes: string[];
}

export interface SizeSuggestion {
  best: SizeFit | null;
  /** Size lớn hơn liền kề, gợi ý khi số đo nằm giữa hai size. */
  alternative: SizeFit | null;
  /** Số vòng người dùng đã nhập — dưới 2 thì chưa đủ để gợi ý. */
  provided: number;
}

const LABEL: Record<keyof BodyInput, string> = {
  bustCm: "Vòng 1",
  waistCm: "Vòng 2",
  hipCm: "Vòng 3",
};

const FIELD_TO_COLUMN: Record<keyof BodyInput, keyof SizeChartRow> = {
  bustCm: "bust",
  waistCm: "waist",
  hipCm: "hip",
};

/** "83 – 86" → [83, 86]; ô "—" của bảng Free trả về null. */
function parseRange(text: string): [number, number] | null {
  const nums = text.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map((n) => Number(n.replace(",", ".")));
  return [values[0], values[values.length - 1]];
}

/**
 * Gợi ý size từ số đo.
 *
 * Quy tắc theo đúng lời khuyên trên trang chính sách: số đo nằm giữa hai size
 * thì chọn size lớn hơn — shop kẹp lai / chỉnh nhẹ được, chứ chật thì không cứu
 * được. Vì vậy khi có size chật (`gap` do vượt cận trên) ta luôn kèm phương án
 * lớn hơn thay vì chỉ trả về một kết quả duy nhất.
 */
export function suggestSize(chart: SizeChartKey, body: BodyInput): SizeSuggestion {
  const rows = SIZE_CHARTS[chart].rows;
  const fields = (Object.keys(LABEL) as (keyof BodyInput)[]).filter(
    (k) => typeof body[k] === "number" && Number.isFinite(body[k]) && (body[k] as number) > 0,
  );

  if (fields.length < 2) return { best: null, alternative: null, provided: fields.length };

  const fits: SizeFit[] = rows.map((row) => {
    let gap = 0;
    const notes: string[] = [];

    fields.forEach((field) => {
      const range = parseRange(String(row[FIELD_TO_COLUMN[field]]));
      const value = body[field] as number;
      if (!range) return;
      const [min, max] = range;
      if (value < min) {
        gap += min - value;
        notes.push(`${LABEL[field]} rộng ${Math.round((min - value) * 10) / 10}cm`);
      } else if (value > max) {
        // Chật khó chịu hơn rộng nên tính trọng số gấp đôi.
        gap += (value - max) * 2;
        notes.push(`${LABEL[field]} chật ${Math.round((value - max) * 10) / 10}cm`);
      } else {
        notes.push(`${LABEL[field]} vừa`);
      }
    });

    return { size: row.size, gap: Math.round(gap * 10) / 10, notes };
  });

  const ranked = [...fits].sort((a, b) => a.gap - b.gap);
  const best = ranked[0] ?? null;
  if (!best) return { best: null, alternative: null, provided: fields.length };

  const bestIndex = rows.findIndex((r) => r.size === best.size);
  const tight = best.notes.some((n) => n.includes("chật"));
  const bigger = tight && bestIndex >= 0 && bestIndex < rows.length - 1 ? fits[bestIndex + 1] : null;

  return { best, alternative: bigger, provided: fields.length };
}

/** Cách đo từng vòng — hiển thị cạnh ô nhập để số đo khách tự đo đáng tin hơn. */
export const MEASURE_GUIDE: { key: keyof BodyInput; label: string; how: string }[] = [
  {
    key: "bustCm",
    label: "Vòng 1 (ngực)",
    how: "Đo quanh chỗ đầy nhất của ngực, thước song song sàn, không siết.",
  },
  {
    key: "waistCm",
    label: "Vòng 2 (eo)",
    how: "Đo quanh chỗ nhỏ nhất của eo, thường trên rốn khoảng 2cm.",
  },
  {
    key: "hipCm",
    label: "Vòng 3 (mông)",
    how: "Đo quanh chỗ đầy nhất của mông, hai chân khép lại.",
  },
];
