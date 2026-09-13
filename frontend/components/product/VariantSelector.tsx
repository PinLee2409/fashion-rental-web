"use client";

import { productColors, productSizes } from "@/data/products";
import type { Product, VariantAvailability } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * `<VariantSelector>` — swatch màu + size.
 * Biến thể không còn cá thể rảnh trong khoảng ngày đang chọn sẽ bị gạch chéo
 * và không bấm được (S03: "✗ = hết đồ trong khoảng ngày này").
 */
export function VariantSelector({
  product,
  availability,
  size,
  color,
  onSizeChange,
  onColorChange,
  showSizeGuide,
  ready,
}: {
  product: Product;
  /** null khi khách chưa chọn ngày — lúc đó không disable gì cả */
  availability: Record<string, VariantAvailability> | null;
  size: string | null;
  color: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  showSizeGuide?: () => void;
  ready: boolean;
}) {
  const colors = productColors(product);
  const sizes = productSizes(product);

  const variantFor = (s: string, c: string) => product.variants.find((v) => v.size === s && v.color === c);

  const freeOf = (s: string, c: string): number | null => {
    const variant = variantFor(s, c);
    if (!variant) return 0;
    if (variant.unitCount === 0) return 0;
    if (!availability) return null;
    return availability[variant.id]?.freeUnits ?? 0;
  };

  const colorDisabled = (c: string) =>
    sizes.every((s) => {
      const free = freeOf(s, c);
      return free === 0;
    });

  const sizeDisabled = (s: string) => {
    if (!color) return false;
    return freeOf(s, color) === 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="field-label mb-0">
            Màu sắc{color && <span className="ml-2 normal-case tracking-normal text-ink">· {color}</span>}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {colors.map((c) => {
            const disabled = ready && colorDisabled(c.name);
            const active = color === c.name;
            return (
              <button
                key={c.name}
                type="button"
                disabled={disabled}
                onClick={() => onColorChange(c.name)}
                aria-label={`Màu ${c.name}${disabled ? " — hết đồ" : ""}`}
                aria-pressed={active}
                className={cn(
                  "group relative h-11 w-11 border transition-all duration-200 ease-luxe",
                  active ? "border-ink" : "border-line hover:border-ink-3",
                  disabled && "cursor-not-allowed opacity-45",
                )}
              >
                <span
                  className="absolute inset-[3px] block"
                  style={{ backgroundColor: c.hex, border: "1px solid rgba(0,0,0,0.06)" }}
                />
                {disabled && (
                  <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full text-ink">
                    <line x1="6" y1="38" x2="38" y2="6" stroke="currentColor" strokeWidth="1" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="field-label mb-0">Kích cỡ</p>
          {showSizeGuide && (
            <button
              type="button"
              onClick={showSizeGuide}
              className="link-line link-underline-in text-[11px] uppercase tracking-[0.12em] text-ink-2"
            >
              Bảng size
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((s) => {
            const disabled = ready && sizeDisabled(s);
            const active = size === s;
            const free = color ? freeOf(s, color) : null;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => onSizeChange(s)}
                aria-pressed={active}
                className={cn(
                  "relative min-w-[60px] border px-4 py-3 text-[13px] transition-all duration-200 ease-luxe",
                  active ? "border-ink bg-ink text-canvas" : "border-line hover:border-ink",
                  disabled && "cursor-not-allowed border-line bg-line-2/60 text-ink-3 hover:border-line",
                )}
              >
                <span className={cn(disabled && "line-through decoration-ink-3")}>{s}</span>
                {!disabled && free !== null && free <= 1 && free > 0 && (
                  <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-warning" />
                )}
              </button>
            );
          })}
        </div>
        {ready && (
          <p className="mt-2.5 text-[11.5px] text-ink-3">
            Gạch chéo = hết đồ trong khoảng ngày bạn chọn. Đổi ngày hoặc chọn màu khác để mở lại.
          </p>
        )}
      </div>
    </div>
  );
}
