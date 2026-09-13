"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AvailabilityBadge } from "@/components/product/AvailabilityBadge";
import { ProductMedia } from "@/components/product/ProductMedia";
import { HoldTimer } from "@/components/rental/HoldTimer";
import { PriceBreakdown } from "@/components/rental/PriceBreakdown";
import { RentalDatePicker } from "@/components/rental/RentalDatePicker";
import { IconAlert, IconBag, IconClock, IconInfo } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState, Note, QuantityStepper, Reveal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { bookingsForProduct } from "@/data/bookings";
import { cleanBufferFor } from "@/data/catalog";
import { PROMOTIONS } from "@/data/promotions";
import { useMounted } from "@/hooks";
import { variantAvailability } from "@/lib/availability";
import { formatDate, rentalDays } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { SETTINGS } from "@/lib/settings";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const mounted = useMounted();
  const cart = useCart();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [expiredDialog, setExpiredDialog] = useState(false);

  const editingLine = cart.detailed.find((d) => d.line.id === editing) ?? null;

  const availabilityByLine = useMemo(() => {
    const map: Record<string, ReturnType<typeof variantAvailability>> = {};
    for (const item of cart.detailed) {
      map[item.line.id] = variantAvailability(
        item.variant,
        bookingsForProduct(item.product.slug),
        item.line.pickupDate,
        item.line.returnDate,
        cleanBufferFor(item.product.categorySlug),
      );
    }
    return map;
  }, [cart.detailed]);

  if (mounted && cart.detailed.length === 0) {
    return (
      <div className="pt-[76px]">
        <div className="shell py-12">
          <h1 className="display-2">Giỏ thuê của bạn</h1>
        </div>
        <EmptyState
          icon={<IconBag width={30} height={30} />}
          title="Giỏ thuê đang trống"
          body="Chọn khoảng ngày bạn cần, hệ thống sẽ chỉ hiện những món còn rảnh đúng ngày đó. Mỗi món thêm vào giỏ được giữ chỗ riêng trong 15 phút."
          action={{ label: "Khám phá bộ sưu tập", href: "/collections/tat-ca" }}
        />
      </div>
    );
  }

  return (
    <div className="pt-[76px]">
      <div className="shell py-12">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-3">Bước 1 / 3</p>
            <h1 className="display-2 mt-3">Giỏ thuê của bạn</h1>
          </div>
          {mounted && cart.holdExpiresAt && !cart.hasExpiredHold && (
            <HoldTimer expiresAt={cart.holdExpiresAt} onExpire={() => setExpiredDialog(true)} />
          )}
        </Reveal>
      </div>

      <div className="shell grid gap-10 pb-24 lg:grid-cols-[1fr_380px] lg:gap-16">
        {/* Danh sách dòng thuê */}
        <div>
          {cart.hasExpiredHold && (
            <Note tone="danger" icon={<IconAlert width={15} height={15} />}>
              Đã hết thời gian giữ chỗ cho một vài món. Hãy làm mới giữ chỗ để hệ thống kiểm tra lại lịch trống trước
              khi thanh toán.{" "}
              <button
                type="button"
                onClick={() => {
                  cart.renewHolds();
                  toast.push({ tone: "success", title: "Đã làm mới giữ chỗ", body: "Các món còn rảnh đã được giữ lại." });
                }}
                className="link-line link-underline-in ml-1 uppercase tracking-[0.1em]"
              >
                Làm mới giữ chỗ
              </button>
            </Note>
          )}

          <ul className="mt-6 divide-y divide-line border-y border-line">
            {cart.detailed.map(({ line, product, variant, days, rentalTotal, depositTotal, expired }, i) => {
              const availability = availabilityByLine[line.id];
              return (
                <Reveal as="li" key={line.id} delay={i * 60} className="flex gap-5 py-7">
                  <Link href={`/products/${product.slug}`} className="w-24 shrink-0 sm:w-32">
                    <ProductMedia image={product.images[0]} ratio="3/4" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                      <div className="min-w-0">
                        <p className="eyebrow text-ink-3">{product.brandLine}</p>
                        <h2 className="mt-1.5 text-[15px]">
                          <Link href={`/products/${product.slug}`} className="link-line link-underline-in">
                            {product.name}
                          </Link>
                        </h2>
                        <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-2">
                          <span
                            className="inline-block h-3 w-3"
                            style={{ backgroundColor: variant.colorHex, border: "1px solid rgba(0,0,0,.08)" }}
                          />
                          {variant.color} · Size {variant.size}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          cart.removeLine(line.id);
                          toast.push({ tone: "info", title: "Đã xoá khỏi giỏ thuê", body: product.name });
                        }}
                        className="text-[11px] uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-danger"
                      >
                        Xoá
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                      <span>
                        {formatDate(line.pickupDate)} <span className="text-ink-3">→</span> {formatDate(line.returnDate)}
                      </span>
                      <span className="text-ink-2">{days} ngày</span>
                      <button
                        type="button"
                        onClick={() => setEditing(line.id)}
                        className="link-line link-underline-in text-[11px] uppercase tracking-[0.12em]"
                      >
                        Đổi ngày
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                      <QuantityStepper
                        value={line.quantity}
                        min={1}
                        max={Math.max(1, availability?.freeUnits ?? 1)}
                        compact
                        onChange={(q) => cart.updateLine(line.id, { quantity: q })}
                      />
                      <div className="text-right">
                        <p className="text-[14px] tabular-nums">Thuê {formatVnd(rentalTotal)}</p>
                        <p className="mt-0.5 text-[12.5px] tabular-nums text-ink-2">Cọc {formatVnd(depositTotal)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {mounted && availability && (
                        <AvailabilityBadge
                          level={availability.level}
                          free={availability.freeUnits}
                          total={availability.totalUnits}
                        />
                      )}
                      {mounted &&
                        (expired ? (
                          <span className="inline-flex items-center gap-1.5 bg-danger-soft px-2.5 py-1 text-[11.5px] text-danger">
                            <IconClock width={12} height={12} /> Hết giữ chỗ
                          </span>
                        ) : (
                          <HoldTimer expiresAt={line.holdExpiresAt} label="Giữ" />
                        ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/collections/tat-ca" className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em]">
              Thuê thêm món khác
            </Link>
            <button
              type="button"
              onClick={() => {
                cart.clear();
                toast.push({ tone: "info", title: "Đã xoá toàn bộ giỏ thuê" });
              }}
              className="text-[11.5px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-danger"
            >
              Xoá tất cả
            </button>
          </div>
        </div>

        {/* Tóm tắt */}
        <aside className="lg:sticky lg:top-[100px] lg:self-start">
          <div className="border border-line bg-surface p-6">
            <h2 className="eyebrow text-ink-3">Tạm tính</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const result = cart.applyPromotion(code);
                toast.push({ tone: result.ok ? "success" : "error", title: result.message });
                if (result.ok) setCode("");
              }}
              className="mt-5 flex gap-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Mã giảm giá"
                className="field"
                aria-label="Mã giảm giá"
              />
              <button type="submit" className="btn btn-quiet shrink-0">
                Áp dụng
              </button>
            </form>

            {cart.promotion && (
              <div className="mt-3 flex items-center justify-between bg-success-soft px-3 py-2 text-[12.5px] text-success">
                <span>
                  {cart.promotion.code} · {cart.promotion.description}
                </span>
                <button type="button" onClick={cart.clearPromotion} aria-label="Bỏ mã" className="ml-2">
                  ×
                </button>
              </div>
            )}
            {cart.promotionError && <p className="mt-2 text-[12px] text-danger">{cart.promotionError}</p>}

            <div className="mt-6">
              <PriceBreakdown quote={cart.quote} showDueSplit={false} />
            </div>

            <Link href="/checkout" className="btn btn-block mt-6">
              Tiến hành thuê
            </Link>

            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-2">
              <IconInfo width={13} height={13} className="mt-0.5 shrink-0" />
              Mặc định bạn chỉ trả trước tiền cọc + {Math.round(SETTINGS.prepay_rental_rate * 100)}% tiền thuê ở bước
              thanh toán. Phần còn lại trả khi nhận đồ.
            </p>
          </div>

          <div className="mt-5 border border-line p-5">
            <p className="eyebrow text-ink-3">Mã đang có</p>
            <ul className="mt-3 space-y-2.5">
              {PROMOTIONS.slice(0, 3).map((promo) => (
                <li key={promo.code} className="flex items-start justify-between gap-3 text-[12.5px]">
                  <span className="text-ink-2">{promo.description}</span>
                  <button
                    type="button"
                    onClick={() => setCode(promo.code)}
                    className="shrink-0 border border-dashed border-ink-3 px-2 py-0.5 tracking-[0.08em] transition-colors hover:border-ink"
                  >
                    {promo.code}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Đổi ngày cho một dòng */}
      <Modal open={Boolean(editingLine)} onClose={() => setEditing(null)} title="Đổi ngày thuê" width="max-w-[760px]">
        {editingLine && (
          <>
            <p className="mb-5 text-[13px] text-ink-2">
              {editingLine.product.name} · {editingLine.variant.color} · Size {editingLine.variant.size}
            </p>
            <RentalDatePicker
              variants={[editingLine.variant]}
              bookings={bookingsForProduct(editingLine.product.slug)}
              cleanBufferDays={cleanBufferFor(editingLine.product.categorySlug)}
              pickupDate={editingLine.line.pickupDate}
              returnDate={editingLine.line.returnDate}
              onChange={(from, to) => {
                if (from && to) {
                  cart.updateLine(editingLine.line.id, { pickupDate: from, returnDate: to });
                  toast.push({
                    tone: "success",
                    title: "Đã cập nhật ngày thuê",
                    body: `${formatDate(from)} → ${formatDate(to)} · ${rentalDays(from, to)} ngày`,
                  });
                  setTimeout(() => setEditing(null), 240);
                }
              }}
            />
          </>
        )}
      </Modal>

      {/* Hết hạn giữ chỗ */}
      <Modal
        open={expiredDialog}
        onClose={() => setExpiredDialog(false)}
        title="Giỏ thuê đã hết hạn giữ chỗ"
        footer={
          <div className="flex gap-3">
            <Link href="/collections/tat-ca" className="btn btn-quiet flex-1">
              Xem món khác
            </Link>
            <button
              type="button"
              onClick={() => {
                cart.renewHolds();
                setExpiredDialog(false);
                toast.push({ tone: "success", title: "Đã giữ chỗ lại", body: "Bạn có thêm 15 phút để hoàn tất." });
              }}
              className="btn flex-1"
            >
              Giữ chỗ lại
            </button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink-2">
          Sau {SETTINGS.hold_ttl_minutes} phút, hệ thống nhả các món trong giỏ để khách khác có thể đặt. Bạn có thể giữ
          chỗ lại — chúng tôi sẽ kiểm tra lại lịch trống cho đúng khoảng ngày bạn chọn.
        </p>
      </Modal>
    </div>
  );
}
