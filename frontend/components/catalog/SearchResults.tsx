"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { IconClose, IconSearch } from "@/components/ui/Icons";
import { EmptyState, Reveal } from "@/components/ui/Primitives";
import { CATEGORIES, OCCASIONS } from "@/data/catalog";
import { usePersistentState } from "@/hooks";
import { fromPricePerDay } from "@/lib/pricing";
import { searchProducts, suggestTerms } from "@/lib/search";
import { cn } from "@/lib/utils";

type SortKey = "lien-quan" | "gia-tang" | "gia-giam" | "danh-gia" | "thue-nhieu";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "lien-quan", label: "Liên quan nhất" },
  { key: "gia-tang", label: "Giá thuê thấp → cao" },
  { key: "gia-giam", label: "Giá thuê cao → thấp" },
  { key: "thue-nhieu", label: "Được thuê nhiều" },
  { key: "danh-gia", label: "Đánh giá cao" },
];

const TRENDING = ["áo dài cưới", "đầm dạ hội", "vest nam", "váy cưới", "đồ biểu diễn"];

export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const queryParam = params.get("q") ?? "";

  const [draft, setDraft] = useState(queryParam);
  const [sort, setSort] = useState<SortKey>("lien-quan");
  const [category, setCategory] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [recent, setRecent] = usePersistentState<string[]>("stylerent.recent-search.v1", []);

  // Ô nhập bám theo URL: quay lại / chia sẻ link đều hiện đúng từ khoá đã tìm.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(queryParam);
  }, [queryParam]);

  // Đổi từ khoá thì bỏ bộ lọc cũ — giữ lại chỉ gây kết quả rỗng khó hiểu.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setCategory(null);
    setOccasion(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [queryParam]);

  useEffect(() => {
    const cleaned = queryParam.trim();
    if (cleaned.length < 2) return;
    setRecent((prev) => [cleaned, ...prev.filter((r) => r !== cleaned)].slice(0, 6));
  }, [queryParam, setRecent]);

  const matched = useMemo(() => searchProducts(queryParam), [queryParam]);

  /** Danh mục & dịp chỉ liệt kê những giá trị thật sự có trong kết quả. */
  const facets = useMemo(() => {
    const cats = new Map<string, number>();
    const occs = new Map<string, number>();
    matched.forEach((p) => {
      cats.set(p.categorySlug, (cats.get(p.categorySlug) ?? 0) + 1);
      p.occasions.forEach((o) => occs.set(o, (occs.get(o) ?? 0) + 1));
    });
    return {
      categories: CATEGORIES.filter((c) => cats.has(c.slug)).map((c) => ({ ...c, count: cats.get(c.slug)! })),
      occasions: OCCASIONS.filter((o) => occs.has(o.slug)).map((o) => ({ ...o, count: occs.get(o.slug)! })),
    };
  }, [matched]);

  const results = useMemo(() => {
    let list = matched;
    if (category) list = list.filter((p) => p.categorySlug === category);
    if (occasion) list = list.filter((p) => p.occasions.includes(occasion));

    const sorted = [...list];
    switch (sort) {
      case "gia-tang":
        sorted.sort((a, b) => fromPricePerDay(a.variants) - fromPricePerDay(b.variants));
        break;
      case "gia-giam":
        sorted.sort((a, b) => fromPricePerDay(b.variants) - fromPricePerDay(a.variants));
        break;
      case "thue-nhieu":
        sorted.sort((a, b) => b.rentalCount - a.rentalCount);
        break;
      case "danh-gia":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return sorted;
  }, [matched, category, occasion, sort]);

  const suggestions = useMemo(
    () => (matched.length === 0 ? suggestTerms(queryParam) : []),
    [matched.length, queryParam],
  );

  function submit(term: string) {
    const cleaned = term.trim();
    router.push(cleaned ? `/search?q=${encodeURIComponent(cleaned)}` : "/search");
  }

  const hasQuery = queryParam.trim().length >= 2;

  return (
    <div className="pt-[76px]">
      {/* ------------------------------------------------------- ô tìm kiếm -- */}
      <header className="shell border-b border-line py-12">
        <Reveal>
          <p className="eyebrow text-ink-3">Tìm kiếm</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="mt-5 flex items-center gap-3 border-b border-ink pb-3"
          >
            <IconSearch className="shrink-0 text-ink-3" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tìm trang phục, chất liệu, danh mục hoặc dịp..."
              aria-label="Từ khoá tìm kiếm"
              className="min-w-0 flex-1 bg-transparent text-[clamp(1.1rem,2.6vw,1.6rem)] outline-none placeholder:text-ink-3"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  submit("");
                }}
                aria-label="Xoá từ khoá"
                className="shrink-0 p-1.5 text-ink-3 transition-colors hover:text-ink"
              >
                <IconClose width={16} height={16} />
              </button>
            )}
            <button type="submit" className="btn btn-sm shrink-0">
              Tìm
            </button>
          </form>

          {hasQuery && (
            <p className="lede mt-5">
              {results.length > 0
                ? `${results.length} kết quả cho “${queryParam}”`
                : `Không có kết quả nào cho “${queryParam}”`}
            </p>
          )}
        </Reveal>
      </header>

      {/* -------------------------------------------- chưa nhập gì: gợi mở -- */}
      {!hasQuery ? (
        <div className="shell grid gap-12 py-14 md:grid-cols-3">
          <Reveal>
            <p className="eyebrow text-ink-3">Tìm gần đây</p>
            {recent.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-ink-2">Chưa có lượt tìm nào.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {recent.map((term) => (
                  <li key={term}>
                    <button type="button" onClick={() => submit(term)} className="link-line link-underline-in text-[14px]">
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {recent.length > 0 && (
              <button
                type="button"
                onClick={() => setRecent([])}
                className="mt-6 text-[11.5px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-danger"
              >
                Xoá lịch sử
              </button>
            )}
          </Reveal>

          <Reveal delay={80}>
            <p className="eyebrow text-ink-3">Danh mục phổ biến</p>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} className="link-line link-underline-in text-[14px]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={160}>
            <p className="eyebrow text-ink-3">Đang được tìm nhiều</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TRENDING.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => submit(term)}
                  className="border border-line px-3 py-2 text-[12.5px] transition-colors hover:border-ink"
                >
                  {term}
                </button>
              ))}
            </div>
            <p className="eyebrow mt-9 text-ink-3">Theo dịp</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Link
                  key={o.slug}
                  href={`/collections/tat-ca?occasion=${o.slug}`}
                  className="border border-line px-3 py-2 text-[12.5px] transition-colors hover:border-ink"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      ) : matched.length === 0 ? (
        /* ------------------------------------------- không có kết quả nào -- */
        <div className="shell py-6">
          <EmptyState
            icon={<IconSearch width={30} height={30} />}
            title={`Không tìm thấy “${queryParam}”`}
            body="Thử từ khoá ngắn hơn, bỏ dấu, hoặc duyệt theo danh mục và dịp sử dụng."
          />
          {suggestions.length > 0 && (
            <div className="mx-auto -mt-10 max-w-[52ch] pb-16 text-center">
              <p className="eyebrow text-ink-3">Có phải bạn muốn tìm</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => submit(term)}
                    className="border border-line px-3.5 py-2 text-[12.5px] transition-colors hover:border-ink"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* -------------------------------------------------- có kết quả -- */
        <div className="shell py-10">
          {/* Lọc thu hẹp + sắp xếp. Chip xuống hàng chứ không cuộn ngang ẩn. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-line pb-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {facets.categories.map((c) => (
                <FacetChip
                  key={c.slug}
                  active={category === c.slug}
                  count={c.count}
                  onClick={() => setCategory(category === c.slug ? null : c.slug)}
                >
                  {c.name}
                </FacetChip>
              ))}
              {facets.occasions.map((o) => (
                <FacetChip
                  key={o.slug}
                  active={occasion === o.slug}
                  count={o.count}
                  onClick={() => setOccasion(occasion === o.slug ? null : o.slug)}
                >
                  {o.name}
                </FacetChip>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <label className="sr-only" htmlFor="search-sort">
                Sắp xếp
              </label>
              <select
                id="search-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="border border-line bg-surface px-3 py-2 text-[12.5px] outline-none transition-colors hover:border-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-10">
            {results.length === 0 ? (
              <EmptyState
                title="Bộ lọc này không còn món nào"
                body="Bỏ bớt danh mục hoặc dịp đang chọn để xem lại toàn bộ kết quả."
                onAction={{
                  label: "Bỏ bộ lọc",
                  run: () => {
                    setCategory(null);
                    setOccasion(null);
                  },
                }}
              />
            ) : (
              <ProductGrid products={results} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FacetChip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 border px-3 py-1.5 text-[12.5px] transition-colors",
        active ? "border-ink bg-ink text-canvas" : "border-line text-ink-2 hover:border-ink hover:text-ink",
      )}
    >
      {children}
      <span className={cn("tabular-nums text-[11px]", active ? "text-canvas/60" : "text-ink-3")}>{count}</span>
    </button>
  );
}
