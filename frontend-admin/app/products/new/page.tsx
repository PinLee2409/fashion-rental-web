"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconAlert, IconArrowLeft, IconCheck, IconPlus, IconTag, IconTrash } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, StatusChip } from "@/components/ui/Primitives";
import { QrCode } from "@/components/ui/Qr";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES, OCCASIONS, getCategory } from "@/data/catalog";
import { PRODUCTS } from "@/data/products";
import { formatVnd } from "@/lib/money";
import { cn, deaccent, slugify } from "@/lib/utils";
import { useSession } from "@/store/session";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "Free"];

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Đỏ", hex: "#8f2f2b" },
  { name: "Trắng", hex: "#f3f0ec" },
  { name: "Đen", hex: "#1c1c1c" },
  { name: "Kem", hex: "#e8ddcd" },
  { name: "Xanh navy", hex: "#26364f" },
  { name: "Hồng", hex: "#d8a3a8" },
  { name: "Vàng", hex: "#c9a227" },
  { name: "Xanh rêu", hex: "#4a5a43" },
];

interface ColorRow {
  id: string;
  name: string;
  hex: string;
}

/** Mã màu 2 ký tự dùng trong mã cá thể, giống quy ước của dữ liệu hiện có. */
function colorCode(name: string): string {
  return deaccent(name).replace(/[^a-z]/g, "").slice(0, 2).toUpperCase() || "XX";
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export default function NewProductPage() {
  const router = useRouter();
  const session = useSession();
  const toast = useToast();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [categorySlug, setCategorySlug] = useState(CATEGORIES[0]?.slug ?? "");
  const [brandLine, setBrandLine] = useState("");
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [careInstruction, setCareInstruction] = useState("Giặt hấp chuyên nghiệp, không vắt, treo móc có đệm vai.");
  const [occasions, setOccasions] = useState<string[]>([]);

  const [sizes, setSizes] = useState<string[]>(["S", "M", "L"]);
  const [colors, setColors] = useState<ColorRow[]>([{ id: "c1", name: "Đỏ", hex: "#8f2f2b" }]);

  const [pricePerDay, setPricePerDay] = useState("350000");
  const [deposit, setDeposit] = useState("1500000");
  const [replacementValue, setReplacementValue] = useState("6000000");
  const [unitsPerVariant, setUnitsPerVariant] = useState("2");
  const [publishNow, setPublishNow] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const autoSku = useMemo(() => {
    const words = deaccent(name).replace(/[^a-z\s]/g, "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase().padEnd(2, "X");
  }, [name]);

  const effectiveSku = (skuTouched ? sku : autoSku).toUpperCase();
  const category = getCategory(categorySlug);

  const numPrice = toNumber(pricePerDay);
  const numDeposit = toNumber(deposit);
  const numReplacement = toNumber(replacementValue);
  const numUnits = Math.max(0, toNumber(unitsPerVariant));

  const variants = useMemo(() => {
    const out: { size: string; color: ColorRow; barcode: string }[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        if (!color.name.trim()) continue;
        // Chưa nhập tên sản phẩm thì SKU còn rỗng — dùng chữ SKU để xem trước cho dễ đọc.
        out.push({ size, color, barcode: `${effectiveSku || "SKU"}-${size}-${colorCode(color.name)}` });
      }
    }
    return out;
  }, [sizes, colors, effectiveSku]);

  const tiers = useMemo(
    () => [
      { days: 3, price: roundTo(numPrice * 2.57, 50_000), label: "Gói 3 ngày" },
      { days: 7, price: roundTo(numPrice * 4.15, 50_000), label: "Gói 7 ngày" },
    ],
    [numPrice],
  );
  const extraDayPrice = Math.max(50_000, roundTo(numPrice * 0.43, 50_000));

  const errors: string[] = [];
  if (name.trim().length < 4) errors.push("Tên sản phẩm cần ít nhất 4 ký tự.");
  if (effectiveSku.length < 2) errors.push("Mã SKU cần ít nhất 2 ký tự.");
  if (PRODUCTS.some((p) => p.sku.toUpperCase() === effectiveSku)) errors.push(`Mã SKU ${effectiveSku} đã được dùng.`);
  if (sizes.length === 0) errors.push("Chọn ít nhất một size.");
  if (colors.filter((c) => c.name.trim()).length === 0) errors.push("Thêm ít nhất một màu.");
  if (numPrice < 50_000) errors.push("Giá thuê mỗi ngày phải từ 50.000₫.");
  if (numDeposit < numPrice) errors.push("Tiền cọc phải lớn hơn giá thuê một ngày.");
  if (numReplacement < numDeposit) errors.push("Giá trị đền bù khi mất phải lớn hơn hoặc bằng tiền cọc.");

  const valid = errors.length === 0;

  if (!session.can("catalog.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconTag width={22} height={22} />}
          title="Bạn không có quyền tạo sản phẩm"
          body="Thêm sản phẩm mới vào catalog là quyền của Quản lý và Admin."
          action={
            <Link href="/products" className="btn btn-outline btn-sm">
              Về danh sách sản phẩm
            </Link>
          }
        />
      </div>
    );
  }

  function submit() {
    setSubmitted(true);
    if (!valid) return;
    toast.push({
      tone: "success",
      title: `Đã tạo ${name.trim()}`,
      body: `${variants.length} biến thể · ${variants.length * numUnits} cá thể chờ dán tem QR${
        publishNow ? " · đã hiện trên catalog khách" : " · đang ở trạng thái nháp"
      }`,
    });
    router.push("/products");
  }

  return (
    <>
      <div className="mb-1">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink">
          <IconArrowLeft width={13} height={13} />
          Sản phẩm
        </Link>
      </div>

      <PageHeader
        title="Thêm sản phẩm"
        description="Sản phẩm là mẫu trang phục. Mỗi tổ hợp size × màu là một biến thể, và mỗi biến thể sinh ra số cá thể vật lý tương ứng — chính các cá thể này mới có lịch bận và mã QR."
      />

      <div className="grid gap-4 pb-24 lg:grid-cols-[1.45fr_1fr]">
        <div className="min-w-0 space-y-4">
          {/* ------------------------------------------------ thông tin cơ bản -- */}
          <section className="card card-pad space-y-4">
            <h2 className="h-section">Thông tin cơ bản</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="np-name">
                  Tên sản phẩm
                </label>
                <input
                  id="np-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Áo dài gấm thêu tay Hoàng Mai"
                  className={cn("field", submitted && name.trim().length < 4 && "field-error")}
                />
                {name.trim() && <p className="field-hint">Đường dẫn khách thấy: /products/{slugify(name) || "…"}</p>}
              </div>

              <div>
                <label className="field-label" htmlFor="np-sku">
                  Mã SKU
                </label>
                <input
                  id="np-sku"
                  value={skuTouched ? sku : autoSku}
                  onChange={(e) => {
                    setSkuTouched(true);
                    setSku(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                  }}
                  placeholder="AD"
                  className={cn("field num", submitted && effectiveSku.length < 2 && "field-error")}
                />
                <p className="field-hint">
                  {skuTouched ? "Tự nhập" : "Gợi ý từ tên sản phẩm"} · là tiền tố mọi mã cá thể, ví dụ{" "}
                  <span className="num">{effectiveSku || "AD"}-M-DO-001</span>
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="np-cat">
                  Danh mục
                </label>
                <select
                  id="np-cat"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="field-hint">
                  Danh mục quyết định số ngày đệm giặt ủi sau mỗi lượt thuê: {category?.cleanBufferDays ?? 1} ngày.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="np-brand">
                  Dòng sản phẩm
                </label>
                <input
                  id="np-brand"
                  value={brandLine}
                  onChange={(e) => setBrandLine(e.target.value)}
                  placeholder="StyleRent Heritage"
                  className="field"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="np-desc">
                  Mô tả
                </label>
                <textarea
                  id="np-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chất liệu, phom dáng và dịp mặc phù hợp."
                  className="field"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="np-material">
                  Chất liệu
                </label>
                <input
                  id="np-material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Gấm lụa tơ tằm, lót voan"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="np-care">
                  Hướng dẫn bảo quản
                </label>
                <input
                  id="np-care"
                  value={careInstruction}
                  onChange={(e) => setCareInstruction(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div>
              <p className="field-label">Dịp phù hợp</p>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((o) => {
                  const on = occasions.includes(o.slug);
                  return (
                    <button
                      key={o.slug}
                      type="button"
                      onClick={() =>
                        setOccasions((p) => (on ? p.filter((x) => x !== o.slug) : [...p, o.slug]))
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                        on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-ink-3",
                      )}
                    >
                      {o.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------- biến thể -- */}
          <section className="card card-pad space-y-4">
            <div>
              <h2 className="h-section">Biến thể</h2>
              <p className="mt-0.5 text-[12px] text-ink-2">
                Chọn size và màu, hệ thống sinh đủ tổ hợp. Biến thể không có cá thể nào sẽ luôn hiện hết hàng với khách.
              </p>
            </div>

            <div>
              <p className="field-label">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_OPTIONS.map((s) => {
                  const on = sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSizes((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                      className={cn(
                        "min-w-[46px] rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                        on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-ink-3",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {submitted && sizes.length === 0 && <p className="field-hint text-danger">Chọn ít nhất một size.</p>}
            </div>

            <div>
              <p className="field-label">Màu</p>
              <div className="space-y-2">
                {colors.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) =>
                        setColors((p) => p.map((x) => (x.id === c.id ? { ...x, hex: e.target.value } : x)))
                      }
                      aria-label={`Mã màu của ${c.name || "màu " + (i + 1)}`}
                      className="h-[34px] w-[46px] shrink-0 cursor-pointer rounded-md border border-line bg-surface p-1"
                    />
                    <input
                      value={c.name}
                      onChange={(e) =>
                        setColors((p) => p.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Tên màu"
                      className="field flex-1"
                      aria-label={`Tên màu ${i + 1}`}
                    />
                    <span className="num w-[42px] shrink-0 text-center text-[12px] text-ink-3">
                      {colorCode(c.name)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setColors((p) => p.filter((x) => x.id !== c.id))}
                      disabled={colors.length === 1}
                      aria-label={`Xoá màu ${c.name}`}
                      className="btn btn-ghost btn-sm btn-icon shrink-0"
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11.5px] text-ink-3">Thêm nhanh:</span>
                {COLOR_PRESETS.filter((preset) => !colors.some((c) => c.name === preset.name)).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setColors((p) => [...p, { id: `c${Date.now()}${p.length}`, name: preset.name, hex: preset.hex }])
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] text-ink-2 transition-colors hover:border-ink-3"
                  >
                    <span className="h-2.5 w-2.5 rounded-full border border-line" style={{ background: preset.hex }} />
                    {preset.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setColors((p) => [...p, { id: `c${Date.now()}${p.length}`, name: "", hex: "#999999" }])}
                  className="btn btn-outline btn-sm gap-1"
                >
                  <IconPlus width={12} height={12} />
                  Màu khác
                </button>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="np-units">
                Số cá thể cho mỗi biến thể
              </label>
              <input
                id="np-units"
                value={unitsPerVariant}
                onChange={(e) => setUnitsPerVariant(e.target.value.replace(/\D/g, ""))}
                className="field num hide-spin max-w-[140px]"
              />
              <p className="field-hint">
                Tạo ra {variants.length * numUnits} cá thể vật lý, mỗi cá thể một mã QR riêng để dán lên nhãn.
              </p>
            </div>
          </section>

          {/* --------------------------------------------------- giá & cọc -- */}
          <section className="card card-pad space-y-4">
            <div>
              <h2 className="h-section">Giá thuê, cọc & đền bù</h2>
              <p className="mt-0.5 text-[12px] text-ink-2">
                Gói 3 ngày và 7 ngày được tính sẵn theo công thức của shop, sửa lại từng biến thể sau khi tạo cũng được.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="np-price">
                  Giá thuê / ngày
                </label>
                <input
                  id="np-price"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(e.target.value.replace(/\D/g, ""))}
                  className={cn("field num hide-spin", submitted && numPrice < 50_000 && "field-error")}
                />
                <p className="field-hint">{formatVnd(numPrice)}</p>
              </div>
              <div>
                <label className="field-label" htmlFor="np-deposit">
                  Tiền cọc
                </label>
                <input
                  id="np-deposit"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ""))}
                  className={cn("field num hide-spin", submitted && numDeposit < numPrice && "field-error")}
                />
                <p className="field-hint">Hoàn lại cho khách, không tính vào doanh thu.</p>
              </div>
              <div>
                <label className="field-label" htmlFor="np-replacement">
                  Giá trị đền bù khi mất
                </label>
                <input
                  id="np-replacement"
                  value={replacementValue}
                  onChange={(e) => setReplacementValue(e.target.value.replace(/\D/g, ""))}
                  className={cn("field num hide-spin", submitted && numReplacement < numDeposit && "field-error")}
                />
                <p className="field-hint">Dùng khi lập biên bản mất đồ ở quầy nhận trả.</p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface-2 p-3">
              <p className="label-xs mb-2">Bảng giá sinh tự động</p>
              <KeyValue label="1 ngày">{formatVnd(numPrice)}</KeyValue>
              {tiers.map((t) => (
                <KeyValue key={t.days} label={t.label}>
                  {formatVnd(t.price)}
                  <span className="ml-1.5 text-[11.5px] text-success">
                    tiết kiệm {formatVnd(Math.max(0, numPrice * t.days - t.price))}
                  </span>
                </KeyValue>
              ))}
              <KeyValue label="Mỗi ngày vượt gói">{formatVnd(extraDayPrice)}</KeyValue>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------ cột xem trước -- */}
        <aside className="min-w-0 space-y-4">
          <section className="card card-pad">
            <h2 className="h-section mb-3">Tóm tắt</h2>
            <KeyValue label="Biến thể sinh ra">{variants.length}</KeyValue>
            <KeyValue label="Cá thể vật lý">{variants.length * numUnits}</KeyValue>
            <KeyValue label="Đệm giặt ủi">{category?.cleanBufferDays ?? 1} ngày</KeyValue>
            <KeyValue label="Trạng thái">
              {publishNow ? <StatusChip tone="success">Hiện với khách</StatusChip> : <StatusChip tone="neutral">Nháp</StatusChip>}
            </KeyValue>

            <label className="mt-3 flex cursor-pointer select-none items-start gap-2 border-t border-line pt-3 text-[12.5px] text-ink-2">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-ink)]"
              />
              <span>
                Hiện ngay trên catalog khách
                <span className="mt-0.5 block text-[11px] text-ink-3">
                  Chỉ bật khi đã dán tem QR và nhập cá thể vào kho, nếu không khách đặt được đồ chưa có hàng.
                </span>
              </span>
            </label>
          </section>

          <section className="card card-pad">
            <h2 className="h-section mb-1">Mã cá thể sẽ sinh</h2>
            <p className="mb-3 text-[12px] text-ink-2">Mỗi cá thể một tem QR. Đây là mã của cá thể đầu tiên.</p>

            {variants.length === 0 ? (
              <p className="text-[12px] text-ink-3">Chọn size và màu để xem trước mã.</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="rounded-md border border-line bg-white p-1.5">
                    <QrCode value={`${variants[0].barcode}-001`} size={72} />
                  </span>
                  <div className="min-w-0">
                    <p className="num text-[13px]">{variants[0].barcode}-001</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-2">
                      {name.trim() || "Tên sản phẩm"} · Size {variants[0].size} · {variants[0].color.name}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 max-h-[220px] space-y-1 overflow-y-auto border-t border-line pt-3">
                  {variants.slice(0, 12).map((v) => (
                    <li key={v.barcode} className="flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="num text-ink-2">{v.barcode}-001…{String(numUnits).padStart(3, "0")}</span>
                      <span className="flex items-center gap-1.5 text-ink-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-line"
                          style={{ background: v.color.hex }}
                        />
                        {v.size}
                      </span>
                    </li>
                  ))}
                  {variants.length > 12 && (
                    <li className="text-[11.5px] text-ink-3">và {variants.length - 12} biến thể khác…</li>
                  )}
                </ul>
              </>
            )}
          </section>

          {submitted && !valid && (
            <Callout tone="danger" icon={<IconAlert width={15} height={15} />} title="Chưa tạo được sản phẩm">
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Callout>
          )}

          {valid && (
            <Callout tone="success" icon={<IconCheck width={15} height={15} />}>
              Sẵn sàng tạo. Sau khi tạo, vào Kho cá thể để in tem QR và nhập từng cá thể vào hệ thống.
            </Callout>
          )}
        </aside>
      </div>

      {/* -------------------------------------------------------- thanh lưu -- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-3 py-2.5 backdrop-blur-md sm:px-5">
        <div className="mx-auto flex w-full max-w-[1560px] items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
            {variants.length > 0
              ? `${variants.length} biến thể · ${variants.length * numUnits} cá thể · ${formatVnd(numPrice)}/ngày`
              : "Chưa có biến thể nào"}
          </p>
          <Link href="/products" className="btn btn-outline btn-sm">
            Huỷ
          </Link>
          <button
            type="button"
            onClick={() => toast.push({ tone: "info", title: "Đã lưu nháp", body: name.trim() || "Sản phẩm chưa đặt tên" })}
            className="btn btn-outline btn-sm"
          >
            Lưu nháp
          </button>
          <button type="button" onClick={submit} className="btn btn-sm">
            Tạo sản phẩm
          </button>
        </div>
      </div>
    </>
  );
}

function toNumber(value: string): number {
  return Number(value.replace(/\D/g, "")) || 0;
}
