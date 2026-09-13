"use client";

import { useState } from "react";
import { IconAlert } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout } from "@/components/ui/Primitives";
import type { AdminCustomer } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const ID_TYPES = [
  "CCCD gắn chip",
  "Hộ chiếu",
  "Bằng lái xe",
  "Giấy tờ khác",
];

/**
 * Tạo hồ sơ khách ngay tại quầy (UC-09).
 *
 * Số điện thoại là khoá nhận diện khách ở quầy nên bắt buộc và phải chuẩn
 * 10 số. Ghi chú giấy tờ thế chân là bắt buộc theo quy định nhận đồ tại quầy —
 * hệ thống chỉ lưu loại giấy tờ và 4 số cuối, không lưu ảnh hay số đầy đủ.
 */
export function CustomerDialog({
  open,
  onClose,
  onCreate,
  existingPhones,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (customer: AdminCustomer) => void;
  existingPhones: string[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [idLast4, setIdLast4] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const digits = phone.replace(/[^0-9]/g, "");
  const normalizedExisting = existingPhones.map((p) => p.replace(/[^0-9]/g, ""));

  const errors = {
    name: name.trim().length < 3 ? "Nhập họ tên khách." : "",
    phone:
      digits.length !== 10
        ? "Số điện thoại phải đủ 10 số."
        : normalizedExisting.includes(digits)
          ? "Số này đã có hồ sơ khách — tìm lại ở ô tìm kiếm."
          : "",
    idLast4: idLast4.length !== 4 ? "Nhập 4 số cuối trên giấy tờ." : "",
  };
  const valid = !errors.name && !errors.phone && !errors.idLast4;

  function submit() {
    setSubmitted(true);
    if (!valid) return;
    onCreate({
      id: `c-new-${Date.now()}`,
      name: name.trim(),
      phone: formatPhone(digits),
      email: email.trim(),
      joinedAt: new Date().toISOString(),
      status: "active",
      idCardNote: `${idType} ••••${idLast4}`,
      address: address.trim(),
      measurements: null,
      totalRentals: 0,
      totalSpend: 0,
      lateReturns: 0,
      damageIncidents: 0,
      lastRentalAt: null,
      note: note.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo khách mới"
      description="Hồ sơ khách tại quầy. Khách tự đăng ký online sẽ có thêm mật khẩu và địa chỉ giao nhận."
      width="max-w-[600px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" onClick={submit} className="btn btn-sm">
            Tạo và chọn khách này
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="c-name">
              Họ và tên
            </label>
            <input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Khánh Linh"
              className={cn("field", submitted && errors.name && "field-error")}
            />
            {submitted && errors.name && <p className="field-hint text-danger">{errors.name}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="c-phone">
              Số điện thoại
            </label>
            <input
              id="c-phone"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0908 412 337"
              className={cn("field num", submitted && errors.phone && "field-error")}
            />
            {submitted && errors.phone ? (
              <p className="field-hint text-danger">{errors.phone}</p>
            ) : (
              <p className="field-hint">Dùng để tra đơn ở quầy và gửi nhắc hạn trả.</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="c-email">
              Email <span className="text-ink-3">(không bắt buộc)</span>
            </label>
            <input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="khach@email.com"
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="c-address">
              Địa chỉ <span className="text-ink-3">(không bắt buộc)</span>
            </label>
            <input
              id="c-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="48 Nguyễn Thị Minh Khai, Q.1"
              className="field"
            />
          </div>
        </div>

        <div className="rounded-md border border-line p-3">
          <p className="label-xs mb-2">Giấy tờ thế chân</p>
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <label className="field-label" htmlFor="c-idtype">
                Loại giấy tờ
              </label>
              <select id="c-idtype" value={idType} onChange={(e) => setIdType(e.target.value)} className="field">
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="c-id4">
                4 số cuối
              </label>
              <input
                id="c-id4"
                inputMode="numeric"
                maxLength={4}
                value={idLast4}
                onChange={(e) => setIdLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="1234"
                className={cn("field num", submitted && errors.idLast4 && "field-error")}
              />
            </div>
          </div>
          <p className="field-hint">
            Hệ thống chỉ lưu loại giấy tờ và 4 số cuối để đối chiếu khi khách đến nhận đồ. Không lưu ảnh chụp hay số đầy
            đủ.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="c-note">
            Ghi chú nội bộ
          </label>
          <textarea
            id="c-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: khách quen của chị Hằng, hay đổi size vào phút chót."
            className="field"
          />
        </div>

        {submitted && !valid && (
          <Callout tone="danger" icon={<IconAlert width={15} height={15} />}>
            Kiểm tra lại các ô được tô đỏ trước khi tạo hồ sơ.
          </Callout>
        )}
      </div>
    </Modal>
  );
}

function formatPhone(digits: string): string {
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`.trim();
}
