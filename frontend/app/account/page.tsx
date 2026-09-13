"use client";

import Link from "next/link";
import { useState } from "react";
import { OrderCard } from "@/components/account/OrderCard";
import { IconAlert, IconRuler } from "@/components/ui/Icons";
import { Note, Reveal } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMER, NOTIFICATIONS } from "@/data/customer";
import { actionableOrders, ORDERS } from "@/data/orders";
import { formatDateTime } from "@/lib/date";
import { ORDER_STATUS } from "@/lib/order-status";

const MEASURE_FIELDS = [
  { key: "heightCm", label: "Chiều cao (cm)" },
  { key: "weightKg", label: "Cân nặng (kg)" },
  { key: "bustCm", label: "Vòng 1 (cm)" },
  { key: "waistCm", label: "Vòng 2 (cm)" },
  { key: "hipCm", label: "Vòng 3 (cm)" },
  { key: "shoulderCm", label: "Vai (cm)" },
  { key: "sleeveCm", label: "Dài tay (cm)" },
] as const;

export default function AccountOverviewPage() {
  const toast = useToast();
  const actionable = actionableOrders();
  const recent = ORDERS.slice(0, 3);

  const [profile, setProfile] = useState({
    name: CUSTOMER.name,
    email: CUSTOMER.email,
    phone: CUSTOMER.phone,
  });
  const [measurements, setMeasurements] = useState(
    Object.fromEntries(
      MEASURE_FIELDS.map((f) => [f.key, String(CUSTOMER.measurements[f.key] ?? "")]),
    ) as Record<string, string>,
  );
  const [preferredSize, setPreferredSize] = useState(CUSTOMER.measurements.preferredSize ?? "");

  return (
    <div className="space-y-14">
      {/* Cần xử lý */}
      <section>
        <Reveal as="header" className="flex items-end justify-between gap-4 pb-5">
          <h2 className="display-3">Cần bạn để mắt</h2>
          <Link href="/account/rentals" className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em]">
            Tất cả đơn thuê
          </Link>
        </Reveal>

        {actionable.length === 0 ? (
          <Note tone="info">Không có đơn nào cần xử lý. Tủ đồ đang chờ bạn cho dịp tiếp theo.</Note>
        ) : (
          <div className="space-y-4">
            {actionable.map((order, i) => (
              <Reveal key={order.code} delay={i * 70}>
                <OrderCard order={order} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Thông báo */}
      <section>
        <Reveal as="header" className="flex items-end justify-between gap-4 pb-5">
          <h2 className="display-3">Thông báo gần đây</h2>
          <Link href="/account/notifications" className="link-line link-underline-in text-[11.5px] uppercase tracking-[0.14em]">
            Xem tất cả
          </Link>
        </Reveal>
        <ul className="divide-y divide-line border-y border-line">
          {NOTIFICATIONS.slice(0, 3).map((n, i) => (
            <Reveal as="li" key={n.id} delay={i * 60} className="flex items-start gap-4 py-4">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-line" : "bg-accent"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px]">{n.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{n.body}</p>
              </div>
              <span className="shrink-0 text-[11.5px] text-ink-3">{formatDateTime(n.createdAt)}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Đơn gần đây */}
      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Lịch sử gần đây</h2>
        </Reveal>
        <div className="space-y-4">
          {recent.map((order, i) => (
            <Reveal key={order.code} delay={i * 60}>
              <OrderCard order={order} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Hồ sơ */}
      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Hồ sơ</h2>
          <p className="mt-2 text-[13px] text-ink-2">
            Thông tin liên hệ dùng cho đơn thuê và thông báo nhắc hạn trả.
          </p>
        </Reveal>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.push({ tone: "success", title: "Đã lưu hồ sơ" });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="field-label" htmlFor="p-name">
              Họ và tên
            </label>
            <input id="p-name" className="field" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-phone">
              Số điện thoại
            </label>
            <input id="p-phone" className="field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="p-email">
              Email
            </label>
            <input id="p-email" type="email" className="field" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Note tone="info" icon={<IconAlert width={15} height={15} />}>
              Giấy tờ thế chân: {CUSTOMER.idCardNote}. Hệ thống chỉ lưu ghi chú đối chiếu, không lưu số giấy tờ của
              bạn.
            </Note>
          </div>

          <div className="sm:col-span-2">
            <button type="submit" className="btn">
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </section>

      {/* Số đo */}
      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Số đo</h2>
          <p className="mt-2 max-w-[64ch] text-[13px] text-ink-2">
            Khi soạn đồ, nhân viên chọn cá thể vừa người bạn nhất trong số các bộ cùng size. Số đo càng đầy đủ, đồ càng
            vừa.
          </p>
        </Reveal>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.push({ tone: "success", title: "Đã lưu số đo", body: "Shop sẽ dùng số đo này cho các đơn tiếp theo." });
          }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEASURE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="field-label" htmlFor={field.key}>
                  {field.label}
                </label>
                <input
                  id={field.key}
                  inputMode="numeric"
                  className="field hide-number-spin"
                  value={measurements[field.key]}
                  onChange={(e) => setMeasurements((m) => ({ ...m, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="field-label" htmlFor="preferred">
                Size hay mặc
              </label>
              <select
                id="preferred"
                className="field"
                value={preferredSize}
                onChange={(e) => setPreferredSize(e.target.value)}
              >
                {["XS", "S", "M", "L", "XL"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[12px] text-ink-3">
            <IconRuler width={14} height={14} className="mt-0.5 shrink-0" />
            Đo lúc mặc đồ mỏng, thước vừa sát người, không siết. Nếu số đo nằm giữa hai size, hãy chọn size lớn hơn.
          </p>

          <button type="submit" className="btn mt-6">
            Lưu số đo
          </button>
        </form>
      </section>

      {/* Trạng thái đơn — giải thích */}
      <section>
        <Reveal as="header" className="pb-5">
          <h2 className="display-3">Các trạng thái đơn thuê</h2>
        </Reveal>
        <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {(["confirmed", "preparing", "ready", "in_use", "inspecting", "completed"] as const).map((status) => (
            <div key={status} className="border-t border-line pt-3">
              <dt className="text-[13.5px]">{ORDER_STATUS[status].label}</dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{ORDER_STATUS[status].description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
