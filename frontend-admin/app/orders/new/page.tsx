"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UnitCode } from "@/components/domain/Chips";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { IconAlert, IconCheck, IconClose, IconSearch, IconUsers } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMERS } from "@/data/operations";
import { cleanBufferFor } from "@/data/catalog";
import { PRODUCTS } from "@/data/products";
import { addDays, rentalDays, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { buildQuote } from "@/lib/pricing";
import { freeUnitsFor } from "@/lib/ops";
import { SETTINGS } from "@/lib/settings";
import type { AdminCustomer } from "@/lib/admin-types";
import { cn, deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

interface CartLine {
  productSlug: string;
  variantId: string;
  unitCode: string;
  label: string;
  size: string;
  color: string;
  pricePerDay: number;
  deposit: number;
}

export default function WalkInOrderPage() {
  const session = useSession();
  const toast = useToast();
  const today = todayISO();

  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [pickup, setPickup] = useState(today);
  const [ret, setRet] = useState(addDays(today, 3));
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<"cash" | "bank_transfer">("cash");
  const [received, setReceived] = useState("");
  const [idTaken, setIdTaken] = useState(false);

  const days = rentalDays(pickup, ret);

  const customerResults = useMemo(() => {
    const q = deaccent(customerQuery.trim());
    if (!q) return [];
    return CUSTOMERS.filter((c) => deaccent(`${c.name} ${c.phone} ${c.email}`).includes(q)).slice(0, 5);
  }, [customerQuery]);

  /** Danh sách biến thể còn rảnh cho khoảng ngày đang chọn. */
  const productResults = useMemo(() => {
    const q = deaccent(productQuery.trim());
    const out: {
      slug: string;
      name: string;
      image: (typeof PRODUCTS)[number]["images"][number];
      variantId: string;
      size: string;
      color: string;
      colorHex: string;
      pricePerDay: number;
      deposit: number;
      free: ReturnType<typeof freeUnitsFor>;
    }[] = [];

    for (const p of PRODUCTS) {
      if (q && !deaccent(`${p.name} ${p.sku}`).includes(q)) continue;
      const buffer = cleanBufferFor(p.categorySlug);
      for (const v of p.variants) {
        if (v.unitCount === 0) continue;
        const free = freeUnitsFor(v.id, pickup, ret, buffer).filter((u) => !cart.some((c) => c.unitCode === u.unitCode));
        out.push({
          slug: p.slug,
          name: p.name,
          image: p.images[0],
          variantId: v.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          pricePerDay: v.pricePerDay,
          deposit: v.depositAmount,
          free,
        });
      }
      if (out.length > 40) break;
    }
    return out.sort((a, b) => b.free.length - a.free.length).slice(0, 12);
  }, [productQuery, pickup, ret, cart]);

  const quote = useMemo(() => {
    const lines = cart.flatMap((line) => {
      const product = PRODUCTS.find((p) => p.slug === line.productSlug);
      const variant = product?.variants.find((v) => v.id === line.variantId);
      return variant ? [{ variant, days, quantity: 1 }] : [];
    });
    return buildQuote(lines, { paymentPlan: "full", pickupMethod: "at_store" });
  }, [cart, days]);

  const receivedValue = Number(received.replace(/\D/g, "")) || 0;
  const change = receivedValue - quote.grandTotal;
  const canCreate = Boolean(customer) && cart.length > 0 && idTaken && receivedValue >= quote.grandTotal;

  if (!session.can("order.create")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconUsers width={22} height={22} />}
          title="Bạn không có quyền tạo đơn"
          body="Tạo đơn tại quầy dành cho nhân viên bán hàng, quản lý và admin."
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Tạo đơn tại quầy"
        description="Khách đến trực tiếp: chọn ngày trước, hệ thống chỉ hiện cá thể thật sự còn rảnh, thu tiền rồi bàn giao ngay."
        breadcrumb={[{ label: "Vận hành" }, { label: "Đơn thuê", href: "/orders" }, { label: "Tạo đơn tại quầy" }]}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {/* ------------------------------------------------------ khách -- */}
          <section className="card card-pad">
            <h2 className="h-section mb-3">1 · Khách hàng</h2>
            {customer ? (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-line bg-surface-2 p-3">
                <div className="min-w-0">
                  <p className="text-[13.5px]">{customer.name}</p>
                  <p className="num text-[12px] text-ink-2">{customer.phone}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <StatusChip tone="neutral" dot={false}>
                      {customer.totalRentals} lượt thuê
                    </StatusChip>
                    {customer.lateReturns > 0 && <StatusChip tone="warning">{customer.lateReturns} lần trả trễ</StatusChip>}
                    {customer.status === "blocked" && <StatusChip tone="danger">Đang bị khoá</StatusChip>}
                  </div>
                </div>
                <button type="button" onClick={() => setCustomer(null)} className="btn btn-ghost btn-sm btn-icon">
                  <IconClose width={15} height={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <IconSearch width={15} height={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Tìm theo số điện thoại hoặc tên khách..."
                    className="field pl-8"
                  />
                </div>
                {customerResults.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {customerResults.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomer(c);
                            setCustomerQuery("");
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-left transition-colors hover:border-ink-3"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px]">{c.name}</span>
                            <span className="num block text-[11.5px] text-ink-3">{c.phone}</span>
                          </span>
                          <span className="shrink-0 text-[11.5px] text-ink-3">{c.totalRentals} lượt</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => toast.push({ tone: "info", title: "Tạo khách mới", body: "Nhập tên, SĐT và giấy tờ thế chân." })}
                  className="btn btn-outline btn-sm mt-2"
                >
                  + Khách mới
                </button>
              </>
            )}

            {customer?.status === "blocked" && (
              <Callout tone="danger" icon={<IconAlert width={14} height={14} />} title="Khách đang bị khoá">
                {customer.blacklistReason} — cần quản lý duyệt trước khi cho thuê tiếp.
              </Callout>
            )}
          </section>

          {/* ------------------------------------------------------- ngày -- */}
          <section className="card card-pad">
            <h2 className="h-section mb-3">2 · Khoảng ngày thuê</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="pickup">
                  Ngày nhận
                </label>
                <input
                  id="pickup"
                  type="date"
                  value={pickup}
                  min={today}
                  max={addDays(today, SETTINGS.max_advance_days)}
                  onChange={(e) => setPickup(e.target.value)}
                  className="field num"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="return">
                  Ngày trả
                </label>
                <input
                  id="return"
                  type="date"
                  value={ret}
                  min={pickup}
                  onChange={(e) => setRet(e.target.value)}
                  className="field num"
                />
              </div>
              <div className="flex items-end">
                <div className="rounded-md bg-beige px-3 py-2 text-[12.5px]">
                  <span className="num text-[15px] font-medium">{days}</span> ngày thuê
                </div>
              </div>
            </div>
            <p className="field-hint">
              Thuê {SETTINGS.min_rental_days}–{SETTINGS.max_rental_days} ngày. Tồn kho bên dưới đã trừ lịch bận và ngày
              đệm giặt ủi cho đúng khoảng ngày này.
            </p>
          </section>

          {/* ---------------------------------------------------- sản phẩm -- */}
          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-3">
              <h2 className="h-section">3 · Chọn đồ</h2>
              <div className="relative mt-2">
                <IconSearch width={15} height={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Tìm tên sản phẩm, mã SKU hoặc quét QR cá thể..."
                  className="field pl-8"
                />
              </div>
            </header>

            <ul className="divide-y divide-line">
              {productResults.map((r) => {
                const soldOut = r.free.length === 0;
                return (
                  <li key={r.variantId} className={cn("flex items-center gap-3 p-3", soldOut && "opacity-60")}>
                    <ProductMedia image={r.image} ratio="1/1" className="h-10 w-10 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px]">{r.name}</p>
                      <p className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm border border-line" style={{ backgroundColor: r.colorHex }} />
                        {r.size} · {r.color} · {formatVnd(r.pricePerDay)}/ngày
                      </p>
                    </div>
                    {soldOut ? (
                      <StatusChip tone="danger">Hết trong khoảng ngày này</StatusChip>
                    ) : (
                      <>
                        <StatusChip tone={r.free.length === 1 ? "warning" : "success"}>còn {r.free.length}</StatusChip>
                        <button
                          type="button"
                          onClick={() => {
                            const unit = r.free[0];
                            setCart((p) => [
                              ...p,
                              {
                                productSlug: r.slug,
                                variantId: r.variantId,
                                unitCode: unit.unitCode,
                                label: r.name,
                                size: r.size,
                                color: r.color,
                                pricePerDay: r.pricePerDay,
                                deposit: r.deposit,
                              },
                            ]);
                            toast.push({ tone: "success", title: "Đã thêm vào đơn", body: `${r.name} · ${unit.unitCode}` });
                          }}
                          className="btn btn-outline btn-sm shrink-0"
                        >
                          Thêm
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
              {productResults.length === 0 && (
                <li>
                  <EmptyState
                    compact
                    title="Không có biến thể nào khớp"
                    body="Thử đổi khoảng ngày hoặc tìm bằng tên sản phẩm khác."
                  />
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* --------------------------------------------------------- giỏ -- */}
        <aside className="space-y-4 xl:sticky xl:top-[72px] xl:self-start">
          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-2.5">
              <h2 className="h-section">Đơn đang tạo</h2>
            </header>

            {cart.length === 0 ? (
              <EmptyState compact title="Chưa chọn món nào" body="Tìm và thêm đồ ở cột bên trái." />
            ) : (
              <ul className="divide-y divide-line">
                {cart.map((line, i) => (
                  <li key={line.unitCode} className="flex items-start gap-2.5 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px]">{line.label}</p>
                      <p className="text-[11.5px] text-ink-2">
                        {line.size} · {line.color}
                      </p>
                      <div className="mt-1">
                        <UnitCode code={line.unitCode} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num text-[12.5px]">{formatVnd(line.pricePerDay * days)}</p>
                      <p className="num text-[11px] text-ink-3">cọc {formatVnd(line.deposit)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart((p) => p.filter((_, idx) => idx !== i))}
                      aria-label="Bỏ khỏi đơn"
                      className="btn btn-ghost btn-sm btn-icon shrink-0"
                    >
                      <IconClose width={14} height={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-line px-4 py-3">
              <KeyValue label="Tiền thuê">{formatVnd(quote.subtotalRental)}</KeyValue>
              {quote.savedByTiers > 0 && (
                <p className="-mt-1 pb-1 text-[11px] text-success">
                  Đã áp gói thuê, rẻ hơn {formatVnd(quote.savedByTiers)} so với tính theo ngày lẻ
                </p>
              )}
              <KeyValue label="Tiền cọc">{formatVnd(quote.totalDeposit)}</KeyValue>
              <div className="mt-1 border-t border-line pt-1.5">
                <KeyValue label="Khách phải trả">
                  <span className="text-[15px] font-medium">{formatVnd(quote.grandTotal)}</span>
                </KeyValue>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="h-section mb-2.5">Thu tiền</h2>
            <div className="mb-3 flex gap-1.5">
              {(["cash", "bank_transfer"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-[12.5px] transition-colors",
                    method === m ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                  )}
                >
                  {m === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                </button>
              ))}
            </div>

            <label className="field-label" htmlFor="received">
              Khách đưa
            </label>
            <input
              id="received"
              inputMode="numeric"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              placeholder={String(quote.grandTotal)}
              className="field num hide-spin"
            />
            <div className="mt-2">
              <KeyValue label="Tiền thối">
                <span className={cn(change < 0 ? "text-danger" : "text-ink")}>
                  {change >= 0 ? formatVnd(change) : `thiếu ${formatVnd(-change)}`}
                </span>
              </KeyValue>
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-md border border-line p-2.5 text-[12px]">
              <input
                type="checkbox"
                checked={idTaken}
                onChange={() => setIdTaken((v) => !v)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
              />
              <span>
                Đã nhận giấy tờ thế chân
                <span className="mt-0.5 block text-[11px] text-ink-3">Hệ thống chỉ lưu ghi chú đối chiếu.</span>
              </span>
            </label>

            <button
              type="button"
              disabled={!canCreate}
              onClick={() => {
                toast.push({
                  tone: "success",
                  title: "Đã tạo đơn & bàn giao",
                  body: `${cart.length} cá thể chuyển sang Đang ở chỗ khách · thu ${formatVnd(quote.grandTotal)}.`,
                });
                setCart([]);
                setReceived("");
                setIdTaken(false);
              }}
              className="btn btn-block mt-3"
            >
              Tạo đơn & bàn giao ngay
            </button>

            {!canCreate && (
              <p className="mt-2 text-[11.5px] text-ink-3">
                {!customer
                  ? "Chọn khách hàng trước."
                  : cart.length === 0
                    ? "Thêm ít nhất một món."
                    : !idTaken
                      ? "Xác nhận đã nhận giấy tờ thế chân."
                      : "Số tiền khách đưa chưa đủ."}
              </p>
            )}
          </section>

          <Callout tone="info" icon={<IconCheck width={14} height={14} />}>
            Đơn tại quầy bỏ qua bước giữ chỗ và thanh toán online: tạo xong là chuyển thẳng sang Đang thuê, cá thể đã
            chọn bị khoá lịch ngay.
          </Callout>

          <Link href="/orders" className="btn btn-outline btn-sm btn-block">
            Về danh sách đơn
          </Link>
        </aside>
      </div>
    </>
  );
}

