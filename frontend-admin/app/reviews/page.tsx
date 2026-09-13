"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { IconCheck, IconStar } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, StatusChip, Tabs } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { getProduct } from "@/data/products";
import { REVIEWS } from "@/data/reviews";
import { formatDateTime } from "@/lib/date";
import type { Review } from "@/lib/types";
import { useSession } from "@/store/session";

type Tab = "pending" | "approved" | "rejected";

export default function ReviewsPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [decisions, setDecisions] = useState<Record<string, Tab>>({});
  const [replying, setReplying] = useState<Review | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const statusOf = (r: Review): Tab => decisions[r.id] ?? (r.status as Tab);
  const rows = useMemo(() => REVIEWS.filter((r) => statusOf(r) === tab), [tab, decisions]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session.can("catalog.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconStar width={22} height={22} />}
          title="Bạn không có quyền kiểm duyệt đánh giá"
          body="Kiểm duyệt nội dung khách gửi là quyền của Quản lý và Admin."
        />
      </div>
    );
  }

  function decide(r: Review, next: Tab) {
    setDecisions((p) => ({ ...p, [r.id]: next }));
    toast.push({
      tone: next === "approved" ? "success" : "warning",
      title: next === "approved" ? "Đã duyệt đánh giá" : "Đã từ chối đánh giá",
      body: `${r.author} · ${getProduct(r.productSlug)?.name ?? r.productSlug}`,
    });
  }

  return (
    <>
      <PageHeader
        title="Đánh giá"
        description="Chỉ khách có đơn đã hoàn tất mới gửi được đánh giá. Mọi nội dung và ảnh đều phải qua kiểm duyệt trước khi hiển thị công khai."
        breadcrumb={[{ label: "Catalog" }, { label: "Đánh giá" }]}
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "pending", label: "Chờ duyệt", count: REVIEWS.filter((r) => statusOf(r) === "pending").length },
            { key: "approved", label: "Đã duyệt", count: REVIEWS.filter((r) => statusOf(r) === "approved").length },
            { key: "rejected", label: "Từ chối", count: REVIEWS.filter((r) => statusOf(r) === "rejected").length },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCheck width={22} height={22} />}
            title={tab === "pending" ? "Không còn đánh giá chờ duyệt" : "Chưa có đánh giá nào"}
            body={
              tab === "pending"
                ? "Đánh giá mới của khách sẽ xuất hiện ở đây trong vòng vài phút sau khi gửi."
                : "Chuyển tab để xem các đánh giá khác."
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const product = getProduct(r.productSlug);
            const reply = replies[r.id] ?? r.reply?.content;
            return (
              <li key={r.id} className="card overflow-hidden">
                <div className="flex flex-wrap gap-4 p-4">
                  {product && <ProductMedia image={product.images[0]} ratio="3/4" className="w-14 shrink-0 rounded" />}

                  <div className="min-w-[240px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-medium">{r.author}</span>
                      <span className="text-[12px] text-warning">{"★".repeat(r.rating)}</span>
                      <span className="text-[11.5px] text-ink-3">{formatDateTime(r.createdAt)}</span>
                      {r.rating <= 3 && <StatusChip tone="warning">Điểm thấp</StatusChip>}
                    </div>

                    <p className="mt-1 text-[12px] text-ink-2">
                      {product?.name} · size {r.sizeWorn}
                      {r.heightCm ? ` · khách cao ${r.heightCm}cm` : ""} ·{" "}
                      <span className="num">{r.orderCode}</span>
                    </p>

                    <p className="mt-2.5 max-w-[80ch] text-[13px] leading-relaxed">{r.content}</p>

                    {r.photos.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {r.photos.map((p) => (
                          <ProductMedia key={p.id} image={p} ratio="1/1" className="h-16 w-16 rounded" />
                        ))}
                      </div>
                    )}

                    {reply && (
                      <div className="mt-3 rounded-md border-l-2 border-accent bg-surface-2 px-3 py-2">
                        <p className="label-xs mb-1">StyleRent phản hồi</p>
                        <p className="text-[12.5px] leading-relaxed text-ink-2">{reply}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    {statusOf(r) === "pending" ? (
                      <>
                        <button type="button" onClick={() => decide(r, "approved")} className="btn btn-sm">
                          Duyệt
                        </button>
                        <button type="button" onClick={() => decide(r, "rejected")} className="btn btn-danger btn-sm">
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <StatusChip tone={statusOf(r) === "approved" ? "success" : "danger"}>
                        {statusOf(r) === "approved" ? "Đang hiển thị" : "Đã ẩn"}
                      </StatusChip>
                    )}
                    <button type="button" onClick={() => setReplying(r)} className="btn btn-outline btn-sm">
                      {reply ? "Sửa phản hồi" : "Phản hồi"}
                    </button>
                    {product && (
                      <Link href={`/products/${product.slug}`} className="btn btn-ghost btn-sm">
                        Xem sản phẩm
                      </Link>
                    )}
                  </div>
                </div>

                {r.rating <= 3 && statusOf(r) === "pending" && (
                  <div className="border-t border-line px-4 py-2.5">
                    <Callout tone="warning">
                      Đánh giá điểm thấp thường liên quan tới vận hành (giao trễ, đồ chưa ủi). Nên phản hồi công khai
                      kèm hướng xử lý thay vì ẩn đi.
                    </Callout>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ReplyModal
        review={replying}
        initial={replying ? (replies[replying.id] ?? replying.reply?.content ?? "") : ""}
        onClose={() => setReplying(null)}
        onSave={(review, text) => {
          setReplies((p) => ({ ...p, [review.id]: text }));
          setReplying(null);
          toast.push({ tone: "success", title: "Đã lưu phản hồi", body: "Phản hồi hiển thị ngay dưới đánh giá của khách." });
        }}
      />
    </>
  );
}

function ReplyModal({
  review,
  initial,
  onClose,
  onSave,
}: {
  review: Review | null;
  initial: string;
  onClose: () => void;
  onSave: (review: Review, text: string) => void;
}) {
  const [text, setText] = useState(initial);

  if (!review) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Phản hồi đánh giá"
      description={`${review.author} · ${review.orderCode}`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" disabled={!text.trim()} onClick={() => onSave(review, text)} className="btn btn-sm">
            Đăng phản hồi
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="card card-pad bg-surface-2">
          <p className="text-[12px] text-warning">{"★".repeat(review.rating)}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{review.content}</p>
        </div>
        <div>
          <label className="field-label" htmlFor="reply">
            Nội dung phản hồi
          </label>
          <textarea
            id="reply"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="field"
            placeholder="Cảm ơn bạn đã chia sẻ. Shop đã ghi nhận và..."
          />
          <p className="field-hint">Phản hồi hiển thị công khai kèm tên shop, khách nhận được thông báo.</p>
        </div>
      </div>
    </Modal>
  );
}
