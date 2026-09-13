"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { RentalDatePicker } from "@/components/rental/RentalDatePicker";
import { IconCalendar, IconClose } from "@/components/ui/Icons";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { EmptyState, Reveal } from "@/components/ui/Primitives";
import { BOOKINGS } from "@/data/bookings";
import { CATEGORIES, cleanBufferFor, OCCASIONS, sortSizes } from "@/data/catalog";
import type { Collection } from "@/data/collections";
import { productFreeUnits } from "@/lib/availability";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { fromPricePerDay } from "@/lib/pricing";
import { SETTINGS } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks";
import { useRentalDates } from "@/store/rental-dates";

type SortKey = "goi-y" | "moi-nhat" | "gia-tang" | "gia-giam" | "danh-gia" | "thue-nhieu";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "goi-y", label: "Gợi ý cho bạn" },
  { key: "moi-nhat", label: "Mới nhất" },
  { key: "gia-tang", label: "Giá thuê thấp → cao" },
  { key: "gia-giam", label: "Giá thuê cao → thấp" },
  { key: "thue-nhieu", label: "Được thuê nhiều" },
  { key: "danh-gia", label: "Đánh giá cao" },
];

const PRICE_BANDS = [
  { key: "d1", label: "Dưới 250.000₫", min: 0, max: 250_000 },
  { key: "d2", label: "250.000 – 400.000₫", min: 250_000, max: 400_000 },
  { key: "d3", label: "400.000 – 700.000₫", min: 400_000, max: 700_000 },
  { key: "d4", label: "Trên 700.000₫", min: 700_000, max: Number.MAX_SAFE_INTEGER },
];

const PAGE_SIZE = 8;

