"use client";

import { useState } from "react";
import { IconAlert } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout, KeyValue } from "@/components/ui/Primitives";
import { formatVnd } from "@/lib/money";
import type { Product, Variant } from "@/lib/types";
import { cn, deaccent } from "@/lib/utils";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "Free"];
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function colorCodeOf(name: string): string {
  return deaccent(name).replace(/[^a-z]/g, "").slice(0, 2).toUpperCase() || "XX";
}

/**
 * Thêm biến thể size × màu cho một sản phẩm đã có.
 *
 * Barcode của biến thể là tiền tố của mọi mã cá thể thuộc biến thể đó, nên
 * phải duy nhất trong phạm vi sản phẩm — form chặn trùng size × màu ngay.
 */
export function VariantDialog({
  open,
  product,
  existing,
  onClose,
  onCreate,
}: {
  open: boolean;
  product: Product;
  existing: Variant[];
  onClose: () => void;
  onCreate: (variant: Variant) => void;
}) {
  const reference = product.variants[0];
  const [size, setSize] = useState(SIZE_OPTIONS[2]);
  const [color, setColor] = useState("");
  const [hex, setHex] = useState("#8f2f2b");
  const [pricePerDay, setPricePerDay] = useState(String(reference?.pricePerDay ?? product.basePrice));
  const [depositAmount, setDepositAmount] = useState(String(reference?.depositAmount ?? product.baseDeposit));
  const [unitCount, setUnitCount] = useState("2");
  const [submitted, setSubmitted] = useState(false);

  const toNumber = (v: string) => Number(v.replace(/[^0-9]/g, "")) || 0;
  const price = toNumber(pricePerDay);
  const deposit = toNumber(depositAmount);
  const units = toNumber(unitCount);
  const barcode = `${product.sku}-${size}-${colorCodeOf(color)}`;

  const duplicate =
    color.trim().length > 0 &&
    existing.some((v) => v.size === size && deaccent(v.color) === deaccent(color.trim()));

  const errors: string[] = [];
  if (color.trim().length < 2) errors.push("Nhập tên màu.");
  if (duplicate) errors.push(`Biến thể ${size} · ${color.trim()} đã tồn tại.`);
  if (price < 50_000) errors.push("Giá thuê mỗi ngày phải từ 50.000₫.");
  if (deposit < price) errors.push("Tiền cọc phải lớn hơn giá thuê một ngày.");
  const valid = errors.length === 0;

  function submit() {
    setSubmitted(true);
    if (!valid) return;
    onCreate({
      id: `v-new-${Date.now()}`,
      productId: product.id,
      size,
      color: color.trim(),
      colorHex: hex,
      pricePerDay: price,
      depositAmount: deposit,
      extraDayPrice: Math.max(50_000, roundTo(price * 0.43, 50_000)),
      tiers: [
        { days: 3, price: roundTo(price * 2.57, 50_000), label: "Gói 3 ngày" },
        { days: 7, price: roundTo(price * 4.15, 50_000), label: "Gói 7 ngày" },
      ],
      unitCount: units,
      barcode,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm biến thể"
      description={`Biến thể mới của ${product.name}. Mã cá thể sinh theo SKU sản phẩm nên không trùng với biến thể khác.`}
      width="max-w-[560px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" onClick={submit} className="btn btn-sm">
            Thêm biến thể
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="field-label">Size</p>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "min-w-[46px] rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                  size === s ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-ink-3",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <div>
            <label className="field-label" htmlFor="v-hex">
              Mã màu
            </label>
            <input
              id="v-hex"
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-[34px] w-[56px] cursor-pointer rounded-md border border-line bg-surface p-1"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="v-color">
              Tên màu
            </label>
            <input
              id="v-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Đỏ đô"
              className={cn("field", submitted && (color.trim().length < 2 || duplicate) && "field-error")}
            />
          </div>
          <div>
            <p className="field-label">Barcode</p>
            <p className="num flex h-[34px] items-center text-[12.5px] text-ink-2">{barcode}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="v-price">
              Giá thuê / ngày
            </label>
            <input
              id="v-price"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value.replace(/[^0-9]/g, ""))}
              className={cn("field num hide-spin", submitted && price < 50_000 && "field-error")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="v-deposit">
              Tiền cọc
            </label>
            <input
              id="v-deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9]/g, ""))}
              className={cn("field num hide-spin", submitted && deposit < price && "field-error")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="v-units">
              Số cá thể
            </label>
            <input
              id="v-units"
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value.replace(/[^0-9]/g, ""))}
              className="field num hide-spin"
            />
          </div>
        </div>

        <div className="card card-pad bg-surface-2">
          <p className="label-xs mb-2">Bảng giá sinh tự động</p>
          <KeyValue label="Gói 3 ngày">{formatVnd(roundTo(price * 2.57, 50_000))}</KeyValue>
          <KeyValue label="Gói 7 ngày">{formatVnd(roundTo(price * 4.15, 50_000))}</KeyValue>
          <KeyValue label="Mỗi ngày vượt gói">{formatVnd(Math.max(50_000, roundTo(price * 0.43, 50_000)))}</KeyValue>
        </div>

        {submitted && !valid ? (
          <Callout tone="danger" icon={<IconAlert width={15} height={15} />}>
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Callout>
        ) : (
          <Callout tone="info">
            {units} cá thể sẽ được tạo với mã {barcode}-001 … {barcode}-{String(units).padStart(3, "0")}. In tem QR ở màn
            hình Kho cá thể sau khi lưu.
          </Callout>
        )}
      </div>
    </Modal>
  );
}
