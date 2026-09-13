"use client";

import QRCode from "qrcode";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Mã QR vẽ thẳng bằng SVG.
 *
 * Dùng QRCode.create() để lấy ma trận module rồi tự dựng path, thay vì
 * toDataURL: kết quả là vector nên in tem ở mọi khổ đều sắc nét, không phụ
 * thuộc effect và không có ảnh raster nặng trong DOM.
 */
export function QrCode({
  value,
  size = 120,
  quietZone = 2,
  className,
  title,
}: {
  value: string;
  /** Cạnh của mã, tính bằng px. */
  size?: number;
  /** Viền trắng quanh mã, tính theo số module — đầu đọc cần tối thiểu 2. */
  quietZone?: number;
  className?: string;
  title?: string;
}) {
  const { path, span } = useMemo(() => {
    const { modules } = QRCode.create(value || " ", { errorCorrectionLevel: "M" });
    const count = modules.size;
    const data = modules.data;
    let d = "";
    for (let y = 0; y < count; y += 1) {
      for (let x = 0; x < count; x += 1) {
        if (data[y * count + x]) d += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
      }
    }
    return { path: d, span: count + quietZone * 2 };
  }, [value, quietZone]);

  return (
    <svg
      viewBox={`0 0 ${span} ${span}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? `Mã QR ${value}`}
      className={cn("shrink-0", className)}
    >
      <rect width={span} height={span} fill="#fff" />
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/**
 * Tem dán lên cá thể trang phục. Mã QR mã hoá đúng mã cá thể, nhân viên quét
 * là ra ngay đơn hoặc hồ sơ cá thể tương ứng.
 */
export function UnitTag({
  unitCode,
  productName,
  size,
  color,
  qrSize = 96,
  className,
}: {
  unitCode: string;
  productName: string;
  size: string;
  color: string;
  qrSize?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 rounded-md border border-line bg-white p-3 text-ink", className)}>
      <QrCode value={unitCode} size={qrSize} />
      <div className="flex min-w-0 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <p className="num text-[13px] font-semibold leading-tight">{unitCode}</p>
          <p className="mt-1 truncate text-[11.5px] leading-tight">{productName}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-ink-2">
            Size {size} · {color}
          </p>
        </div>
        <p className="text-[9.5px] uppercase tracking-[0.14em] text-ink-3">StyleRent · Rental unit</p>
      </div>
    </div>
  );
}
