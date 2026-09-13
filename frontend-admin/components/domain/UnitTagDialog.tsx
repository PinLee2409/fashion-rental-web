"use client";

import { createPortal } from "react-dom";
import { IconPrinter } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout } from "@/components/ui/Primitives";
import { QrCode, UnitTag } from "@/components/ui/Qr";
import { useMounted } from "@/hooks";
import type { RentalUnit } from "@/lib/admin-types";

const PREVIEW_LIMIT = 8;

/**
 * Xem và in tem QR của cá thể.
 *
 * Mã QR mã hoá đúng chuỗi mã cá thể (ví dụ AD-M-DO-003) nên bất kỳ đầu đọc nào
 * — camera trong app, máy quét cầm tay — cũng ra cùng một giá trị, khớp với
 * ô nhập mã ở quầy bàn giao và quầy nhận trả.
 *
 * Khi in, CSS @media print chỉ giữ lại vùng .print-root nên bản in sạch, không
 * dính sidebar hay header.
 */
export function UnitTagDialog({
  open,
  onClose,
  units,
}: {
  open: boolean;
  onClose: () => void;
  units: RentalUnit[];
}) {
  const mounted = useMounted();
  const preview = units.slice(0, PREVIEW_LIMIT);
  const rest = units.length - preview.length;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={units.length === 1 ? `Tem QR · ${units[0]?.unitCode}` : `Tem QR · ${units.length} cá thể`}
        description="Tem dán lên nhãn trang phục. Khổ tem 60 × 30 mm, in trên giấy decal A4."
        width="max-w-[640px]"
        footer={
          <>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Đóng
            </button>
            <button
              type="button"
              disabled={units.length === 0}
              onClick={() => window.print()}
              className="btn btn-sm gap-1.5"
            >
              <IconPrinter width={14} height={14} />
              In {units.length} tem
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {preview.map((u) => (
              <UnitTag
                key={u.unitCode}
                unitCode={u.unitCode}
                productName={u.productName}
                size={u.size}
                color={u.color}
              />
            ))}
          </div>
          {rest > 0 && (
            <p className="text-center text-[12px] text-ink-3">
              và {rest} tem khác — bản in đầy đủ gồm {units.length} tem
            </p>
          )}
          <Callout tone="info">
            Mã in trên tem là mã cá thể, không phải mã đơn. Mỗi cá thể có một mã riêng để lần được lịch sử thuê, số lần
            giặt và chi phí sửa chữa của chính nó.
          </Callout>
        </div>
      </Modal>

      {open && mounted
        ? createPortal(
            <div className="print-root">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6mm" }}>
                {units.map((u) => (
                  <div
                    key={u.unitCode}
                    style={{
                      border: "1px solid #d4d4d4",
                      borderRadius: "2mm",
                      padding: "3mm",
                      display: "flex",
                      gap: "3mm",
                      breakInside: "avoid",
                      color: "#181818",
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                    }}
                  >
                    <QrCode value={u.unitCode} size={64} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "10pt", fontWeight: 600, margin: 0 }}>{u.unitCode}</p>
                      <p style={{ fontSize: "8pt", margin: "1mm 0 0" }}>{u.productName}</p>
                      <p style={{ fontSize: "7.5pt", margin: "0.5mm 0 0", color: "#737373" }}>
                        Size {u.size} · {u.color}
                      </p>
                      <p style={{ fontSize: "6pt", letterSpacing: "0.12em", margin: "2mm 0 0", color: "#a3a3a3" }}>
                        STYLERENT
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
