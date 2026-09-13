"use client";

import { useRef, useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Thư viện ảnh sản phẩm.
 * Desktop: bố cục biên tập — 1 ảnh lớn, 2 ảnh phụ, 1 ảnh tràn chiều ngang.
 * Mobile: vuốt ngang, có chỉ số ảnh hiện tại "2 / 5".
 */
export function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  }

  return (
    <>
      {/* Mobile — vuốt ngang */}
      <div className="relative md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((image) => (
            <div key={image.id} className="w-full shrink-0 snap-center">
              <ProductMedia image={image} ratio="3/4" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 right-3 bg-surface/90 px-2.5 py-1 text-[11px] tabular-nums tracking-[0.08em]">
          {index + 1} / {images.length}
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Ảnh ${i + 1}`}
              onClick={() => {
                trackRef.current?.scrollTo({ left: i * (trackRef.current?.clientWidth ?? 0), behavior: "smooth" });
              }}
              className={cn("h-0.5 w-6 transition-colors", i === index ? "bg-ink" : "bg-line")}
            />
          ))}
        </div>
      </div>

      {/* Desktop — bố cục biên tập */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <ProductMedia image={images[0]} ratio="5/7" className="animate-image-reveal" />
          </div>
          {images.slice(1, 3).map((image) => (
            <ProductMedia key={image.id} image={image} ratio="3/4" />
          ))}
          {images[3] && (
            <div className="col-span-2">
              <ProductMedia image={images[3]} ratio="16/9" label={name} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
