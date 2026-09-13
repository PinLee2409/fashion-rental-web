"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AvailabilityBadge } from "@/components/product/AvailabilityBadge";
import { ProductMedia } from "@/components/product/ProductMedia";
import { IconHeart } from "@/components/ui/Icons";
import { Chip, Stars } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { bookingsForProduct } from "@/data/bookings";
import { cleanBufferFor } from "@/data/catalog";
import { useMounted } from "@/hooks";
import { productFreeUnits } from "@/lib/availability";
import { formatVnd } from "@/lib/money";
import { fromPricePerDay, minDeposit } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRentalDates } from "@/store/rental-dates";
import { useWishlist } from "@/store/wishlist";

export function ProductCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
}) {
  const mounted = useMounted();
  const { pickupDate, returnDate, hasRange } = useRentalDates();
  const wishlist = useWishlist();
  const toast = useToast();
  const [hovered, setHovered] = useState(false);

  const availability = useMemo(() => {
    if (!hasRange || !pickupDate || !returnDate) return null;
    return productFreeUnits(
      product,
      bookingsForProduct(product.slug),
      pickupDate,
      returnDate,
      cleanBufferFor(product.categorySlug),
    );
  }, [product, hasRange, pickupDate, returnDate]);

  const price = fromPricePerDay(product.variants);
  const deposit = minDeposit(product.variants);
  const saved = wishlist.hydrated && wishlist.has(product.slug);
  const secondary = product.images[1] ?? product.images[0];

  return (
    <article
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-warm">
          <ProductMedia image={product.images[0]} ratio="3/4" />
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-luxe",
              hovered ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          >
            <ProductMedia image={secondary} ratio="3/4" />
          </div>

          <div className="pointer-events-none absolute left-0 top-0 flex flex-col items-start gap-1.5 p-3">
            {product.isNew && <Chip tone="ink">Mới về</Chip>}
            {mounted && availability?.level === "limited" && <Chip tone="warning">Sắp hết</Chip>}
            {mounted && availability?.level === "none" && <Chip tone="danger">Hết đồ</Chip>}
          </div>

          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className={cn(
                "absolute inset-x-3 bottom-3 hidden bg-surface/95 py-3 text-[10.5px] font-medium uppercase tracking-[0.16em] transition-all duration-300 ease-luxe md:block",
                hovered ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              Xem nhanh
            </button>
          )}
        </div>
      </Link>

      <button
        type="button"
        aria-label={saved ? "Bỏ khỏi yêu thích" : "Lưu vào yêu thích"}
        onClick={() => {
          const added = wishlist.toggle(product.slug);
          toast.push({
            tone: "success",
            title: added ? "Đã lưu vào Yêu thích" : "Đã bỏ khỏi Yêu thích",
            body: product.name,
            action: added ? { label: "Xem danh sách", href: "/wishlist" } : undefined,
          });
        }}
        className={cn(
          "absolute right-3 top-3 grid h-9 w-9 place-items-center bg-surface/90 transition-all duration-300 ease-luxe",
          saved ? "text-accent opacity-100" : "text-ink opacity-0 group-hover:opacity-100",
          "max-md:opacity-100",
        )}
      >
        <IconHeart width={16} height={16} filled={saved} className={saved ? "animate-pop" : undefined} />
      </button>

      <div className="pt-4 transition-transform duration-500 ease-luxe group-hover:-translate-y-0.5">
        <p className="eyebrow text-ink-3">{product.brandLine}</p>
        <h3 className="mt-1.5 text-[14.5px] leading-snug">
          <Link href={`/products/${product.slug}`} className="link-line link-underline-in">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[14px]">{formatVnd(price)}</span>
          <span className="text-[12px] text-ink-2">/ ngày</span>
          <span className="text-[12px] text-ink-3">· cọc {formatVnd(deposit)}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Stars value={product.rating} size={12} />
          <span className="text-[11.5px] text-ink-3">
            {product.rating.toFixed(1).replace(".", ",")} · {product.reviewCount} đánh giá
          </span>
        </div>

        {mounted && availability && (
          <AvailabilityBadge
            level={availability.level}
            free={availability.free}
            total={availability.total}
            className="mt-2"
          />
        )}
      </div>
    </article>
  );
}