export function CatalogView({ collection }: { collection: Collection }) {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const { pickupDate, returnDate, hasRange, days, setRange, clear } = useRentalDates();

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [bands, setBands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortKey>("goi-y");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dịp lấy từ query `?occasion=` — giữ nguyên cách lọc của API /products?occasion=
  useEffect(() => {
    const dip = searchParams.get("occasion");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOccasions(dip ? [dip] : []);
  }, [searchParams]);

  // Mô phỏng gọi API danh sách để có trạng thái skeleton thật
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 340);
    return () => clearTimeout(id);
  }, [collection.slug, sizes, colors, occasions, bands, categories, onlyAvailable, sort, pickupDate, returnDate]);

  const allSizes = useMemo(
    () => sortSizes([...new Set(collection.products.flatMap((p) => p.variants.map((v) => v.size)))]),
    [collection.products],
  );
  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    collection.products.forEach((p) => p.variants.forEach((v) => map.set(v.color, v.colorHex)));
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [collection.products]);
  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => collection.products.some((p) => p.categorySlug === c.slug)),
    [collection.products],
  );

  const filtered = useMemo(() => {
    let list = collection.products.filter((product) => {
      if (categories.length && !categories.includes(product.categorySlug)) return false;
      if (occasions.length && !product.occasions.some((o) => occasions.includes(o))) return false;
      if (sizes.length && !product.variants.some((v) => sizes.includes(v.size) && v.unitCount > 0)) return false;
      if (colors.length && !product.variants.some((v) => colors.includes(v.color) && v.unitCount > 0)) return false;
      if (bands.length) {
        const price = fromPricePerDay(product.variants);
        const inBand = bands.some((key) => {
          const band = PRICE_BANDS.find((b) => b.key === key)!;
          return price >= band.min && price < band.max;
        });
        if (!inBand) return false;
      }
      if (onlyAvailable && hasRange && pickupDate && returnDate) {
        const { free } = productFreeUnits(
          product,
          BOOKINGS,
          pickupDate,
          returnDate,
          cleanBufferFor(product.categorySlug),
          { sizes, colors },
        );
        if (free <= 0) return false;
      }
      return true;
    });

    list = [...list];
    switch (sort) {
      case "moi-nhat":
        list.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case "gia-tang":
        list.sort((a, b) => fromPricePerDay(a.variants) - fromPricePerDay(b.variants));
        break;
      case "gia-giam":
        list.sort((a, b) => fromPricePerDay(b.variants) - fromPricePerDay(a.variants));
        break;
      case "thue-nhieu":
        list.sort((a, b) => b.rentalCount - a.rentalCount);
        break;
      case "danh-gia":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rentalCount - a.rentalCount);
    }
    return list;
  }, [collection.products, categories, occasions, sizes, colors, bands, onlyAvailable, hasRange, pickupDate, returnDate, sort]);

  const activeFilters = [
    ...categories.map((slug) => ({
      label: CATEGORIES.find((c) => c.slug === slug)?.name ?? slug,
      clear: () => setCategories((p) => p.filter((s) => s !== slug)),
    })),
    ...occasions.map((slug) => ({
      label: OCCASIONS.find((o) => o.slug === slug)?.name ?? slug,
      clear: () => setOccasions((p) => p.filter((s) => s !== slug)),
    })),
    ...sizes.map((s) => ({ label: `Size ${s}`, clear: () => setSizes((p) => p.filter((x) => x !== s)) })),
    ...colors.map((c) => ({ label: c, clear: () => setColors((p) => p.filter((x) => x !== c)) })),
    ...bands.map((key) => ({
      label: PRICE_BANDS.find((b) => b.key === key)?.label ?? key,
      clear: () => setBands((p) => p.filter((x) => x !== key)),
    })),
    ...(onlyAvailable ? [{ label: "Chỉ hiện món còn trống", clear: () => setOnlyAvailable(false) }] : []),
  ];

  function resetAll() {
    setSizes([]);
    setColors([]);
    setOccasions([]);
    setBands([]);
    setCategories([]);
    setOnlyAvailable(false);
  }

  const filters = (
    <FilterPanel
      allSizes={allSizes}
      allColors={allColors}
      categories={availableCategories.map((c) => ({ slug: c.slug, name: c.name }))}
      showCategories={availableCategories.length > 1}
      selected={{ sizes, colors, occasions, bands, categories, onlyAvailable }}
      hasRange={hasRange}
      toggle={{
        size: (s: string) => setSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s])),
        color: (c: string) => setColors((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])),
        occasion: (o: string) => setOccasions((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o])),
        band: (b: string) => setBands((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b])),
        category: (c: string) => setCategories((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])),
        available: () => setOnlyAvailable((v) => !v),
      }}
      onReset={resetAll}
    />
  );

  return (
    <div className="pt-[76px]">
      {/* Tiêu đề trang */}
      <header className="shell border-b border-line py-12 md:py-16">
        <Reveal>
          <nav className="eyebrow text-ink-3">
            <Link href="/" className="link-line link-underline-in">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span>{collection.eyebrow}</span>
          </nav>
          <h1 className="display-2 mt-5 max-w-[18ch]">{collection.title}</h1>
          <p className="lede mt-5 max-w-[62ch]">{collection.description}</p>
        </Reveal>

        {collection.relatedCategories.length > 0 && (
          <Reveal delay={120} className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
            {collection.relatedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="shrink-0 border border-line px-4 py-2 text-[12.5px] transition-colors hover:border-ink"
              >
                {c.name}
              </Link>
            ))}
          </Reveal>
        )}
      </header>

      {/* Thanh chọn ngày + công cụ */}
      <div className="sticky top-[62px] z-20 border-b border-line bg-canvas/95 backdrop-blur-md">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-3.5">
          <button
            type="button"
            onClick={() => setDateOpen(true)}
            className="flex items-center gap-2.5 text-[13px] transition-colors hover:text-accent"
          >
            <IconCalendar width={16} height={16} />
            {mounted && hasRange ? (
              <span>
                {formatDate(pickupDate!)} → {formatDate(returnDate!)}
                <span className="ml-2 text-ink-2">· {days} ngày</span>
              </span>
            ) : (
              <span>Chọn ngày thuê để xem tình trạng còn/hết</span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-[12.5px] text-ink-2 sm:inline">
              {loading ? "Đang tải..." : `${filtered.length} sản phẩm`}
            </span>
            <label className="sr-only" htmlFor="sort">
              Sắp xếp
            </label>
            <select
              id="sort"
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
            <button type="button" onClick={() => setFilterOpen(true)} className="btn btn-quiet lg:hidden">
              Bộ lọc{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="shell grid gap-10 py-10 lg:grid-cols-[240px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-[130px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2">{filters}</div>
        </aside>

        <div>
          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {activeFilters.map((f, i) => (
                <button
                  key={`${f.label}-${i}`}
                  type="button"
                  onClick={f.clear}
                  className="inline-flex items-center gap-1.5 bg-warm px-3 py-1.5 text-[12px] transition-colors hover:bg-line-2"
                >
                  {f.label}
                  <IconClose width={12} height={12} />
                </button>
              ))}
              <button
                type="button"
                onClick={resetAll}
                className="link-line link-underline-in ml-1 text-[11px] uppercase tracking-[0.12em] text-ink-2"
              >
                Xoá tất cả
              </button>
            </div>
          )}

          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="Không có món nào khớp bộ lọc"
              body="Thử bỏ bớt một vài tiêu chí, hoặc đổi khoảng ngày thuê — nhiều món chỉ bận vài ngày rồi lại rảnh."
              onAction={{ label: "Xoá bộ lọc", run: resetAll }}
            />
          ) : (
            <>
              <ProductGrid products={filtered.slice(0, visible)} loading={loading} skeletonCount={PAGE_SIZE} />
              {!loading && visible < filtered.length && (
                <div className="mt-16 flex flex-col items-center gap-4">
                  <p className="text-[12.5px] text-ink-2">
                    Đang xem {Math.min(visible, filtered.length)} / {filtered.length} sản phẩm
                  </p>
                  <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn btn-outline">
                    Xem thêm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bộ lọc trên mobile */}
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Bộ lọc"
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={resetAll} className="btn btn-quiet flex-1">
              Xoá lọc
            </button>
            <button type="button" onClick={() => setFilterOpen(false)} className="btn flex-[2]">
              Xem {filtered.length} sản phẩm
            </button>
          </div>
        }
      >
        <div className="px-5 py-5">{filters}</div>
      </BottomSheet>

      <Modal open={dateOpen} onClose={() => setDateOpen(false)} title="Khoảng ngày thuê" width="max-w-[720px]">
        <RentalDatePicker
          variants={[]}
          bookings={[]}
          cleanBufferDays={SETTINGS.default_clean_buffer_days}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onChange={(from, to) => {
            setRange(from, to);
            if (from && to) setTimeout(() => setDateOpen(false), 220);
          }}
          legend={false}
        />
        <div className="mt-5 flex items-center justify-between">
          <p className="text-[12.5px] text-ink-2">Chọn ngày để thấy chính xác món nào còn rảnh.</p>
          {hasRange && (
            <button type="button" onClick={clear} className="link-line link-underline-in text-[11px] uppercase tracking-[0.12em]">
              Xoá ngày
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function FilterPanel({
  allSizes,
  allColors,
  categories,
  showCategories,
  selected,
  toggle,
  onReset,
  hasRange,
}: {
  allSizes: string[];
  allColors: { name: string; hex: string }[];
  categories: { slug: string; name: string }[];
  showCategories: boolean;
  selected: {
    sizes: string[];
    colors: string[];
    occasions: string[];
    bands: string[];
    categories: string[];
    onlyAvailable: boolean;
  };
  toggle: {
    size: (s: string) => void;
    color: (c: string) => void;
    occasion: (o: string) => void;
    band: (b: string) => void;
    category: (c: string) => void;
    available: () => void;
  };
  onReset: () => void;
  hasRange: boolean;
}) {
  return (
    <div className="space-y-8">
      <Group title="Tình trạng">
        <label className={cn("flex cursor-pointer items-start gap-2.5 text-[13px]", !hasRange && "opacity-50")}>
          <input
            type="checkbox"
            checked={selected.onlyAvailable}
            disabled={!hasRange}
            onChange={toggle.available}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#181818]"
          />
          <span>
            Chỉ hiện món còn trống
            {!hasRange && <span className="mt-0.5 block text-[11.5px] text-ink-3">Cần chọn ngày thuê trước</span>}
          </span>
        </label>
      </Group>

      {showCategories && (
        <Group title="Danh mục">
          <ul className="space-y-2.5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Checkbox
                  label={c.name}
                  checked={selected.categories.includes(c.slug)}
                  onChange={() => toggle.category(c.slug)}
                />
              </li>
            ))}
          </ul>
        </Group>
      )}

      <Group title="Kích cỡ">
        <div className="flex flex-wrap gap-1.5">
          {allSizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle.size(s)}
              className={cn(
                "min-w-[46px] border px-3 py-2 text-[12.5px] transition-colors",
                selected.sizes.includes(s) ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Màu sắc">
        <div className="space-y-2.5">
          {allColors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => toggle.color(c.name)}
              className="flex w-full items-center gap-2.5 text-left text-[13px]"
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center border",
                  selected.colors.includes(c.name) ? "border-ink" : "border-line",
                )}
              >
                <span className="h-3.5 w-3.5" style={{ backgroundColor: c.hex }} />
              </span>
              <span className={selected.colors.includes(c.name) ? "" : "text-ink-2"}>{c.name}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Giá thuê / ngày">
        <ul className="space-y-2.5">
          {PRICE_BANDS.map((b) => (
            <li key={b.key}>
              <Checkbox label={b.label} checked={selected.bands.includes(b.key)} onChange={() => toggle.band(b.key)} />
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Dịp sử dụng">
        <ul className="space-y-2.5">
          {OCCASIONS.map((o) => (
            <li key={o.slug}>
              <Checkbox
                label={o.name}
                checked={selected.occasions.includes(o.slug)}
                onChange={() => toggle.occasion(o.slug)}
              />
            </li>
          ))}
        </ul>
      </Group>

      <button
        type="button"
        onClick={onReset}
        className="link-line link-underline-in text-[11px] uppercase tracking-[0.12em] text-ink-2"
      >
        Đặt lại bộ lọc
      </button>

      <p className="border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-3">
        Giá hiển thị là giá thuê theo ngày, chưa gồm tiền cọc. Cọc từ {formatVnd(250_000)} tuỳ món và luôn được hoàn
        lại khi trả đồ nguyên vẹn.
      </p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3.5 text-ink-3">{title}</p>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-[#181818]" />
      <span className={checked ? "" : "text-ink-2"}>{label}</span>
    </label>
  );
}
