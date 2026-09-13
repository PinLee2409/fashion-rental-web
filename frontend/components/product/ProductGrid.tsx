"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { QuickView } from "@/components/product/QuickView";
import { ProductCardSkeleton, Reveal } from "@/components/ui/Primitives";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  loading,
  columns = 4,
  skeletonCount = 8,
  className,
}: {
  products: Product[];
  loading?: boolean;
  columns?: 3 | 4;
  skeletonCount?: number;
  className?: string;
}) {
  const [quickView, setQuickView] = useState<Product | null>(null);

  const grid = cn(
    "grid gap-x-4 gap-y-12 sm:gap-x-5",
    "grid-cols-2 md:grid-cols-3",
    columns === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
    className,
  );

  if (loading) {
    return (
      <div className={grid}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={grid}>
        {products.map((product, i) => (
          <Reveal key={product.slug} as="div" delay={(i % 4) * 80}>
            <ProductCard product={product} onQuickView={setQuickView} />
          </Reveal>
        ))}
      </div>
      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}

/** Dải sản phẩm cuộn ngang — dùng ở trang chủ và khối "sản phẩm tương tự". */
export function ProductRail({ products }: { products: Product[] }) {
  const [quickView, setQuickView] = useState<Product | null>(null);

  return (
    <>
      <div className="no-scrollbar -mx-[clamp(1.25rem,4vw,4rem)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
        {products.map((product, i) => (
          <Reveal
            key={product.slug}
            as="div"
            delay={i * 70}
            className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-[32vw] lg:w-auto"
          >
            <ProductCard product={product} onQuickView={setQuickView} />
          </Reveal>
        ))}
      </div>
      <QuickView product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
