"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConditionChip, UnitCode, UnitStatusChip } from "@/components/domain/Chips";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { IconAlert, IconArrowLeft, IconPlus } from "@/components/ui/Icons";
import { EmptyState, KeyValue, StatusChip, Tabs } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { UNITS } from "@/data/operations";
import { CATEGORIES, getCategory, OCCASIONS } from "@/data/catalog";
import { getProduct } from "@/data/products";
import { formatVnd } from "@/lib/money";
import { describeTiers } from "@/lib/pricing";
import { SETTINGS } from "@/lib/settings";
import { cn } from "@/lib/utils";

type Tab = "general" | "variants" | "pricing" | "units" | "rules";

export function ProductEditor({ slug }: { slug: string }) {
  const product = getProduct(slug);
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("general");
  const [dirty, setDirty] = useState(false);

  const units = useMemo(() => UNITS.filter((u) => u.productSlug === slug), [slug]);

  if (!product) {
    return (
      <div className="card">
        <EmptyState
          title="Không tìm thấy sản phẩm"
          body={`Không có sản phẩm nào ứng với mã ${slug}.`}
          action={
            <Link href="/products" className="btn btn-outline btn-sm">
              Về danh sách sản phẩm
            </Link>
          }
        />
      </div>
    );
  }

  const category = getCategory(product.categorySlug);

  return (
    <>
      <div className="mb-4">
        <Link href="/products" className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink">
          <IconArrowLeft width={13} height={13} />
          Sản phẩm
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProductMedia image={product.images[0]} ratio="1/1" className="h-11 w-11 shrink-0 rounded" />
            <div>
              <h1 className="h-page">{product.name}</h1>
              <p className="num mt-0.5 text-[12px] text-ink-2">
                {product.sku} · {category?.name} · {product.variants.length} biến thể · {units.length} cá thể
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <StatusChip tone="warning">Có thay đổi chưa lưu</StatusChip>}
            <Link href={`/inventory?q=${product.sku}`} className="btn btn-outline btn-sm">
              Xem cá thể
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "general", label: "Thông tin chung" },
            { key: "variants", label: "Biến thể", count: product.variants.length },
            { key: "pricing", label: "Gói thuê & cọc" },
            { key: "units", label: "Cá thể", count: units.length },
            { key: "rules", label: "Quy tắc thuê" },
          ]}
        />
      </div>

      <div className="pb-20">
        {/* ------------------------------------------------ thông tin chung -- */}
        {tab === "general" && (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <section className="card card-pad space-y-4">
              <h2 className="h-section">Thông tin cơ bản</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="p-name">
                    Tên sản phẩm
                  </label>
                  <input id="p-name" defaultValue={product.name} onChange={() => setDirty(true)} className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="p-sku">
                    Mã SKU
                  </label>
                  <input id="p-sku" defaultValue={product.sku} onChange={() => setDirty(true)} className="field num" />
                  <p className="field-hint">SKU là tiền tố của mọi mã cá thể, ví dụ {product.sku}-M-DO-001.</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="p-cat">
                    Danh mục
                  </label>
                  <select id="p-cat" defaultValue={product.categorySlug} onChange={() => setDirty(true)} className="field">
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="field-hint">
                    Danh mục quyết định số ngày đệm giặt ủi: {category?.cleanBufferDays} ngày.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="p-desc">
                    Mô tả
                  </label>
                  <textarea id="p-desc" rows={4} defaultValue={product.description} onChange={() => setDirty(true)} className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="p-material">
                    Chất liệu
                  </label>
                  <input id="p-material" defaultValue={product.material} onChange={() => setDirty(true)} className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="p-care">
                    Hướng dẫn bảo quản
                  </label>
                  <input id="p-care" defaultValue={product.careInstruction} onChange={() => setDirty(true)} className="field" />
                </div>
              </div>

              <div>
                <p className="field-label">Dịp sử dụng</p>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASIONS.map((o) => {
                    const active = product.occasions.includes(o.slug);
                    return (
                      <button
                        key={o.slug}
                        type="button"
                        onClick={() => setDirty(true)}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-[12px] transition-colors",
                          active ? "border-ink bg-beige" : "border-line hover:border-ink-3",
                        )}
                      >
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <section className="card card-pad">
                <h2 className="h-section mb-3">Ảnh sản phẩm</h2>
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((img) => (
                    <ProductMedia key={img.id} image={img} ratio="3/4" className="rounded" />
                  ))}
                  <button
                    type="button"
                    onClick={() => toast.push({ tone: "info", title: "Tải ảnh lên" })}
                    className="grid aspect-[3/4] place-items-center rounded border border-dashed border-line text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
                  >
                    <IconPlus width={16} height={16} />
                  </button>
                </div>
              </section>

              <section className="card card-pad">
                <h2 className="h-section mb-3">Giá trị & đền bù</h2>
                <div>
                  <label className="field-label" htmlFor="p-replacement">
                    Giá trị đền bù nếu mất
                  </label>
                  <input
                    id="p-replacement"
                    defaultValue={product.replacementValue}
                    onChange={() => setDirty(true)}
                    className="field num hide-spin"
                  />
                  <p className="field-hint">
                    Dùng để tính phí hư hỏng nặng (100%) và phí mất (100% + 20% phí cơ hội).
                  </p>
                </div>
                <div className="mt-3 space-y-1">
                  <KeyValue label="Hư hỏng nhẹ (10–30%)">
                    {formatVnd(product.replacementValue * 0.1)} – {formatVnd(product.replacementValue * 0.3)}
                  </KeyValue>
                  <KeyValue label="Hư hỏng nặng">{formatVnd(product.replacementValue)}</KeyValue>
                  <KeyValue label="Mất">{formatVnd(product.replacementValue * 1.2)}</KeyValue>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- biến thể -- */}
        {tab === "variants" && (
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="h-section">Biến thể size × màu</h2>
              <button
                type="button"
                onClick={() => toast.push({ tone: "info", title: "Thêm biến thể mới" })}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <IconPlus width={13} height={13} />
                Thêm biến thể
              </button>
            </header>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Màu</th>
                    <th className="text-right">Giá / ngày</th>
                    <th className="text-right">Ngày thêm</th>
                    <th className="text-right">Tiền cọc</th>
                    <th className="text-right">Cá thể</th>
                    <th>Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => {
                    const unitCount = units.filter((u) => u.variantId === v.id).length;
                    return (
                      <tr key={v.id}>
                        <td className="text-[12.5px]">{v.size}</td>
                        <td>
                          <span className="inline-flex items-center gap-2 text-[12.5px]">
                            <span
                              className="inline-block h-3 w-3 rounded-sm border border-line"
                              style={{ backgroundColor: v.colorHex }}
                            />
                            {v.color}
                          </span>
                        </td>
                        <td className="num text-right text-[12.5px]">{formatVnd(v.pricePerDay)}</td>
                        <td className="num text-right text-[12.5px] text-ink-2">{formatVnd(v.extraDayPrice)}</td>
                        <td className="num text-right text-[12.5px]">{formatVnd(v.depositAmount)}</td>
                        <td className="text-right">
                          {unitCount === 0 ? (
                            <StatusChip tone="danger">0</StatusChip>
                          ) : (
                            <span className="num text-[12.5px]">{unitCount}</span>
                          )}
                        </td>
                        <td className="num text-[11.5px] text-ink-3">{v.barcode}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-2.5 text-[11.5px] text-ink-3">
              Biến thể 0 cá thể vẫn hiển thị trong catalog nhưng luôn ở trạng thái hết đồ. Nhập thêm cá thể ở màn hình
              Kho để mở bán lại.
            </p>
          </section>
        )}

        {/* ------------------------------------------------- gói thuê & cọc -- */}
        {tab === "pricing" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card card-pad">
              <h2 className="h-section mb-1">Gói thuê</h2>
              <p className="mb-3 text-[12px] text-ink-2">
                Hệ thống luôn chọn tổ hợp rẻ nhất cho khách, nên gói phải rẻ hơn tổng giá ngày tương ứng.
              </p>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Gói</th>
                      <th className="text-right">Giá gói</th>
                      <th className="text-right">Quy ra / ngày</th>
                      <th className="text-right">Khách tiết kiệm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {describeTiers(product.variants[0]).map((row) => (
                      <tr key={row.days}>
                        <td className="text-[12.5px]">
                          {row.label}
                          {row.bestValue && (
                            <StatusChip tone="success" dot={false} className="ml-2">
                              Rẻ nhất
                            </StatusChip>
                          )}
                        </td>
                        <td className="num text-right text-[12.5px]">{formatVnd(row.price)}</td>
                        <td className="num text-right text-[12.5px] text-ink-2">{formatVnd(row.perDay)}</td>
                        <td className="num text-right text-[12.5px] text-success">
                          {row.saved > 0 ? formatVnd(row.saved) : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="text-[12.5px]">Ngày thuê thêm</td>
                      <td className="num text-right text-[12.5px]">{formatVnd(product.variants[0].extraDayPrice)}</td>
                      <td colSpan={2} className="text-right text-[11.5px] text-ink-3">
                        Áp cho ngày vượt quá gói dài nhất
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card card-pad">
              <h2 className="h-section mb-1">Tiền cọc</h2>
              <p className="mb-3 text-[12px] text-ink-2">
                Cọc hạch toán vào khoản phải trả người thuê, không tính vào doanh thu.
              </p>
              <KeyValue label="Cọc hiện tại">{formatVnd(product.baseDeposit)}</KeyValue>
              <KeyValue label="Giá trị đồ">{formatVnd(product.replacementValue)}</KeyValue>
              <KeyValue label="Tỷ lệ cọc / giá trị">
                {Math.round((product.baseDeposit / product.replacementValue) * 100)}%
              </KeyValue>
              <KeyValue label="Mặc định hệ thống">{Math.round(SETTINGS.deposit_rate_default * 100)}%</KeyValue>

              {product.baseDeposit / product.replacementValue < SETTINGS.deposit_rate_default - 0.2 && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-[12px] text-warning">
                  <IconAlert width={14} height={14} className="mt-px shrink-0" />
                  Cọc đang thấp hơn nhiều so với mức mặc định {Math.round(SETTINGS.deposit_rate_default * 100)}% giá trị
                  đồ — rủi ro khi khách làm hư hoặc mất.
                </div>
              )}
            </section>
          </div>
        )}

        {/* -------------------------------------------------------- cá thể -- */}
        {tab === "units" && (
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="h-section">Cá thể của sản phẩm</h2>
              <Link href={`/inventory?q=${product.sku}`} className="btn btn-outline btn-sm">
                Mở màn hình kho
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Mã cá thể</th>
                    <th>Biến thể</th>
                    <th>Trạng thái</th>
                    <th>Tình trạng</th>
                    <th className="text-right">Lượt thuê</th>
                    <th className="text-right">Doanh thu</th>
                    <th>Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.unitCode}>
                      <td>
                        <UnitCode code={u.unitCode} />
                      </td>
                      <td className="text-[12.5px] text-ink-2">
                        {u.size} · {u.color}
                      </td>
                      <td>
                        <UnitStatusChip status={u.status} />
                      </td>
                      <td>
                        <ConditionChip grade={u.conditionGrade} />
                      </td>
                      <td className="num text-right text-[12.5px]">{u.rentalCount}</td>
                      <td className="num text-right text-[12.5px]">{formatVnd(u.revenueToDate)}</td>
                      <td className="num text-[12px] text-ink-3">{u.location ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------- quy tắc -- */}
        {tab === "rules" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card card-pad">
              <h2 className="h-section mb-3">Quy tắc đặt thuê</h2>
              <KeyValue label="Buffer giặt ủi sau mỗi lượt">{category?.cleanBufferDays} ngày</KeyValue>
              <KeyValue label="Buffer chuẩn bị trước ngày nhận">{SETTINGS.prep_buffer_days} ngày</KeyValue>
              <KeyValue label="Cửa sổ đặt trước">
                {SETTINGS.min_lead_days} – {SETTINGS.max_advance_days} ngày
              </KeyValue>
              <KeyValue label="Thời gian thuê">
                {SETTINGS.min_rental_days} – {SETTINGS.max_rental_days} ngày
              </KeyValue>
              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">
                Buffer lấy theo danh mục. Đổi buffer ở phần Cài đặt danh mục sẽ ảnh hưởng tới lịch trống của mọi sản
                phẩm trong danh mục đó.
              </p>
            </section>

            <section className="card card-pad">
              <h2 className="h-section mb-3">Bảng size</h2>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Ngực</th>
                      <th>Eo</th>
                      <th>Mông</th>
                      <th>Dài</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizeChart.map((row) => (
                      <tr key={row.size}>
                        <td className="text-[12.5px]">{row.size}</td>
                        <td className="num text-[12.5px] text-ink-2">{row.bust}</td>
                        <td className="num text-[12.5px] text-ink-2">{row.waist}</td>
                        <td className="num text-[12.5px] text-ink-2">{row.hip}</td>
                        <td className="num text-[12.5px] text-ink-2">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* --------------------------------------------- thanh hành động dính -- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 px-4 py-2.5 backdrop-blur-md lg:pl-[calc(var(--sidebar-w)+1rem)]">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-3">
          <p className="text-[11.5px] text-ink-3">
            {dirty ? "Thay đổi chưa được lưu" : "Chưa có thay đổi nào"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                toast.push({ tone: "info", title: "Đã huỷ thay đổi" });
              }}
              className="btn btn-outline btn-sm"
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                toast.push({ tone: "success", title: "Đã lưu sản phẩm", body: product.name });
              }}
              className="btn btn-sm"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
