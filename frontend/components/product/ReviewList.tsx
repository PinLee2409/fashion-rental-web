"use client";

import { useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { Reveal, Stars } from "@/components/ui/Primitives";
import { formatDate } from "@/lib/date";
import type { Review } from "@/lib/types";

/**
 * Khối đánh giá trên PDP.
 * BR-60: chỉ khách có đơn đã hoàn tất chứa sản phẩm này mới đánh giá được —
 * nên ở đây không có nút "viết đánh giá" cho khách vãng lai.
 */
export function ReviewList({
  reviews,
  rating,
  reviewCount,
  breakdown,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  breakdown: { stars: number; count: number; ratio: number }[];
}) {
  const [visible, setVisible] = useState(3);

  return (
    <div className="grid min-w-0 gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
      <Reveal>
        <h2 className="display-3">Đánh giá</h2>
        <div className="mt-6 flex items-end gap-4">
          <span className="font-display text-[52px] leading-none">{rating.toFixed(1).replace(".", ",")}</span>
          <div className="pb-1.5">
            <Stars value={rating} size={14} />
            <p className="mt-1 text-[12.5px] text-ink-2">{reviewCount} đánh giá</p>
          </div>
        </div>

        <ul className="mt-7 space-y-2">
          {breakdown.map((row) => (
            <li key={row.stars} className="flex items-center gap-3 text-[12px] text-ink-2">
              <span className="w-3 tabular-nums">{row.stars}</span>
              <span className="h-1 flex-1 bg-line">
                <span
                  className="block h-full bg-ink transition-[width] duration-700 ease-luxe"
                  style={{ width: `${Math.round(row.ratio * 100)}%` }}
                />
              </span>
              <span className="w-5 text-right tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>

        <p className="mt-7 border-t border-line pt-5 text-[12px] leading-relaxed text-ink-3">
          Chỉ khách đã hoàn tất đơn thuê sản phẩm này mới gửi được đánh giá, trong vòng 30 ngày sau khi trả đồ. Mọi
          đánh giá đều qua kiểm duyệt trước khi hiển thị.
        </p>
      </Reveal>

      <div className="min-w-0">
        {reviews.length === 0 ? (
          <p className="text-[14px] text-ink-2">
            Chưa có đánh giá nào cho thiết kế này. Bạn sẽ là người đầu tiên sau khi hoàn tất đơn thuê.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-line border-t border-line">
              {reviews.slice(0, visible).map((review, i) => (
                <Reveal as="li" key={review.id} delay={i * 70} className="py-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Stars value={review.rating} size={13} />
                      <span className="text-[13.5px]">{review.author}</span>
                    </div>
                    <span className="text-[12px] text-ink-3">{formatDate(review.createdAt.slice(0, 10))}</span>
                  </div>

                  <p className="mt-1.5 text-[12px] text-ink-3">
                    Đã thuê size {review.sizeWorn}
                    {review.heightCm ? ` · cao ${review.heightCm}cm` : ""} · đơn {review.orderCode}
                  </p>

                  <p className="mt-3.5 max-w-[68ch] text-[14px] leading-relaxed">{review.content}</p>

                  {review.photos.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {review.photos.map((photo) => (
                        <ProductMedia key={photo.id} image={photo} ratio="1/1" className="w-24" />
                      ))}
                    </div>
                  )}

                  {review.reply && (
                    <div className="mt-4 border-l border-line bg-warm px-4 py-3">
                      <p className="eyebrow text-ink-3">StyleRent phản hồi</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{review.reply.content}</p>
                    </div>
                  )}
                </Reveal>
              ))}
            </ul>

            {visible < reviews.length && (
              <button type="button" onClick={() => setVisible((v) => v + 3)} className="btn btn-outline mt-8">
                Xem thêm đánh giá
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
