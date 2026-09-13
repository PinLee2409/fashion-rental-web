"use client";

import { useMemo, useState } from "react";
import { UnitStatusChip } from "@/components/domain/Chips";
import { IconAlert, IconScan, IconSearch } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout, KeyValue } from "@/components/ui/Primitives";
import { STAFF, UNITS, nextBookingOfUnit } from "@/data/operations";
import type { MaintenanceTask, MaintenanceType, RentalUnit } from "@/lib/admin-types";
import { formatDate } from "@/lib/date";
import { MAINTENANCE_TYPE, UNIT_STATUS } from "@/lib/unit-status";
import { cn, deaccent } from "@/lib/utils";

const TYPES: MaintenanceType[] = ["cleaning", "repair", "alteration"];

/**
 * Tạo việc giặt ủi / sửa chữa thủ công (UC-15).
 *
 * Việc thường sinh tự động từ biên bản nhận trả; form này dành cho các trường
 * hợp phát hiện tại kho — mốc, bung chỉ, cần sửa vừa người trước một booking.
 * Hạn hoàn thành mặc định lấy theo booking kế tiếp của chính cá thể đó, vì đó
 * mới là thời điểm thật sự phải xong.
 */
export function MaintenanceDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (task: MaintenanceTask) => void;
}) {
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<RentalUnit | null>(null);
  const [type, setType] = useState<MaintenanceType>("cleaning");
  const [reason, setReason] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [cost, setCost] = useState("0");
  const [submitted, setSubmitted] = useState(false);

  const warehouseStaff = useMemo(() => STAFF.filter((s) => s.role === "warehouse" || s.role === "manager"), []);

  const results = useMemo(() => {
    const q = deaccent(query.trim());
    if (!q) return [];
    return UNITS.filter((u) => deaccent(`${u.unitCode} ${u.productName} ${u.color}`).includes(q)).slice(0, 6);
  }, [query]);

  const nextBooking = unit ? nextBookingOfUnit(unit.unitCode) : null;

  const errors: string[] = [];
  if (!unit) errors.push("Chọn cá thể cần xử lý.");
  if (reason.trim().length < 5) errors.push("Mô tả lý do ít nhất 5 ký tự để người nhận việc biết phải làm gì.");
  if (unit && (unit.status === "retired" || unit.status === "lost")) {
    errors.push(`Cá thể đang ở trạng thái ${UNIT_STATUS[unit.status].label}, không đưa vào hàng đợi được.`);
  }
  const valid = errors.length === 0;

  function submit() {
    setSubmitted(true);
    if (!valid || !unit) return;
    onCreate({
      id: `mt-new-${Date.now()}`,
      unitId: unit.id,
      unitCode: unit.unitCode,
      productName: unit.productName,
      variantLabel: `${unit.size} · ${unit.color}`,
      type,
      status: "todo",
      reason: reason.trim(),
      assignedTo: assignedTo || null,
      cost: Number(cost.replace(/[^0-9]/g, "")) || 0,
      startedAt: null,
      finishedAt: null,
      dueAt: nextBooking?.pickupDate ?? null,
      nextBookingDate: nextBooking?.pickupDate ?? null,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo việc giặt ủi / sửa chữa"
      description="Dùng khi phát hiện vấn đề tại kho. Việc sinh từ biên bản nhận trả đã tự vào hàng đợi, không cần tạo lại."
      width="max-w-[600px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" onClick={submit} className="btn btn-sm">
            Đưa vào hàng đợi
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ------------------------------------------------- chọn cá thể -- */}
        <div>
          <label className="field-label" htmlFor="mt-unit">
            Cá thể
          </label>
          {unit ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-ink bg-beige px-3 py-2">
              <div className="min-w-0">
                <p className="num text-[12.5px]">{unit.unitCode}</p>
                <p className="truncate text-[11.5px] text-ink-2">
                  {unit.productName} · {unit.size} · {unit.color}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <UnitStatusChip status={unit.status} />
                <button type="button" onClick={() => setUnit(null)} className="btn btn-ghost btn-sm">
                  Đổi
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <IconSearch
                  width={15}
                  height={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  id="mt-unit"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Quét tem QR hoặc gõ mã cá thể, tên sản phẩm..."
                  className={cn("field pl-8", submitted && !unit && "field-error")}
                />
              </div>
              {results.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {results.map((u) => (
                    <li key={u.unitCode}>
                      <button
                        type="button"
                        onClick={() => {
                          setUnit(u);
                          setQuery("");
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-left transition-colors hover:border-ink-3"
                      >
                        <span className="min-w-0">
                          <span className="num block text-[12.5px]">{u.unitCode}</span>
                          <span className="block truncate text-[11.5px] text-ink-3">
                            {u.productName} · {u.size} · {u.color}
                          </span>
                        </span>
                        <UnitStatusChip status={u.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                query.trim().length > 0 && (
                  <p className="field-hint">
                    <IconScan width={12} height={12} className="mr-1 inline" />
                    Không tìm thấy cá thể nào khớp “{query.trim()}”.
                  </p>
                )
              )}
            </>
          )}
        </div>

        {/* ---------------------------------------------------- loại việc -- */}
        <div>
          <p className="field-label">Loại việc</p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-[12.5px] transition-colors",
                  type === t ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-2 hover:border-ink-3",
                )}
              >
                {MAINTENANCE_TYPE[t].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="mt-reason">
            Lý do / việc cần làm
          </label>
          <textarea
            id="mt-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: bung chỉ gấu váy bên trái, cần khâu lại trước ngày giao."
            className={cn("field", submitted && reason.trim().length < 5 && "field-error")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="mt-assign">
              Giao cho
            </label>
            <select
              id="mt-assign"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="field"
            >
              <option value="">Chưa giao — để ở cột Chờ xử lý</option>
              {warehouseStaff.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="mt-cost">
              Chi phí dự kiến
            </label>
            <input
              id="mt-cost"
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
              className="field num hide-spin"
            />
            <p className="field-hint">Chi phí thực nhập lại khi hoàn tất việc.</p>
          </div>
        </div>

        {unit && (
          <div className="card card-pad bg-surface-2">
            <p className="label-xs mb-2">Ảnh hưởng tới lịch</p>
            <KeyValue label="Trạng thái hiện tại">{UNIT_STATUS[unit.status].label}</KeyValue>
            <KeyValue label="Booking kế tiếp">
              {nextBooking ? formatDate(nextBooking.pickupDate) : "Chưa có booking nào"}
            </KeyValue>
            <KeyValue label="Hạn phải xong">
              {nextBooking ? (
                <span className="text-warning">trước {formatDate(nextBooking.pickupDate)}</span>
              ) : (
                "Không gấp"
              )}
            </KeyValue>
          </div>
        )}

        {submitted && !valid && (
          <Callout tone="danger" icon={<IconAlert width={15} height={15} />}>
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Callout>
        )}
      </div>
    </Modal>
  );
}
