"use client";

import { useState } from "react";
import { IconAlert, IconPin } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { EmptyState, Note, Reveal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMER } from "@/data/customer";
import { SHIPPING } from "@/lib/settings";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  label: "",
  receiverName: CUSTOMER.name,
  phone: CUSTOMER.phone,
  street: "",
  ward: "",
  district: "",
  province: "TP. Hồ Chí Minh",
};

export default function AddressBookPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>(CUSTOMER.addresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(address: Address) {
    setForm({
      label: address.label,
      receiverName: address.receiverName,
      phone: address.phone,
      street: address.street,
      ward: address.ward,
      district: address.district,
      province: address.province,
    });
    setEditing(address);
    setCreating(true);
  }

  function save() {
    if (!form.label.trim() || !form.street.trim()) {
      toast.push({ tone: "error", title: "Thiếu thông tin", body: "Nhập tên gợi nhớ và địa chỉ cụ thể." });
      return;
    }
    const deliverySupported = SHIPPING.supported_provinces.includes(form.province);

    if (editing) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...form, deliverySupported } : a)),
      );
      toast.push({ tone: "success", title: "Đã cập nhật địa chỉ" });
    } else {
      setAddresses((prev) => [
        ...prev,
        { id: `addr-${Date.now()}`, ...form, isDefault: prev.length === 0, deliverySupported },
      ]);
      toast.push({ tone: "success", title: "Đã thêm địa chỉ mới" });
    }
    setCreating(false);
  }

  return (
    <div>
      <Reveal as="header" className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div>
          <h2 className="display-3">Sổ địa chỉ</h2>
          <p className="mt-2 max-w-[60ch] text-[13px] text-ink-2">
            Địa chỉ dùng cho hình thức giao tận nơi 2 chiều. Khu vực ngoài vùng giao chỉ áp dụng nhận tại cửa hàng.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-sm">
          Thêm địa chỉ
        </button>
      </Reveal>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<IconPin width={26} height={26} />}
          title="Chưa có địa chỉ nào"
          body="Thêm địa chỉ để đặt giao tận nơi, hoặc chọn nhận tại cửa hàng khi thanh toán."
          onAction={{ label: "Thêm địa chỉ", run: openCreate }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address, i) => (
            <Reveal as="li" key={address.id} delay={i * 60}>
              <div className={cn("h-full border p-5", address.isDefault ? "border-ink" : "border-line")}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px]">{address.label}</p>
                  {address.isDefault && <span className="bg-warm px-2 py-0.5 text-[10.5px] text-ink-2">Mặc định</span>}
                  {!address.deliverySupported && (
                    <span className="bg-warning-soft px-2 py-0.5 text-[10.5px] text-warning">Ngoài vùng giao</span>
                  )}
                </div>
                <p className="mt-2.5 text-[13px] text-ink-2">
                  {address.receiverName} · {address.phone}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  {address.street}, {address.ward}, {address.district}, {address.province}
                </p>

                <div className="mt-5 flex flex-wrap gap-4 text-[11.5px] uppercase tracking-[0.12em]">
                  <button type="button" onClick={() => openEdit(address)} className="link-line link-underline-in">
                    Sửa
                  </button>
                  {!address.isDefault && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === address.id })));
                          toast.push({ tone: "success", title: "Đã đặt làm địa chỉ mặc định" });
                        }}
                        className="link-line link-underline-in text-ink-2"
                      >
                        Đặt mặc định
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddresses((prev) => prev.filter((a) => a.id !== address.id));
                          toast.push({ tone: "info", title: "Đã xoá địa chỉ" });
                        }}
                        className="link-line link-underline-in text-ink-3 hover:text-danger"
                      >
                        Xoá
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      )}

      <Note tone="info" icon={<IconAlert width={15} height={15} />}>
        Vùng giao hiện tại: {SHIPPING.supported_provinces.join(" · ")}.
      </Note>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={editing ? "Sửa địa chỉ" : "Thêm địa chỉ"}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setCreating(false)} className="btn btn-quiet flex-1">
              Huỷ
            </button>
            <button type="button" onClick={save} className="btn flex-1">
              Lưu địa chỉ
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="label">
              Tên gợi nhớ
            </label>
            <input
              id="label"
              className="field"
              placeholder="Nhà riêng, Văn phòng..."
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="receiver">
              Người nhận
            </label>
            <input
              id="receiver"
              className="field"
              value={form.receiverName}
              onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="a-phone">
              Điện thoại
            </label>
            <input
              id="a-phone"
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="street">
              Số nhà, tên đường
            </label>
            <input
              id="street"
              className="field"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ward">
              Phường / Xã
            </label>
            <input
              id="ward"
              className="field"
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="district">
              Quận / Huyện
            </label>
            <input
              id="district"
              className="field"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="province">
              Tỉnh / Thành phố
            </label>
            <select
              id="province"
              className="field"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            >
              {[...SHIPPING.supported_provinces, "Cần Thơ", "Khánh Hoà", "Lâm Đồng"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {!SHIPPING.supported_provinces.includes(form.province) && (
              <p className="mt-2 text-[12px] text-warning">
                Khu vực này chưa có giao nhận 2 chiều — đơn sẽ chỉ chọn được hình thức nhận tại cửa hàng.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
