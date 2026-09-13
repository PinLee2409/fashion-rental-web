"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { IconStar } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState, Reveal, Stars } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMER } from "@/data/customer";
import { ORDERS } from "@/data/orders";
import { REVIEWS } from "@/data/reviews";
import { diffDays, formatDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";

interface Pending {
  orderCode: string;
  productSlug: string;
  productName: string;
  image: (typeof ORDERS)[number]["items"][number]["image"];
  size: string;
  color: string;
  returnDate: string;
  daysLeftToReview: number;
}

export default function MyReviewsPage() {
  const toast = useToast();
  const [drafting, setDrafting] = useState<Pending | null>(null);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);

  // BR-60 — chỉ đơn completed, mỗi sản phẩm 1 lần, trong 30 ngày sau khi hoàn tất
  const pending: Pending[] = ORDERS.filter((o) => o.status === "completed")
    .flatMap((order) =>
      order.items
        .filter((item) => !item.reviewed)
        .map((item) => ({
          orderCode: order.code,
          productSlug: item.productSlug,
          productName: item.productNameSnapshot,
          image: item.image,
          size: item.variantSnapshot.size,
          color: item.variantSnapshot.color,
          returnDate: order.returnDate,
          daysLeftToReview: 30 - diffDays(order.returnDate, todayISO()),
        })),
    )
    .filter((p) => p.daysLeftToReview > 0 && !submitted.includes(`${p.orderCode}-${p.productSlug}`));

  const mine = REVIEWS.filter((r) => r.author === CUSTOMER.name);

  return (
    <div className="space-y-14">
      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Chờ bạn đánh giá</h2>
          <p className="mt-2 max-w-[64ch] text-[13px] text-ink-2">
            Chỉ những đơn đã hoàn tất mới đánh giá được, trong vòng 30 ngày kể từ ngày trả đồ. Mỗi sản phẩm trong một
            đơn đánh giá một lần.
          </p>
        </Reveal>

        {pending.length === 0 ? (
          <p className="border-y border-line py-8 text-[13.5px] text-ink-2">
            Không còn món nào chờ đánh giá. Cảm ơn bạn đã chia sẻ cảm nhận.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {pending.map((item, i) => (
              <Reveal as="li" key={`${item.orderCode}-${item.productSlug}`} delay={i * 60} className="flex gap-4 py-5">
                <ProductMedia image={item.image} ratio="3/4" className="w-20 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/san-pham/${item.productSlug}`} className="link-line link-underline-in text-[14px]">
                    {item.productName}
                  </Link>
                  <p className="mt-1.5 text-[12.5px] text-ink-2">
                    {item.color} · Size {item.size} · đơn {item.orderCode}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Đã trả {formatDate(item.returnDate)} · còn {item.daysLeftToReview} ngày để đánh giá
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDrafting(item);
                    setRating(5);
                    setContent("");
                  }}
                  className="btn btn-sm btn-outline shrink-0 self-center"
                >
                  Viết đánh giá
                </button>
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Đánh giá của tôi</h2>
        </Reveal>

        {mine.length === 0 ? (
          <EmptyState
            title="Bạn chưa có đánh giá nào"
            body="Sau khi trả đồ, hãy chia sẻ cảm nhận để khách sau chọn size dễ hơn."
            action={{ label: "Xem đơn đã hoàn tất", href: "/tai-khoan/don-thue" }}
          />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {mine.map((review, i) => (
              <Reveal as="li" key={review.id} delay={i * 60} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Stars value={review.rating} size={13} />
                  <span className="text-[12px] text-ink-3">{formatDate(review.createdAt.slice(0, 10))}</span>
                </div>
                <Link
                  href={`/san-pham/${review.productSlug}`}
                  className="link-line link-underline-in mt-2.5 inline-block text-[14px]"
                >
                  {review.productSlug.replace(/-/g, " ")}
                </Link>
                <p className="mt-2.5 max-w-[68ch] text-[13.5px] leading-relaxed text-ink-2">{review.content}</p>
                <p className="mt-2 text-[11.5px] text-ink-3">
                  Đã duyệt và hiển thị công khai · đơn {review.orderCode}
                </p>
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* Viết đánh giá */}
      <Modal
        open={Boolean(drafting)}
        onClose={() => setDrafting(null)}
        title="Viết đánh giá"
        footer={
          <button
            type="button"
            disabled={content.trim().length < 10}
            onClick={() => {
              if (!drafting) return;
              setSubmitted((prev) => [...prev, `${drafting.orderCode}-${drafting.productSlug}`]);
              setDrafting(null);
              toast.push({
                tone: "success",
                title: "Đã gửi đánh giá",
                body: "Đánh giá sẽ hiển thị sau khi qua kiểm duyệt.",
              });
            }}
            className="btn btn-block"
          >
            Gửi đánh giá
          </button>
        }
      >
        {drafting && (
          <>
            <div className="flex gap-4">
              <ProductMedia image={drafting.image} ratio="3/4" className="w-20 shrink-0" />
              <div>
                <p className="text-[14px]">{drafting.productName}</p>
                <p className="mt-1.5 text-[12.5px] text-ink-2">
                  {drafting.color} · Size {drafting.size}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">Đơn {drafting.orderCode}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="field-label">Chấm điểm</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`${star} sao`}
                    className={cn("p-1 transition-colors", star <= rating ? "text-ink" : "text-ink-3")}
                  >
                    <IconStar width={22} height={22} filled={star <= rating} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="field-label" htmlFor="review-content">
                Cảm nhận của bạn
              </label>
              <textarea
                id="review-content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chất liệu thế nào, size có vừa không, chiều cao/cân nặng của bạn, shop giao đúng hẹn không..."
                className="field"
              />
              <p className="mt-2 text-[11.5px] text-ink-3">
                Tối thiểu 10 ký tự. Đánh giá và ảnh sẽ qua kiểm duyệt trước khi hiển thị công khai.
              </p>
            </div>

            <div className="mt-5 border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-ink-2">
              Kéo thả hoặc chọn ảnh bạn mặc thiết kế này (tuỳ chọn)
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
