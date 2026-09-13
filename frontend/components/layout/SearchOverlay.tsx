"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { IconClose, IconSearch } from "@/components/ui/Icons";
import { FullOverlay } from "@/components/ui/Overlay";
import { CATEGORIES } from "@/data/catalog";
import { PRODUCTS } from "@/data/products";
import { usePersistentState } from "@/hooks";
import { formatVnd } from "@/lib/money";
import { fromPricePerDay } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { deaccent } from "@/lib/utils";
import { OCCASION_LINKS } from "./nav-data";

const TRENDING = ["áo dài cưới", "đầm dạ hội", "vest nam", "váy cưới", "đồ biểu diễn"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = usePersistentState<string[]>("stylerent.recent-search.v1", []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [open]);

  const results = useMemo<Product[]>(() => {
    const q = deaccent(query.trim());
    if (q.length < 2) return [];
    return PRODUCTS.filter((p) => {
      const haystack = deaccent(
        `${p.name} ${p.brandLine} ${p.material} ${p.categorySlug} ${p.occasions.join(" ")} ${p.description}`,
      );
      return q.split(/\s+/).every((token) => haystack.includes(token));
    }).slice(0, 6);
  }, [query]);

  function remember(term: string) {
    const cleaned = term.trim();
    if (cleaned.length < 2) return;
    setRecent((prev) => [cleaned, ...prev.filter((r) => r !== cleaned)].slice(0, 5));
  }

  return (
    <FullOverlay open={open} onClose={onClose}>
      <div className="border-b border-line">
        <div className="shell flex h-[76px] items-center gap-4">
          <IconSearch className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                remember(query);
                onClose();
              }
            }}
            placeholder="Tìm trang phục, dịp sử dụng, danh mục..."
            className="h-full flex-1 bg-transparent text-[17px] outline-none placeholder:text-ink-3"
            aria-label="Tìm kiếm"
          />
          <button type="button" onClick={onClose} aria-label="Đóng tìm kiếm" className="-mr-2 p-2 text-ink-2 hover:text-ink">
            <IconClose />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="shell py-10">
          {query.trim().length < 2 ? (
            <div className="grid gap-12 md:grid-cols-3">
              <div>
                <p className="eyebrow text-ink-3">Tìm gần đây</p>
                {recent.length === 0 ? (
                  <p className="mt-4 text-[13.5px] text-ink-2">Chưa có lượt tìm nào.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => setQuery(term)}
                          className="link-line link-underline-in text-[14px]"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="eyebrow text-ink-3">Danh mục phổ biến</p>
                <ul className="mt-4 space-y-2.5">
                  {CATEGORIES.slice(0, 6).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/danh-muc/${c.slug}`} onClick={onClose} className="link-line link-underline-in text-[14px]">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="eyebrow text-ink-3">Đang được tìm nhiều</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TRENDING.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="border border-line px-3 py-2 text-[12.5px] transition-colors hover:border-ink"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <p className="eyebrow mt-9 text-ink-3">Theo dịp</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {OCCASION_LINKS.slice(0, 5).map((o) => (
                    <Link
                      key={o.slug}
                      href={o.href}
                      onClick={onClose}
                      className="border border-line px-3 py-2 text-[12.5px] transition-colors hover:border-ink"
                    >
                      {o.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="display-3">Không tìm thấy “{query}”</p>
              <p className="lede mx-auto mt-4 max-w-[46ch] text-[14px]">
                Thử từ khoá ngắn hơn, hoặc duyệt theo danh mục và dịp sử dụng.
              </p>
              <Link href="/danh-muc/tat-ca" onClick={onClose} className="btn btn-outline mt-8">
                Xem toàn bộ bộ sưu tập
              </Link>
            </div>
          ) : (
            <div>
              <p className="eyebrow text-ink-3">{results.length} kết quả</p>
              <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/san-pham/${product.slug}`}
                    onClick={() => {
                      remember(query);
                      onClose();
                    }}
                    className="group flex gap-4"
                  >
                    <ProductMedia image={product.images[0]} ratio="3/4" className="w-24 shrink-0" />
                    <div className="min-w-0 flex-1 py-1">
                      <p className="eyebrow text-ink-3">{product.brandLine}</p>
                      <p className="mt-1.5 text-[14px] leading-snug">{product.name}</p>
                      <p className="mt-1.5 text-[12.5px] text-ink-2">
                        {formatVnd(fromPricePerDay(product.variants))} / ngày
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </FullOverlay>
  );
}
