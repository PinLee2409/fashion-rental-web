"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { OrderStatusChip, UnitCode } from "@/components/domain/Chips";
import { ProductMedia } from "@/components/domain/ProductMedia";
import {
  IconAlert,
  IconCamera,
  IconCheck,
  IconClock,
  IconScan,
  IconSearch,
  IconShield,
} from "@/components/ui/Icons";
import { PageHeader, Section } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, Skeleton, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ORDERS, customerOfOrder, getUnit } from "@/data/operations";
import { getProduct } from "@/data/products";
import { useMounted } from "@/hooks";
import { RETURN_CONDITIONS, type ReturnCondition } from "@/lib/admin-types";
import { diffDays, formatDate, formatDateTime, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { calcLateFee } from "@/lib/policy";
import { SETTINGS, STORE } from "@/lib/settings";
import type { Order } from "@/lib/types";
import { UNIT_STATUS } from "@/lib/unit-status";
import { cn, deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

export default function ReturnsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
      <ReturnDesk />
    </Suspense>
  );
}

interface LineState {
  unitCode: string;
  scanned: boolean;
  condition: ReturnCondition;
  photos: number;
  note: string;
  feeOverride: number | null;
}

function ReturnDesk() {
  const params = useSearchParams();
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();
  const today = todayISO();

  const returnable = useMemo(
    () => ORDERS.filter((o) => ["in_use", "overdue", "inspecting"].includes(o.status)),
    [],
  );

  const [query, setQuery] = useState("");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [lines, setLines] = useState<Record<string, LineState>>({});

  useEffect(() => {
    const fromUrl = params.get("order");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromUrl) setOrderCode(fromUrl);
  }, [params]);

  const order = orderCode ? (ORDERS.find((o) => o.code === orderCode) ?? null) : null;

  // Khởi tạo trạng thái dòng khi chọn đơn
  useEffect(() => {
    if (!order) return;
    const init: Record<string, LineState> = {};
    for (const item of order.items) {
      for (const code of item.unitCodes ?? []) {
        init[code] = { unitCode: code, scanned: false, condition: "intact", photos: 0, note: "", feeOverride: null };
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(init);
  }, [order?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = deaccent(query.trim());
    if (!q) return returnable;
    return returnable.filter((o) =>
      deaccent(`${o.code} ${o.receiverName} ${o.receiverPhone} ${o.items.flatMap((i) => i.unitCodes ?? []).join(" ")}`).includes(q),
    );
  }, [query, returnable]);

  function scan(raw: string) {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setScanInput("");

    // Quét khi chưa chọn đơn → tìm đơn chứa cá thể đó
    if (!order) {
      const found = returnable.find((o) => o.items.some((i) => i.unitCodes?.includes(code)));
      if (found) {
        setOrderCode(found.code);
        toast.push({ tone: "success", title: "Đã tìm thấy đơn", body: `${code} thuộc ${found.code}` });
      } else {
        toast.push({
          tone: "danger",
          title: "Không tìm thấy đơn đang thuê cho mã này",
          body: `${code} — kiểm tra lại tem QR hoặc tìm đơn theo số điện thoại.`,
        });
      }
      return;
    }

    if (!lines[code]) {
      toast.push({
        tone: "danger",
        title: "Cá thể không thuộc đơn đang mở",
        body: `${code} không nằm trong ${order.code}. Kiểm tra lại trước khi nhận.`,
      });
      return;
    }
    setLines((p) => ({ ...p, [code]: { ...p[code], scanned: true } }));
    toast.push({ tone: "success", title: "Đã nhận lại cá thể", body: code });
  }

  /* -------------------------------------------------------- quyết toán -- */

  const settlement = useMemo(() => {
    if (!order) return null;
    const lateDays = Math.max(0, -diffDays(today, order.returnDate));
    const rows = Object.values(lines);

    let lateFee = 0;
    let conditionFee = 0;
    const details: { label: string; amount: number; reason: string; unitCode: string }[] = [];

    for (const line of rows) {
      if (!line.scanned) continue;
      const item = order.items.find((i) => i.unitCodes?.includes(line.unitCode));
      const product = item ? getProduct(item.productSlug) : undefined;
      const dailyRental = item ? Math.round(item.unitRentalPrice / Math.max(1, item.days)) : 0;
      const deposit = item?.lineDepositTotal ?? 0;

      if (lateDays > 0) {
        const fee = calcLateFee(lateDays, dailyRental, deposit);
        lateFee += fee;
        details.push({
          label: `Phí trễ ${lateDays} ngày`,
          amount: fee,
          reason: `${lateDays} ngày × ${SETTINGS.late_fee_rate} × ${formatVnd(dailyRental)}`,
          unitCode: line.unitCode,
        });
      }

      if (line.condition !== "intact") {
        const replacement = product?.replacementValue ?? 0;
        const suggested =
          line.condition === "dirty"
            ? 150_000
            : line.condition === "damage_minor"
              ? Math.round(replacement * 0.2)
              : line.condition === "damage_major"
                ? replacement
                : Math.round(replacement * 1.2);
        const amount = line.feeOverride ?? suggested;
        conditionFee += amount;
        details.push({
          label: RETURN_CONDITIONS.find((c) => c.key === line.condition)!.label,
          amount,
          reason: line.note || `Theo bảng phí tình trạng · gợi ý ${formatVnd(suggested)}`,
          unitCode: line.unitCode,
        });
      }
    }

    const scannedDeposit = rows
      .filter((l) => l.scanned)
      .reduce((sum, l) => {
        const item = order.items.find((i) => i.unitCodes?.includes(l.unitCode));
        return sum + (item?.lineDepositTotal ?? 0);
      }, 0);

    const heldForMissing = order.totalDeposit - scannedDeposit;
    const totalFee = lateFee + conditionFee;
    const refund = scannedDeposit - totalFee;
    const maxFee = Math.max(0, ...details.map((d) => d.amount));

    return {
      lateDays,
      details,
      lateFee,
      conditionFee,
      totalFee,
      scannedDeposit,
      heldForMissing,
      refund,
      needsApproval: maxFee > SETTINGS.staff_fee_limit || refund > SETTINGS.refund_auto_limit,
      missingEvidence: rows.some((l) => l.scanned && l.condition !== "intact" && l.photos === 0),
      allScanned: rows.every((l) => l.scanned),
      scannedCount: rows.filter((l) => l.scanned).length,
      totalCount: rows.length,
    };
  }, [order, lines, today]);

  /* ----------------------------------------------------------- render -- */

  if (!session.can("order.return_inspect")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconShield width={22} height={22} />}
          title="Bạn không có quyền nhận trả đồ"
          body="Chức năng này dành cho nhân viên bán hàng, kho và quản lý. Liên hệ Admin nếu bạn cần quyền order.return_inspect."
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Quầy nhận trả đồ"
        description="Quét mã cá thể hoặc tìm đơn, ghi tình trạng từng món rồi quyết toán cọc. Phí vượt hạn mức sẽ tự chuyển quản lý duyệt."
        breadcrumb={[{ label: "Vận hành" }, { label: "Quầy nhận trả" }]}
        actions={
          order ? (
            <button type="button" onClick={() => setOrderCode(null)} className="btn btn-outline btn-sm">
              Chọn đơn khác
            </button>
          ) : null
        }
      />

      {/* ---------------------------------------------------- thanh quét -- */}
      <div className="card card-pad mb-5">
        <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              scan(scanInput);
            }}
          >
            <label className="field-label" htmlFor="scan">
              Quét mã cá thể
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <IconScan width={15} height={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  id="scan"
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="AD-M-DO-003"
                  className="field num pl-8"
                />
              </div>
              <button type="submit" className="btn btn-sm shrink-0">
                Nhận
              </button>
            </div>
            <p className="field-hint">Dùng đầu đọc barcode hoặc camera. Quét khi chưa chọn đơn sẽ tự mở đúng đơn.</p>
          </form>

          <div>
            <label className="field-label" htmlFor="find-order">
              Hoặc tìm đơn theo mã / số điện thoại
            </label>
            <div className="relative">
              <IconSearch width={15} height={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                id="find-order"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="CR2026... hoặc 0908..."
                className="field pl-8"
              />
            </div>
            <p className="field-hint">{returnable.length} đơn đang thuê hoặc chờ lập biên bản.</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- chọn đơn xử lý -- */}
      {!order && (
        <Section title="Đơn có thể nhận trả" description="Sắp theo hạn trả — đơn quá hạn lên trước.">
          {results.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<IconScan width={22} height={22} />}
                title="Không tìm thấy đơn phù hợp"
                body="Thử quét lại mã trên tem QR, hoặc tìm bằng số điện thoại khách."
              />
            </div>
          ) : (
            <ul className="grid min-w-0 gap-2 lg:grid-cols-2">
              {[...results]
                .sort((a, b) => a.returnDate.localeCompare(b.returnDate))
                .map((o) => {
                  const late = diffDays(today, o.returnDate) < 0;
                  return (
                    <li key={o.code} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setOrderCode(o.code)}
                        className={cn(
                          "card card-pad w-full min-w-0 text-left transition-colors hover:border-ink-3",
                          late && "border-danger/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="num text-[12.5px]">{o.code}</p>
                            <p className="truncate text-[13.5px]">{o.receiverName}</p>
                            <p className="mt-1 truncate text-[12px] text-ink-2">
                              {o.items.map((i) => i.productNameSnapshot).join(" · ")}
                            </p>
                          </div>
                          <OrderStatusChip status={o.status} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 border-t border-line pt-2">
                          <span className={cn("num min-w-0 truncate text-[12px]", late ? "text-danger" : "text-ink-2")}>
                            Hạn trả {formatDate(o.returnDate)}
                            {mounted && late && ` · trễ ${Math.abs(diffDays(today, o.returnDate))} ngày`}
                          </span>
                          <span className="num text-[12px] text-ink-2">Cọc {formatVnd(o.totalDeposit)}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </Section>
      )}

      {/* -------------------------------------------------- xử lý nhận trả -- */}
      {order && settlement && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-4">
            <OrderBanner order={order} lateDays={settlement.lateDays} mounted={mounted} />

            <section className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <h2 className="h-section">Kiểm tra từng cá thể</h2>
                <span className="num text-[11.5px] text-ink-3">
                  {settlement.scannedCount}/{settlement.totalCount} đã nhận
                </span>
              </header>

              <ul className="divide-y divide-line">
                {order.items.flatMap((item) =>
                  (item.unitCodes ?? []).map((code) => {
                    const line = lines[code];
                    if (!line) return null;
                    const unit = getUnit(code);
                    const conditionMeta = RETURN_CONDITIONS.find((c) => c.key === line.condition)!;
                    const detail = settlement.details.filter((d) => d.unitCode === code && d.label !== `Phí trễ ${settlement.lateDays} ngày`);

                    return (
                      <li key={code} className={cn("p-4", !line.scanned && "bg-surface-2")}>
                        <div className="flex flex-wrap items-start gap-3">
                          <ProductMedia image={item.image} ratio="1/1" className="h-11 w-11 shrink-0 rounded" />
                          <div className="min-w-[200px] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <UnitCode code={code} muted={!line.scanned} />
                              {line.scanned ? (
                                <StatusChip tone="success">Đã nhận</StatusChip>
                              ) : (
                                <StatusChip tone="warning">Chưa quét</StatusChip>
                              )}
                            </div>
                            <p className="mt-1.5 text-[13px]">{item.productNameSnapshot}</p>
                            <p className="text-[11.5px] text-ink-2">
                              {item.variantSnapshot.size} · {item.variantSnapshot.color} · cọc{" "}
                              {formatVnd(item.lineDepositTotal)}
                            </p>
                          </div>

                          {!line.scanned && (
                            <button type="button" onClick={() => scan(code)} className="btn btn-outline btn-sm shrink-0">
                              Đánh dấu đã nhận
                            </button>
                          )}
                        </div>

                        {!line.scanned ? (
                          <Callout tone="warning" icon={<IconAlert width={13} height={13} />}>
                            Khách chưa trả món này. Phần đã trả vẫn xử lý bình thường, món thiếu giữ nguyên trạng thái
                            đang thuê và tiếp tục tính phí trễ.
                          </Callout>
                        ) : (
                          <div className="mt-3 space-y-3 border-t border-line pt-3">
                            <div>
                              <p className="field-label">Tình trạng khi trả</p>
                              <div className="flex flex-wrap gap-1.5">
                                {RETURN_CONDITIONS.map((c) => (
                                  <button
                                    key={c.key}
                                    type="button"
                                    onClick={() =>
                                      setLines((p) => ({ ...p, [code]: { ...p[code], condition: c.key, feeOverride: null } }))
                                    }
                                    className={cn(
                                      "rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                                      line.condition === c.key ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                                    )}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                              <p className="field-hint">
                                {conditionMeta.hint} · cá thể sẽ chuyển sang{" "}
                                <span className="text-ink">{UNIT_STATUS[conditionMeta.nextUnitStatus].label}</span>
                              </p>
                            </div>

                            {conditionMeta.requiresEvidence && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="field-label">Ảnh minh chứng (bắt buộc)</p>
                                  <button
                                    type="button"
                                    onClick={() => setLines((p) => ({ ...p, [code]: { ...p[code], photos: p[code].photos + 1 } }))}
                                    className={cn(
                                      "flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-[12px] transition-colors",
                                      line.photos === 0
                                        ? "border-danger/50 text-danger"
                                        : "border-line text-ink-2 hover:border-ink-3",
                                    )}
                                  >
                                    <IconCamera width={14} height={14} />
                                    {line.photos === 0 ? "Chưa có ảnh — bắt buộc" : `${line.photos} ảnh đã tải`}
                                  </button>
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`note-${code}`}>
                                    Mô tả tình trạng
                                  </label>
                                  <input
                                    id={`note-${code}`}
                                    value={line.note}
                                    onChange={(e) => setLines((p) => ({ ...p, [code]: { ...p[code], note: e.target.value } }))}
                                    placeholder="Ví dụ: rách 4cm ở tay áo trái"
                                    className="field"
                                  />
                                </div>
                              </div>
                            )}

                            {detail.map((d) => (
                              <div key={d.label} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-soft px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-[12.5px] text-warning">{d.label}</p>
                                  <p className="text-[11px] text-warning/80">{d.reason}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    inputMode="numeric"
                                    value={String(line.feeOverride ?? d.amount)}
                                    onChange={(e) =>
                                      setLines((p) => ({
                                        ...p,
                                        [code]: { ...p[code], feeOverride: Number(e.target.value.replace(/\D/g, "")) || 0 },
                                      }))
                                    }
                                    disabled={!session.can("fee.apply")}
                                    className="field num hide-spin h-7 w-[132px] text-right text-[12.5px]"
                                    aria-label="Số tiền phí"
                                  />
                                  <span className="text-[11.5px] text-warning/80">₫</span>
                                </div>
                              </div>
                            ))}

                            {unit && (
                              <p className="text-[11px] text-ink-3">
                                Cá thể đã thuê {unit.rentalCount} lượt · giặt lần cuối{" "}
                                {unit.lastCleanedAt ? formatDateTime(unit.lastCleanedAt) : "—"}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  }),
                )}
              </ul>
            </section>
          </div>

          {/* ------------------------------------------------- quyết toán -- */}
          <aside className="space-y-4 xl:sticky xl:top-[72px] xl:self-start">
            <section className="card card-pad">
              <p className="label-xs mb-2">Quyết toán cọc</p>

              <KeyValue label="Cọc đang giữ cả đơn">{formatVnd(order.totalDeposit)}</KeyValue>
              {settlement.heldForMissing > 0 && (
                <KeyValue label="Tạm giữ cho món chưa trả">
                  <span className="text-warning">{formatVnd(settlement.heldForMissing)}</span>
                </KeyValue>
              )}
              <KeyValue label="Cọc quyết toán đợt này">{formatVnd(settlement.scannedDeposit)}</KeyValue>

              <div className="mt-2 space-y-1 border-t border-line pt-2">
                {settlement.lateFee > 0 && (
                  <KeyValue label={`Phí trễ ${settlement.lateDays} ngày`}>
                    <span className="text-danger">−{formatVnd(settlement.lateFee)}</span>
                  </KeyValue>
                )}
                {settlement.conditionFee > 0 && (
                  <KeyValue label="Phí tình trạng">
                    <span className="text-danger">−{formatVnd(settlement.conditionFee)}</span>
                  </KeyValue>
                )}
                {settlement.totalFee === 0 && <KeyValue label="Phí phát sinh">Không có</KeyValue>}
              </div>

              <div className="mt-2 border-t border-line pt-2">
                {settlement.refund >= 0 ? (
                  <KeyValue label="Hoàn lại khách">
                    <span className="text-[15px] font-medium text-success">{formatVnd(settlement.refund)}</span>
                  </KeyValue>
                ) : (
                  <KeyValue label="Khách còn nợ">
                    <span className="text-[15px] font-medium text-danger">{formatVnd(-settlement.refund)}</span>
                  </KeyValue>
                )}
              </div>

              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                Cọc không phải doanh thu. Chỉ phần cọc bị trừ do phí phát sinh mới ghi nhận vào doanh thu.
              </p>
            </section>

            {settlement.missingEvidence && (
              <Callout tone="danger" icon={<IconAlert width={14} height={14} />} title="Thiếu ảnh minh chứng">
                Mọi khoản phí khác 0₫ đều phải có ít nhất một ảnh trong biên bản kiểm tra.
              </Callout>
            )}

            {settlement.needsApproval && (
              <Callout tone="warning" icon={<IconShield width={14} height={14} />} title="Cần quản lý duyệt">
                Có khoản phí vượt hạn mức nhân viên ({formatVnd(SETTINGS.staff_fee_limit)}) hoặc khoản hoàn vượt{" "}
                {formatVnd(SETTINGS.refund_auto_limit)}. Đơn sẽ chuyển sang trạng thái chờ duyệt thay vì hoàn tất ngay.
              </Callout>
            )}

            {!settlement.allScanned && (
              <Callout tone="warning" icon={<IconAlert width={14} height={14} />} title="Còn món chưa trả">
                {settlement.totalCount - settlement.scannedCount} cá thể chưa quét. Phần chưa trả tiếp tục tính phí trễ
                và giữ lại phần cọc tương ứng.
              </Callout>
            )}

            <div className="space-y-2">
              <button
                type="button"
                disabled={settlement.scannedCount === 0 || settlement.missingEvidence}
                onClick={() =>
                  toast.push({
                    tone: settlement.needsApproval ? "warning" : "success",
                    title: settlement.needsApproval ? "Đã gửi quản lý duyệt" : "Đã lưu biên bản & quyết toán",
                    body: settlement.needsApproval
                      ? "Đơn chuyển sang Chờ quản lý duyệt, khách sẽ được báo sau khi có kết quả."
                      : settlement.refund >= 0
                        ? `Hoàn ${formatVnd(settlement.refund)} về kênh thanh toán của khách.`
                        : `Ghi công nợ ${formatVnd(-settlement.refund)} cho khách.`,
                  })
                }
                className="btn btn-block"
              >
                {settlement.needsApproval ? "Gửi duyệt & hoàn tất" : "Lưu biên bản & quyết toán"}
              </button>
              <button
                type="button"
                onClick={() => toast.push({ tone: "info", title: "Đã lưu nháp biên bản" })}
                className="btn btn-outline btn-sm btn-block"
              >
                Lưu nháp
              </button>
            </div>

            <section className="card card-pad">
              <p className="label-xs mb-2">Sau khi nhận</p>
              <ul className="space-y-1.5 text-[12px] text-ink-2">
                {Object.values(lines)
                  .filter((l) => l.scanned)
                  .map((l) => {
                    const next = RETURN_CONDITIONS.find((c) => c.key === l.condition)!.nextUnitStatus;
                    return (
                      <li key={l.unitCode} className="flex items-center justify-between gap-2">
                        <UnitCode code={l.unitCode} />
                        <span className="text-[11.5px]">→ {UNIT_STATUS[next].label}</span>
                      </li>
                    );
                  })}
                {settlement.scannedCount === 0 && <li className="text-[11.5px] text-ink-3">Chưa quét cá thể nào.</li>}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}

function OrderBanner({ order, lateDays, mounted }: { order: Order; lateDays: number; mounted: boolean }) {
  const customer = customerOfOrder(order.code);
  return (
    <section className={cn("card card-pad", lateDays > 0 && "border-danger/40")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/orders/${order.code}`} className="num text-[13px] underline-offset-2 hover:underline">
              {order.code}
            </Link>
            <OrderStatusChip status={order.status} />
          </div>
          <p className="mt-1 text-[14px]">{order.receiverName}</p>
          <p className="num text-[12px] text-ink-2">{order.receiverPhone}</p>
          {customer && customer.damageIncidents > 0 && (
            <StatusChip tone="warning" className="mt-2">
              Khách từng có {customer.damageIncidents} lần hư hỏng
            </StatusChip>
          )}
        </div>

        <div className="text-right">
          <p className="text-[11.5px] text-ink-3">Hạn trả</p>
          <p className="num text-[13px]">
            {formatDate(order.returnDate)} {STORE.return_due_hour}:00
          </p>
          {mounted && lateDays > 0 && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-danger">
              <IconClock width={13} height={13} />
              Trễ {lateDays} ngày
            </p>
          )}
          {mounted && lateDays === 0 && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-success">
              <IconCheck width={13} height={13} />
              Đúng hạn
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
