"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { IconHeart } from "@/components/ui/Icons";
import { EmptyState, ProductCardSkeleton, Reveal } from "@/components/ui/Primitives";
import { PRODUCTS } from "@/data/products";
import { useMounted } from "@/hooks";
import { useWishlist } from "@/store/wishlist";

export default function WishlistPage() {
  const mounted = useMounted();
  const wishlist = useWishlist();
  const products = PRODUCTS.filter((p) => wishlist.slugs.includes(p.slug));

  return (
    <div className="pt-[76px]">
      <header className="shell border-b border-line py-12">
        <Reveal>
          <p className="eyebrow text-ink-3">Bộ sưu tập của bạn</p>
          <h1 className="display-2 mt-3">Yêu thích</h1>
          <p className="lede mt-4 max-w-[56ch]">
            Những thiết kế bạn đã lưu. Khi tới dịp cần dùng, chọn ngày là biết ngay còn hay hết.
          </p>
        </Reveal>
      </header>

      <div className="shell py-12">
        {!mounted || !wishlist.hydrated ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<IconHeart width={30} height={30} />}
            title="Danh sách yêu thích đang trống"
            body="Lưu lại những thiết kế bạn thích, quay lại khi tới dịp cần dùng."
            action={{ label: "Khám phá bộ sưu tập", href: "/collections/tat-ca" }}
          />
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-ink-2">{products.length} thiết kế đã lưu</p>
              <button
                type="button"
                onClick={wishlist.clear}
                className="text-[11.5px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-danger"
              >
                Xoá tất cả
              </button>
            </div>
            <ProductGrid products={products} />
          </>
        )}
      </div>
    </div>
  );
}
