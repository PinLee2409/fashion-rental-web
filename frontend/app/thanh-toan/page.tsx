"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { HoldTimer } from "@/components/rental/HoldTimer";
import { PriceBreakdown } from "@/components/rental/PriceBreakdown";
import { IconAlert, IconCheck, IconInfo, IconStore, IconTruck } from "@/components/ui/Icons";
import { EmptyState, Note, Reveal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMER } from "@/data/customer";
import { useMounted } from "@/hooks";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { PAYMENT_PLAN_COPY } from "@/lib/policy";
import { SETTINGS, SHIPPING, STORE } from "@/lib/settings";
import type { PaymentMethod, PaymentPlan, PickupMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

const STEPS = ["Thông tin nhận đồ", "Thanh toán", "Xem lại & xác nhận"];

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const cart = useCart();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>("at_store");
  const [addressId, setAddressId] = useState(CUSTOMER.addresses.find((a) => a.isDefault)?.id ?? "");
  const [receiverName, setReceiverName] = useState(CUSTOMER.name);
  const [receiverPhone, setReceiverPhone] = useState(CUSTOMER.phone);
  const [measurements, setMeasurements] = useState({
    heightCm: CUSTOMER.measurements.heightCm?.toString() ?? "",
    weightKg: CUSTOMER.measurements.weightKg?.toString() ?? "",
    bustCm: CUSTOMER.measurements.bustCm?.toString() ?? "",
    waistCm: CUSTOMER.measurements.waistCm?.toString() ?? "",
    hipCm: CUSTOMER.measurements.hipCm?.toString() ?? "",
  });
  const [saveMeasurements, setSaveMeasurements] = useState(true);
  const [note, setNote] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("deposit_hold");
  const [method, setMethod] = useState<PaymentMethod>("vnpay");
  const [agreed, setAgreed] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const address = CUSTOMER.addresses.find((a) => a.id === addressId);
  const deliveryBlocked = Boolean(address && !address.deliverySupported);

  // BR-05 — sang bước thanh toán, hold được gia hạn lên 30 phút
  useEffect(() => {
    if (cart.lines.length > 0) cart.renewHolds(SETTINGS.checkout_ttl_minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UC-04 luồng phụ 4a — địa chỉ ngoài vùng giao thì chỉ cho nhận tại shop
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (deliveryBlocked && pickupMethod === "delivery") setPickupMethod("at_store");
  }, [deliveryBlocked, pickupMethod]);

  const quote = useMemo(
    () => cart.buildQuoteWith({ pickupMethod, paymentPlan }),
    [cart, pickupMethod, paymentPlan],
  );

  if (mounted && cart.detailed.length === 0) {
    return (
      <div className="pt-[76px]">
        <EmptyState
          title="Chưa có gì để thanh toán"
          body="Giỏ thuê của bạn đang trống. Chọn ngày và thêm vài món trước khi đặt thuê."
          action={{ label: "Khám phá bộ sưu tập", href: "/danh-muc/tat-ca" }}
        />
      </div>
    );
  }

  function next() {
    if (step === 0) {
      if (!receiverName.trim() || receiverPhone.trim().length < 9) {
        toast.push({ tone: "error", title: "Thiếu thông tin người nhận", body: "Nhập họ tên và số điện thoại." });
        return;
      }
      if (pickupMethod === "delivery" && !address) {
        toast.push({ tone: "error", title: "Chưa chọn địa chỉ giao" });
        return;
      }
    }
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    if (!agreed) {
      toast.push({ tone: "error", title: "Vui lòng đồng ý điều khoản thuê đồ" });
      return;
    }
    setSubmitting(true);

    const code = `CR${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 9000) + 1000,
    )}`;

    const snapshot = {
      code,
      createdAt: new Date().toISOString(),
      pickupMethod,
      paymentPlan,
      method,
      receiverName,
      receiverPhone,
      address: pickupMethod === "delivery" && address ? `${address.street}, ${address.ward}, ${address.district}, ${address.province}` : null,
      note,
      items: cart.detailed.map((d) => ({
        slug: d.product.slug,
        name: d.product.name,
        image: d.product.images[0],
        size: d.variant.size,
        color: d.variant.color,
        colorHex: d.variant.colorHex,
        quantity: d.line.quantity,
        days: d.days,
        pickupDate: d.line.pickupDate,
        returnDate: d.line.returnDate,
        rentalTotal: d.rentalTotal,
        depositTotal: d.depositTotal,
      })),
      totals: {
        subtotalRental: quote.subtotalRental,
        discount: quote.discount,
        discountLabel: quote.discountLabel,
        shippingFee: quote.shippingFee,
        totalDeposit: quote.totalDeposit,
        fullPaymentDiscount: quote.fullPaymentDiscount,
        grandTotal: quote.grandTotal,
        dueNow: quote.dueNow,
        dueOnPickup: quote.dueOnPickup,
      },
    };

    try {
      window.sessionStorage.setItem("stylerent.lastOrder", JSON.stringify(snapshot));
    } catch {
      /* bỏ qua */
    }

    // Mô phỏng chuyển sang cổng thanh toán rồi quay về theo kết quả IPN
    setTimeout(() => {
      if (simulateFailure) {
        router.push(`/thanh-toan/ket-qua?code=${code}&trang-thai=that-bai`);
      } else {
        cart.clear();
        router.push(`/thanh-toan/ket-qua?code=${code}&trang-thai=thanh-cong`);
      }
    }, 900);
  }

  return (
    <div className="pt-[76px]">
      <div className="shell border-b border-line py-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link href="/gio-thue" className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em] text-ink-2">
              ← Quay lại giỏ thuê
            </Link>
            <h1 className="display-2 mt-4">Đặt thuê</h1>
          </div>
          {mounted && cart.holdExpiresAt && (
            <HoldTimer expiresAt={cart.holdExpiresAt} label="Đơn được giữ trong" />
          )}
        </Reveal>

        {/* Chỉ dẫn bước */}
        <ol className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center text-[11px] tabular-nums transition-colors duration-400",
                  i < step ? "bg-ink text-canvas" : i === step ? "border border-ink" : "border border-line text-ink-3",
                )}
              >
                {i < step ? <IconCheck width={12} height={12} /> : i + 1}
              </span>
              <span className={cn("text-[13px]", i === step ? "text-ink" : "text-ink-2")}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div>
          {/* BƯỚC 1 */}
          {step === 0 && (
            <div className="animate-fade-up space-y-10">
              <section>
                <h2 className="display-4">Hình thức nhận đồ</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <OptionCard
                    active={pickupMethod === "at_store"}
                    onClick={() => setPickupMethod("at_store")}
                    icon={<IconStore width={18} height={18} />}
                    title="Nhận tại cửa hàng"
                    price="Miễn phí"
                    body={STORE.address}
                  />
                  <OptionCard
                    active={pickupMethod === "delivery"}
                    onClick={() => !deliveryBlocked && setPickupMethod("delivery")}
                    disabled={deliveryBlocked}
                    icon={<IconTruck width={18} height={18} />}
                    title="Giao tận nơi (2 chiều)"
                    price={`+${formatVnd(SHIPPING.round_trip_fee)}`}
                    body={
                      deliveryBlocked
                        ? "Địa chỉ đang chọn nằm ngoài vùng giao"
                        : `Miễn phí cho đơn thuê từ ${formatVnd(SHIPPING.free_shipping_threshold)}`
                    }
                  />
                </div>
                {deliveryBlocked && (
                  <Note tone="warning" icon={<IconAlert width={15} height={15} />}>
                    Địa chỉ tại {address?.province} nằm ngoài vùng giao nhận, đơn này chỉ có thể nhận tại cửa hàng.
                  </Note>
                )}
              </section>

              <section>
                <h2 className="display-4">Người nhận</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="name">
                      Họ và tên
                    </label>
                    <input id="name" className="field" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="phone">
                      Số điện thoại
                    </label>
                    <input id="phone" className="field" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
                  </div>
                </div>

                <div className="mt-5">
                  <label className="field-label">Địa chỉ</label>
                  <div className="space-y-2.5">
                    {CUSTOMER.addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAddressId(a.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border p-4 text-left transition-colors",
                          addressId === a.id ? "border-ink" : "border-line hover:border-ink-3",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border",
                            addressId === a.id ? "border-[5px] border-ink" : "border-line",
                          )}
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-[13.5px]">
                            {a.label}
                            {a.isDefault && <span className="bg-warm px-1.5 py-0.5 text-[10.5px] text-ink-2">Mặc định</span>}
                            {!a.deliverySupported && (
                              <span className="bg-warning-soft px-1.5 py-0.5 text-[10.5px] text-warning">
                                Ngoài vùng giao
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-[12.5px] text-ink-2">
                            {a.street}, {a.ward}, {a.district}, {a.province}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/tai-khoan/dia-chi"
                    className="link-line link-underline-in mt-3 inline-block text-[11.5px] uppercase tracking-[0.12em] text-ink-2"
                  >
                    Quản lý sổ địa chỉ
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="display-4">Số đo</h2>
                <p className="mt-2 max-w-[60ch] text-[13px] text-ink-2">
                  Không bắt buộc, nhưng giúp shop chọn đúng cá thể vừa người bạn nhất trong số các bộ cùng size.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    { key: "heightCm", label: "Cao (cm)" },
                    { key: "weightKg", label: "Nặng (kg)" },
                    { key: "bustCm", label: "Vòng 1" },
                    { key: "waistCm", label: "Vòng 2" },
                    { key: "hipCm", label: "Vòng 3" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="field-label" htmlFor={field.key}>
                        {field.label}
                      </label>
                      <input
                        id={field.key}
                        inputMode="numeric"
                        className="field hide-number-spin"
                        value={measurements[field.key as keyof typeof measurements]}
                        onChange={(e) => setMeasurements((m) => ({ ...m, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={saveMeasurements}
                    onChange={() => setSaveMeasurements((v) => !v)}
                    className="h-4 w-4 accent-[#181818]"
                  />
                  Lưu số đo vào hồ sơ của tôi
                </label>
              </section>

              <section>
                <label className="field-label" htmlFor="note">
                  Ghi chú cho shop
                </label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: cần đồ trước 9h sáng, hoặc muốn shop kẹp lai giúp..."
                  className="field"
                />
              </section>
            </div>
          )}

          {/* BƯỚC 2 */}
          {step === 1 && (
            <div className="animate-fade-up space-y-10">
              <section>
                <h2 className="display-4">Phương án thanh toán</h2>
                <div className="mt-5 space-y-3">
                  {(["deposit_hold", "full"] as PaymentPlan[]).map((plan) => {
                    const copy = PAYMENT_PLAN_COPY[plan];
                    const planQuote = cart.buildQuoteWith({ pickupMethod, paymentPlan: plan });
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setPaymentPlan(plan)}
                        className={cn(
                          "flex w-full items-start gap-3 border p-5 text-left transition-colors",
                          paymentPlan === plan ? "border-ink" : "border-line hover:border-ink-3",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border",
                            paymentPlan === plan ? "border-[5px] border-ink" : "border-line",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[15px]">{copy.title}</span>
                            <span className="text-[15px] tabular-nums">{formatVnd(planQuote.dueNow)}</span>
                          </span>
                          <span className="mt-1 block text-[12.5px] text-ink-2">{copy.summary}</span>
                          <span className="mt-0.5 block text-[12.5px] text-ink-3">{copy.detail}</span>
                          {planQuote.dueOnPickup > 0 && (
                            <span className="mt-2 block text-[12px] text-ink-2">
                              Trả nốt khi nhận đồ: {formatVnd(planQuote.dueOnPickup)}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="display-4">Cổng thanh toán</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { key: "vnpay", label: "VNPay", hint: "Thẻ ATM / QR" },
                      { key: "momo", label: "MoMo", hint: "Ví điện tử" },
                      { key: "bank_transfer", label: "Chuyển khoản", hint: "Xác nhận trong 1 giờ" },
                    ] as { key: PaymentMethod; label: string; hint: string }[]
                  ).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setMethod(option.key)}
                      className={cn(
                        "border p-4 text-left transition-colors",
                        method === option.key ? "border-ink" : "border-line hover:border-ink-3",
                      )}
                    >
                      <span className="block text-[14px]">{option.label}</span>
                      <span className="mt-1 block text-[12px] text-ink-2">{option.hint}</span>
                    </button>
                  ))}
                </div>
                <Note tone="info" icon={<IconInfo width={15} height={15} />}>
                  Đơn được giữ trong {SETTINGS.checkout_ttl_minutes} phút. Nếu thanh toán chưa hoàn tất trong khoảng
                  này, hệ thống sẽ tự huỷ đơn và nhả đồ cho khách khác.
                </Note>
              </section>
            </div>
          )}

          {/* BƯỚC 3 */}
          {step === 2 && (
            <div className="animate-fade-up space-y-8">
              <section>
                <h2 className="display-4">Xem lại đơn thuê</h2>
                <dl className="mt-5 divide-y divide-line-2 border-y border-line">
                  <ReviewRow label="Nhận đồ">
                    {pickupMethod === "at_store" ? `Nhận tại cửa hàng — ${STORE.address}` : `Giao tận nơi — ${address?.street}, ${address?.ward}, ${address?.district}, ${address?.province}`}
                  </ReviewRow>
                  <ReviewRow label="Người nhận">
                    {receiverName} · {receiverPhone}
                  </ReviewRow>
                  <ReviewRow label="Số đo">
                    {measurements.heightCm || measurements.bustCm
                      ? `Cao ${measurements.heightCm || "—"}cm · Nặng ${measurements.weightKg || "—"}kg · V1 ${
                          measurements.bustCm || "—"
                        } · V2 ${measurements.waistCm || "—"} · V3 ${measurements.hipCm || "—"}`
                      : "Chưa cung cấp"}
                  </ReviewRow>
                  <ReviewRow label="Thanh toán">
                    {PAYMENT_PLAN_COPY[paymentPlan].title} qua{" "}
                    {method === "vnpay" ? "VNPay" : method === "momo" ? "MoMo" : "chuyển khoản"}
                  </ReviewRow>
                  {note && <ReviewRow label="Ghi chú">{note}</ReviewRow>}
                </dl>
              </section>

              <section>
                <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed((v) => !v)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#181818]"
                  />
                  <span>
                    Tôi đã đọc và đồng ý với{" "}
                    <Link href="/chinh-sach" className="link-line link-underline-in">
                      điều khoản thuê đồ
                    </Link>
                    : giữ gìn trang phục, trả đúng hạn, và chấp nhận phí phát sinh nếu đồ hư hỏng hoặc trả trễ.
                  </span>
                </label>

                <label className="mt-5 flex cursor-pointer items-start gap-3 border border-dashed border-line p-3 text-[12px] text-ink-2">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={() => setSimulateFailure((v) => !v)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#b94a48]"
                  />
                  <span>
                    <span className="text-ink">Demo:</span> mô phỏng thanh toán thất bại để xem màn hình xử lý lỗi và
                    cách hệ thống giữ đơn ở trạng thái chờ thanh toán.
                  </span>
                </label>
              </section>
            </div>
          )}

          {/* Điều hướng bước */}
          <div className="mt-12 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-quiet">
                Quay lại
              </button>
            ) : (
              <Link href="/gio-thue" className="btn btn-quiet">
                Về giỏ thuê
              </Link>
            )}

            {step < 2 ? (
              <button type="button" onClick={next} className="btn px-10">
                Tiếp tục
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="btn px-10">
                {submitting ? "Đang chuyển tới cổng thanh toán..." : `Đặt thuê & thanh toán ${formatVnd(quote.dueNow)}`}
              </button>
            )}
          </div>
        </div>

        {/* Tóm tắt đơn */}
        <aside className="lg:sticky lg:top-[100px] lg:self-start">
          <div className="border border-line bg-surface p-6">
            <h2 className="eyebrow text-ink-3">Đơn thuê của bạn</h2>

            <ul className="mt-5 space-y-4 border-b border-line pb-5">
              {cart.detailed.map(({ line, product, variant, days, rentalTotal }) => (
                <li key={line.id} className="flex gap-3.5">
                  <ProductMedia image={product.images[0]} ratio="3/4" className="w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">{product.name}</p>
                    <p className="mt-1 text-[11.5px] text-ink-2">
                      {variant.size} · {variant.color} · SL {line.quantity}
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-2">
                      {formatDate(line.pickupDate)} → {formatDate(line.returnDate)} · {days} ngày
                    </p>
                  </div>
                  <p className="shrink-0 text-[12.5px] tabular-nums">{formatVnd(rentalTotal)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <PriceBreakdown quote={quote} paymentPlan={paymentPlan} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OptionCard({
  active,
  onClick,
  icon,
  title,
  price,
  body,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  price: string;
  body: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-3 border p-5 text-left transition-colors",
        active ? "border-ink" : "border-line hover:border-ink-3",
        disabled && "cursor-not-allowed opacity-50 hover:border-line",
      )}
    >
      <span className="flex items-center justify-between">
        <span className="text-ink-2">{icon}</span>
        <span className="text-[12.5px] tabular-nums">{price}</span>
      </span>
      <span className="text-[14.5px]">{title}</span>
      <span className="text-[12.5px] leading-relaxed text-ink-2">{body}</span>
    </button>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
      <dt className="w-40 shrink-0 text-[12px] uppercase tracking-[0.1em] text-ink-3">{label}</dt>
      <dd className="text-[13.5px] leading-relaxed">{children}</dd>
    </div>
  );
}
