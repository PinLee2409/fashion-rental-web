import { CATEGORIES, OCCASIONS } from "@/data/catalog";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/lib/types";
import { deaccent } from "@/lib/utils";

/**
 * Tìm kiếm catalog — dùng chung cho lớp phủ tìm nhanh trên header và trang
 * `/search`. Không phân biệt dấu (deaccent) vì khách hay gõ "ao dai" thay vì
 * "áo dài", và mọi token trong câu đều phải khớp để "vest nam" không trả về
 * tất cả sản phẩm có chữ "nam".
 */
export function searchProducts(query: string): Product[] {
  const q = deaccent(query.trim());
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  return PRODUCTS.filter((p) => {
    const haystack = deaccent(
      [
        p.name,
        p.brandLine,
        p.material,
        p.categorySlug,
        CATEGORIES.find((c) => c.slug === p.categorySlug)?.name ?? "",
        p.occasions.join(" "),
        p.occasions.map((o) => OCCASIONS.find((x) => x.slug === o)?.name ?? "").join(" "),
        p.description,
        p.variants.map((v) => `${v.size} ${v.color}`).join(" "),
      ].join(" "),
    );
    return tokens.every((token) => haystack.includes(token));
  });
}

/**
 * Gợi ý khi không có kết quả: lấy những từ khoá trong catalog gần giống nhất với
 * câu người dùng gõ, để màn hình rỗng vẫn có đường đi tiếp thay vì ngõ cụt.
 */
export function suggestTerms(query: string, limit = 5): string[] {
  const q = deaccent(query.trim());
  if (!q) return [];

  const pool = new Set<string>();
  CATEGORIES.forEach((c) => pool.add(c.name));
  OCCASIONS.forEach((o) => pool.add(o.name));
  PRODUCTS.forEach((p) => pool.add(p.brandLine));

  return [...pool]
    .map((term) => ({ term, score: similarity(q, deaccent(term)) }))
    .filter((x) => x.score > 0.28)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.term);
}

/**
 * Độ giống nhau 0…1 theo hệ số Dice trên bigram — đủ tốt để bắt lỗi gõ sai một
 * hai ký tự ("dam da hoi" → "Đầm dạ hội") mà không cần thư viện ngoài.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  if (b.includes(a) || a.includes(b)) return 0.9;

  const bigrams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) ?? 0) + 1);
    }
    return out;
  };

  const ga = bigrams(a);
  const gb = bigrams(b);
  let hits = 0;
  ga.forEach((count, g) => {
    const other = gb.get(g);
    if (other) hits += Math.min(count, other);
  });

  const total = [...ga.values()].reduce((s, n) => s + n, 0) + [...gb.values()].reduce((s, n) => s + n, 0);
  return total === 0 ? 0 : (2 * hits) / total;
}
