"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AvailabilityBadge } from "@/components/product/AvailabilityBadge";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductRail } from "@/components/product/ProductGrid";
import { VariantSelector } from "@/components/product/VariantSelector";
import { PriceBreakdown } from "@/components/rental/PriceBreakdown";
import { PricingTiers } from "@/components/rental/PricingTiers";
import { RentalDatePicker } from "@/components/rental/RentalDatePicker";
import { IconCalendar, IconClock, IconHeart, IconRuler, IconShield, IconStore, IconTruck } from "@/components/ui/Icons";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { Accordion, Chip, QuantityStepper, Reveal, Skeleton, Stars } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { bookingsForProduct } from "@/data/bookings";
import { cleanBufferFor, getCategory, OCCASIONS } from "@/data/catalog";
import { relatedProducts } from "@/data/collections";
import { ratingBreakdown, reviewsForProduct } from "@/data/reviews";
import { useDebounced, useMounted } from "@/hooks";
import { productAvailability } from "@/lib/availability";
import { formatDate, rentalDays } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { buildQuote } from "@/lib/pricing";
import { RENTAL_RULES } from "@/lib/policy";
import { SETTINGS, SHIPPING, STORE } from "@/lib/settings";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useRentalDates } from "@/store/rental-dates";
import { useWishlist } from "@/store/wishlist";
import { ReviewList } from "./ReviewList";

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const mounted = useMounted();
  const toast = useToast();
  const cart = useCart();
  const wishlist = useWishlist();
  const { pickupDate, returnDate, hasRange, setRange } = useRentalDates();

  const bookings = useMemo(() => bookingsForProduct(product.slug), [product.slug]);
  const cleanBuffer = cleanBufferFor(product.categorySlug);
  const category = getCategory(product.categorySlug);
  const reviews = reviewsForProduct(product.slug);
  const related = relatedProducts(product);

  const firstUsable = product.variants.find((v) => v.unitCount > 0) ?? product.variants[0];
  const [color, setColor] = useState(firstUsable.color);
  const [size, setSize] = useState(firstUsable.size);
  const [quantity, setQuantity] = useState(1);
  const [dateOpen, setDateOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [bookingSheet, setBookingSheet] = useState(false);

  // Đổi ngày → gọi lại availability, debounce 300ms như đặc tả yêu cầu
  const debouncedRange = useDebounced(`${pickupDate ?? ""}|${returnDate ?? ""}`, 300);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!hasRange) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(true);
    const id = setTimeout(() => setChecking(false), 280);
    return () => clearTimeout(id);
  }, [debouncedRange, hasRange]);

  const availability = useMemo(() => {
    if (!hasRange || !pickupDate || !returnDate) return null;
    return productAvailability(product, bookings, pickupDate, returnDate, cleanBuffer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, bookings, cleanBuffer, debouncedRange, hasRange]);

  const variant = useMemo(
    () => product.variants.find((v) => v.size === size && v.color === color) ?? firstUsable,
    [product.variants, size, color, firstUsable],
  );

  const days = hasRange && pickupDate && returnDate ? rentalDays(pickupDate, returnDate) : 0;
  const quote = useMemo(
    () => buildQuote([{ variant, days: Math.max(1, days), quantity }]),
    [variant, days, quantity],
  );
  const line = quote.lines[0];

  const variantAvail = availability?.[variant.id] ?? null;
  const freeUnits = variantAvail?.freeUnits ?? variant.unitCount;
  const soldOut = variant.unitCount === 0 || (hasRange && freeUnits === 0);
  const canRent = mounted && hasRange && !soldOut;

  // Khi đổi màu mà size hiện tại không còn cá thể → nhảy sang size còn hàng
  useEffect(() => {
    const current = product.variants.find((v) => v.size === size && v.color === color);
    if (current && current.unitCount > 0) return;
    const fallback = product.variants.find((v) => v.color === color && v.unitCount > 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fallback) setSize(fallback.size);
  }, [color, size, product.variants]);

  function addToCart(then?: () => void) {
    if (!pickupDate || !returnDate) {
      setDateOpen(true);
      return;
    }
    cart.addLine({ productSlug: product.slug, variantId: variant.id, quantity, pickupDate, returnDate });
    toast.push({
      tone: "success",
      title: "Đã thêm vào giỏ thuê",
      body: `${product.name} · ${size} · ${color} — giữ chỗ ${SETTINGS.hold_ttl_minutes} phút`,
      action: { label: "Xem giỏ thuê", href: "/gio-thue" },
    });
    then?.();
  }

  const bookingPanel = (
    <div className="space-y-6">
      {/* Khối chọn ngày — trung tâm của trải nghiệm thuê */}
      <div className="border border-ink">
        <button
          type="button"
          onClick={() => setDateOpen(true)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-warm"
        >
          <span className="flex items-center gap-3">
            <IconCalendar className="shrink-0 text-ink-2" />
            <span>
              <span className="eyebrow block text-ink-3">Ngày thuê</span>
              <span className="mt-1 block text-[14px]">
                {mounted && hasRange ? (
                  <>
                    {formatDate(pickupDate!)} <span className="text-ink-3">→</span> {formatDate(returnDate!)}
                  </>
                ) : (
                  "Chọn ngày nhận và ngày trả"
                )}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-ink-2">
            {mounted && hasRange ? "Đổi" : "Chọn"}
          </span>
        </button>

        {mounted && hasRange && (
          <div className="border-t border-line bg-warm px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px]">
                {days} ngày thuê
                {line.rentalPrice.appliedTier && (
                  <span className="ml-2 text-ink-2">· đang áp {line.rentalPrice.appliedTier.label}</span>
                )}
              </span>
              <span className="text-[15px] tabular-nums">{formatVnd(line.rentalPrice.total)}</span>
            </div>
            {line.rentalPrice.saved > 0 && (
              <p className="mt-1 text-[12px] text-success">
                Tiết kiệm {formatVnd(line.rentalPrice.saved)} so với tính theo ngày lẻ
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="field-label">Gói thuê</p>
        <PricingTiers
          variant={variant}
          activeDays={mounted && hasRange ? days : undefined}
          onPick={(tierDays) => {
            const start = pickupDate ?? new Date().toISOString().slice(0, 10);
            const end = new Date(start);
            end.setDate(end.getDate() + tierDays);
            setRange(start, end.toISOString().slice(0, 10));
          }}
        />
      </div>

      <VariantSelector
        product={product}
        availability={availability}
        size={size}
        color={color}
        onSizeChange={setSize}
        onColorChange={setColor}
        showSizeGuide={() => setSizeGuideOpen(true)}
        ready={Boolean(mounted && hasRange)}
      />

      {/* Tình trạng còn/hết */}
      {mounted &&
        (checking ? (
          <Skeleton className="h-11 w-full" />
        ) : hasRange && variantAvail ? (
          <AvailabilityBadge
            level={variantAvail.level}
            free={variantAvail.freeUnits}
            total={variantAvail.totalUnits}
            variant="block"
          />
        ) : variant.unitCount === 0 ? (
          <AvailabilityBadge level="none" free={0} total={0} variant="block" />
        ) : (
          <div className="flex items-center gap-2 bg-warm px-3.5 py-3 text-[13px] text-ink-2">
            <IconCalendar width={15} height={15} />
            Chọn ngày thuê để xem còn bao nhiêu bộ cho khoảng ngày đó.
          </div>
        ))}

      {mounted && hasRange && soldOut && (
        <p className="text-[12.5px] text-ink-2">
          Gợi ý: thử đổi size hoặc màu khác ở trên, hoặc mở lịch để chọn khoảng ngày còn trống gần nhất.
        </p>
      )}

      <div className="flex items-center gap-4">
        <div>
          <p className="field-label">Số lượng</p>
          <QuantityStepper
            value={quantity}
            min={1}
            max={Math.max(1, Math.min(5, hasRange ? freeUnits : variant.unitCount))}
            onChange={setQuantity}
          />
        </div>
        <p className="mt-6 text-[12px] text-ink-3">
          {!mounted || !hasRange
            ? "Chọn ngày để biết số lượng còn lại"
            : soldOut
              ? "Không còn bộ nào cho khoảng ngày này"
              : `Tối đa ${freeUnits} bộ cho khoảng ngày này`}
        </p>
      </div>

      {/* Tạm tính dòng thuê */}
      {mounted && hasRange && (
        <div className="border-t border-line pt-5">
          <PriceBreakdown quote={quote} showDueSplit={false} />
        </div>
      )}

      <div className="space-y-3">
        <button type="button" disabled={!canRent} onClick={() => addToCart()} className="btn btn-block">
          {!mounted || !hasRange ? "Chọn ngày để thuê" : soldOut ? "Hết đồ cho ngày đã chọn" : "Thêm vào giỏ thuê"}
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canRent}
            onClick={() => addToCart(() => router.push("/thanh-toan"))}
            className="btn btn-outline flex-1"
          >
            Thuê ngay
          </button>
          <button
            type="button"
            onClick={() => {
              const added = wishlist.toggle(product.slug);
              toast.push({ tone: "success", title: added ? "Đã lưu vào Yêu thích" : "Đã bỏ khỏi Yêu thích" });
            }}
            aria-label="Lưu vào yêu thích"
            className={cn(
              "btn btn-outline px-4",
              wishlist.hydrated && wishlist.has(product.slug) && "border-accent text-accent",
            )}
          >
            <IconHeart width={16} height={16} filled={wishlist.hydrated && wishlist.has(product.slug)} />
          </button>
        </div>
        <p className="flex items-center gap-2 text-[12px] text-ink-2">
          <IconClock width={13} height={13} />
          Giữ chỗ {SETTINGS.hold_ttl_minutes} phút sau khi thêm vào giỏ thuê.
        </p>
      </div>
    </div>
  );

  return (
    <div className="pt-[76px]">
      {/* Breadcrumb */}
      <nav className="shell py-6 text-[12px] text-ink-2">
        <Link href="/" className="link-line link-underline-in">
          Trang chủ
        </Link>
        <span className="mx-2 text-ink-3">/</span>
        <Link href={`/danh-muc/${product.categorySlug}`} className="link-line link-underline-in">
          {category?.name}
        </Link>
        <span className="mx-2 text-ink-3">/</span>
        <span className="text-ink-3">{product.name}</span>
      </nav>

      <div className="shell grid gap-10 pb-16 lg:grid-cols-[1.15fr_minmax(380px,0.85fr)] lg:gap-16">
        <div className="min-w-0">
          <ImageGallery images={product.images} name={product.name} />
        </div>

        {/* Cột thông tin — dính khi cuộn trên desktop */}
        <div className="min-w-0 lg:sticky lg:top-[100px] lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.isNew && <Chip tone="ink">Mới về</Chip>}
            {product.occasions.slice(0, 2).map((o) => (
              <Chip key={o}>{OCCASIONS.find((x) => x.slug === o)?.name ?? o}</Chip>
            ))}
          </div>

          <p className="eyebrow mt-5 text-ink-3">{product.brandLine}</p>
          <h1 className="display-2 mt-2">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars value={product.rating} size={14} />
            <span className="text-[12.5px] text-ink-2">
              {product.rating.toFixed(1).replace(".", ",")} ({product.reviewCount} đánh giá)
            </span>
            <span className="text-[12.5px] text-ink-3">· đã thuê {product.rentalCount} lượt</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3">
            <span className="text-[26px]">{formatVnd(variant.pricePerDay)}</span>
            <span className="text-[14px] text-ink-2">/ ngày</span>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-2">
            Cọc {formatVnd(variant.depositAmount)} — hoàn lại khi trả nguyên vẹn
          </p>

          <p className="mt-5 max-w-[54ch] text-[13.5px] leading-relaxed text-ink-2">{product.editorialNote}</p>

          <div className="mt-8 hidden lg:block">{bookingPanel}</div>

          {/* Thông tin nhanh */}
          <ul className="mt-8 grid gap-3 border-t border-line pt-6 text-[12.5px] text-ink-2">
            <li className="flex items-start gap-2.5">
              <IconStore width={15} height={15} className="mt-0.5 shrink-0" />
              Nhận tại cửa hàng miễn phí — {STORE.address}
            </li>
            <li className="flex items-start gap-2.5">
              <IconTruck width={15} height={15} className="mt-0.5 shrink-0" />
              Giao tận nơi 2 chiều {formatVnd(SHIPPING.round_trip_fee)} · miễn phí cho đơn thuê từ{" "}
              {formatVnd(SHIPPING.free_shipping_threshold)}
            </li>
            <li className="flex items-start gap-2.5">
              <IconShield width={15} height={15} className="mt-0.5 shrink-0" />
              Đã giặt hấp và kiểm tra trước khi bàn giao · cần {cleanBuffer} ngày đệm sau mỗi lượt thuê
            </li>
          </ul>
        </div>
      </div>

      {/* Panel đặt thuê trên mobile */}
      <div className="shell pb-16 lg:hidden">{bookingPanel}</div>

      {/* Lịch trống của sản phẩm */}
      <section className="shell border-t border-line py-16">
        <Reveal>
          <p className="eyebrow text-ink-3">Lịch trống</p>
          <h2 className="display-3 mt-3">Ngày nào còn đồ?</h2>
          <p className="lede mt-3 max-w-[62ch] text-[14px]">
            Lịch tính theo toàn bộ size và màu của sản phẩm này, đã cộng {cleanBuffer} ngày đệm giặt ủi sau mỗi lượt
            thuê. Chọn trực tiếp trên lịch để đặt khoảng ngày.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-8 max-w-[760px]">
          <RentalDatePicker
            variants={product.variants}
            bookings={bookings}
            cleanBufferDays={cleanBuffer}
            pickupDate={pickupDate}
            returnDate={returnDate}
            onChange={setRange}
          />
        </Reveal>
      </section>

      {/* Thông tin chi tiết */}
      <section className="shell grid gap-10 border-t border-line py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal className="min-w-0">
          <h2 className="display-3">Về thiết kế này</h2>
          <p className="mt-5 max-w-[56ch] text-[14.5px] leading-relaxed text-ink-2">{product.description}</p>
        </Reveal>
        <Reveal delay={100} className="min-w-0">
          <Accordion
            defaultOpen={0}
            items={[
              {
                title: "Chất liệu & bảo quản",
                content: (
                  <div className="space-y-2.5">
                    <p>
                      <span className="text-ink">Chất liệu:</span> {product.material}
                    </p>
                    <p>
                      <span className="text-ink">Bảo quản:</span> {product.careInstruction}
                    </p>
                    <p>
                      <span className="text-ink">Giá trị đền bù nếu mất:</span>{" "}
                      {formatVnd(product.replacementValue)}
                    </p>
                  </div>
                ),
              },
              {
                title: "Bảng size",
                content: <SizeTable product={product} />,
              },
              {
                title: "Quy định thuê",
                content: (
                  <ul className="space-y-3">
                    {RENTAL_RULES.map((rule) => (
                      <li key={rule.title}>
                        <span className="text-ink">{rule.title}. </span>
                        {rule.body}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                title: "Giao nhận & trả đồ",
                content: (
                  <ul className="space-y-2.5">
                    <li>Nhận tại cửa hàng: miễn phí, mang theo giấy tờ thế chân khi nhận.</li>
                    <li>
                      Giao tận nơi 2 chiều: {formatVnd(SHIPPING.round_trip_fee)}, áp dụng nội thành và tỉnh lân cận.
                    </li>
                    <li>Giờ hẹn trả mặc định là {STORE.return_due_hour}:00 của ngày trả.</li>
                    <li>Ân hạn {SETTINGS.late_fee_grace_hours} giờ trước khi tính phí trễ.</li>
                  </ul>
                ),
              },
            ]}
          />
        </Reveal>
      </section>

      {/* Đánh giá */}
      <section className="shell border-t border-line py-16">
        <ReviewList
          reviews={reviews}
          rating={product.rating}
          reviewCount={product.reviewCount}
          breakdown={ratingBreakdown(product.slug)}
        />
      </section>

      {/* Sản phẩm tương tự */}
      {related.length > 0 && (
        <section className="shell border-t border-line py-16">
          <Reveal as="header" className="flex items-end justify-between pb-10">
            <h2 className="display-3">Có thể bạn cũng thích</h2>
            <Link
              href={`/danh-muc/${product.categorySlug}`}
              className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em]"
            >
              Xem danh mục
            </Link>
          </Reveal>
          <ProductRail products={related} />
        </section>
      )}

      {/* Thanh hành động dính ở đáy — mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/96 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] tabular-nums">
              {formatVnd(variant.pricePerDay)} <span className="text-[12px] text-ink-2">/ ngày</span>
            </p>
            <p className="truncate text-[11.5px] text-ink-2">
              {mounted && hasRange ? `${formatDate(pickupDate!)} → ${formatDate(returnDate!)}` : "Chưa chọn ngày"}
            </p>
          </div>
          <button type="button" onClick={() => setBookingSheet(true)} className="btn btn-sm shrink-0 px-6">
            {mounted && hasRange ? "Thuê ngay" : "Chọn ngày"}
          </button>
        </div>
      </div>
      <div className="h-[72px] lg:hidden" />

      {/* Lịch dạng hộp thoại */}
      <Modal open={dateOpen} onClose={() => setDateOpen(false)} title="Chọn ngày thuê" width="max-w-[760px]">
        <RentalDatePicker
          variants={product.variants}
          bookings={bookings}
          cleanBufferDays={cleanBuffer}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onChange={(from, to) => {
            setRange(from, to);
            if (from && to) setTimeout(() => setDateOpen(false), 240);
          }}
        />
      </Modal>

      {/* Bottom sheet cấu hình thuê — mobile */}
      <BottomSheet
        open={bookingSheet}
        onClose={() => setBookingSheet(false)}
        title="Cấu hình đơn thuê"
        footer={
          <button
            type="button"
            disabled={!canRent}
            onClick={() => addToCart(() => setBookingSheet(false))}
            className="btn btn-block"
          >
            {!hasRange ? "Chọn ngày để thuê" : soldOut ? "Hết đồ cho ngày đã chọn" : "Thêm vào giỏ thuê"}
          </button>
        }
      >
        <div className="px-5 py-5">{bookingPanel}</div>
      </BottomSheet>

      {/* Bảng size */}
      <Modal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} title="Bảng size" width="max-w-[640px]">
        <SizeTable product={product} />
        <p className="mt-5 flex items-start gap-2 text-[12.5px] text-ink-2">
          <IconRuler width={14} height={14} className="mt-0.5 shrink-0" />
          Lưu số đo trong hồ sơ để shop soạn cá thể vừa người nhất cho bạn.
        </p>
      </Modal>
    </div>
  );
}

function SizeTable({ product }: { product: Product }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-2.5 pr-4 font-medium">Size</th>
            <th className="py-2.5 pr-4 font-medium">Ngực (cm)</th>
            <th className="py-2.5 pr-4 font-medium">Eo (cm)</th>
            <th className="py-2.5 pr-4 font-medium">Mông (cm)</th>
            <th className="py-2.5 font-medium">Dài (cm)</th>
          </tr>
        </thead>
        <tbody className="text-ink-2">
          {product.sizeChart.map((row) => (
            <tr key={row.size} className="border-b border-line-2">
              <td className="py-2.5 pr-4 text-ink">{row.size}</td>
              <td className="py-2.5 pr-4">{row.bust}</td>
              <td className="py-2.5 pr-4">{row.waist}</td>
              <td className="py-2.5 pr-4">{row.hip}</td>
              <td className="py-2.5">{row.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
