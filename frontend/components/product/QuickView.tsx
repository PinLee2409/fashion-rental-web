"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AvailabilityBadge } from "@/components/product/AvailabilityBadge";
import { ProductMedia } from "@/components/product/ProductMedia";
import { PricingTiers } from "@/components/rental/PricingTiers";
import { IconHeart } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Stars } from "@/components/ui/Primitives";
import { bookingsForProduct } from "@/data/bookings";
import { cleanBufferFor } from "@/data/catalog";
import { productColors, productSizes } from "@/data/products";
import { productAvailability, productFreeUnits } from "@/lib/availability";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { fromPricePerDay, minDeposit } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRentalDates } from "@/store/rental-dates";
import { useWishlist } from "@/store/wishlist";

/** Xem nhanh — đủ thông tin quyết định, muốn chốt ngày thì sang trang chi tiết. */
export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { pickupDate, returnDate, hasRange, days } = useRentalDates();
  const wishlist = useWishlist();

  const availability = useMemo(() => {
    if (!product || !hasRange || !pickupDate || !returnDate) return null;
    return productAvailability(
      product,
      bookingsForProduct(product.slug),
      pickupDate,
      returnDate,
      cleanBufferFor(product.categorySlug),
    );
  }, [product, hasRange, pickupDate, returnDate]);

  const total = useMemo(() => {
    if (!product || !hasRange || !pickupDate || !returnDate) return null;
    return productFreeUnits(
      product,
      bookingsForProduct(product.slug),
      pickupDate,
      returnDate,
      cleanBufferFor(product.categorySlug),
    );
  }, [product, hasRange, pickupDate, returnDate]);

  if (!product) return null;
  const saved = wishlist.hydrated && wishlist.has(product.slug);

  return (
    <Modal open={Boolean(product)} onClose={onClose} width="max-w-[860px]">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductMedia image={product.images[0]} ratio="4/5" />

        <div className="flex flex-col">
          <p className="eyebrow text-ink-3">{product.brandLine}</p>
          <h2 className="display-3 mt-2">{product.name}</h2>

          <div className="mt-3 flex items-center gap-2.5">
            <Stars value={product.rating} size={13} />
            <span className="text-[12px] text-ink-2">
              {product.rating.toFixed(1).replace(".", ",")} · {product.reviewCount} đánh giá · đã thuê{" "}
              {product.rentalCount} lượt
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-[20px]">{formatVnd(fromPricePerDay(product.variants))}</span>
            <span className="text-[13px] text-ink-2">/ ngày</span>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-2">
            Cọc {formatVnd(minDeposit(product.variants))} — hoàn lại khi trả nguyên vẹn
          </p>

          <div className="mt-5">
            <PricingTiers variant={product.variants[0]} activeDays={hasRange ? days : undefined} />
          </div>

          {hasRange && total && (
            <div className="mt-5">
              <p className="text-[12.5px] text-ink-2">
                Cho {formatDate(pickupDate!)} → {formatDate(returnDate!)}
              </p>
              <AvailabilityBadge level={total.level} free={total.free} total={total.total} variant="block" className="mt-2" />
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <p className="field-label">Màu</p>
              <div className="flex flex-wrap gap-2">
                {productColors(product).map((c) => (
                  <span
                    key={c.name}
                    className="inline-flex items-center gap-2 border border-line px-2.5 py-1.5 text-[12px]"
                  >
                    <span className="h-3 w-3" style={{ backgroundColor: c.hex, border: "1px solid rgba(0,0,0,.08)" }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {productSizes(product).map((s) => {
                  const variantsOfSize = product.variants.filter((v) => v.size === s);
                  const free = availability
                    ? variantsOfSize.reduce((sum, v) => sum + (availability[v.id]?.freeUnits ?? 0), 0)
                    : variantsOfSize.reduce((sum, v) => sum + v.unitCount, 0);
                  return (
                    <span
                      key={s}
                      className={cn(
                        "border px-3 py-1.5 text-[12px]",
                        free > 0 ? "border-line" : "border-line bg-line-2 text-ink-3 line-through",
                      )}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
            <Link href={`/products/${product.slug}`} className="btn flex-1" onClick={onClose}>
              Chọn ngày & thuê
            </Link>
            <button
              type="button"
              onClick={() => wishlist.toggle(product.slug)}
              className={cn("btn btn-outline px-4", saved && "border-accent text-accent")}
              aria-label="Lưu vào yêu thích"
            >
              <IconHeart width={16} height={16} filled={saved} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
