"use client";

import { useState } from "react";
import { IconAlert, IconSettings } from "@/components/ui/Icons";
import { PageHeader, Section } from "@/components/ui/PageParts";
import { Callout, EmptyState } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { CATEGORIES } from "@/data/catalog";
import { SETTINGS, SHIPPING, STORE } from "@/lib/settings";
import { useSession } from "@/store/session";

interface FieldSpec {
  key: string;
  label: string;
  value: string | number;
  hint: string;
  suffix?: string;
}

export default function SettingsPage() {
  const session = useSession();
  const toast = useToast();
  const [dirty, setDirty] = useState(false);

  if (!session.canAny(["user.manage", "role.manage"])) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconSettings width={22} height={22} />}
          title="Bạn không có quyền vào cấu hình hệ thống"
          body="Cấu hình vận hành ảnh hưởng tới mọi đơn thuê nên chỉ Admin mới chỉnh được."
        />
      </div>
    );
  }

  const groups: { title: string; description: string; fields: FieldSpec[] }[] = [
    {
      title: "Giữ chỗ & cửa sổ đặt thuê",
      description: "Quyết định lịch trống hiển thị cho khách và thời gian hệ thống giữ đồ trước khi nhả.",
      fields: [
        {
          key: "hold_ttl_minutes",
          label: "TTL giữ chỗ ở giỏ thuê",
          value: SETTINGS.hold_ttl_minutes,
          suffix: "phút",
          hint: "Hết thời gian, job nền nhả booking đang ở trạng thái giữ tạm.",
        },
        {
          key: "checkout_ttl_minutes",
          label: "Thời gian giữ đơn chờ thanh toán",
          value: SETTINGS.checkout_ttl_minutes,
          suffix: "phút",
          hint: "Quá hạn, đơn tự huỷ và cá thể mở lại cho khách khác.",
        },
        {
          key: "max_advance_days",
          label: "Cho đặt trước tối đa",
          value: SETTINGS.max_advance_days,
          suffix: "ngày",
          hint: "Ngày ngoài cửa sổ này bị khoá trên lịch của khách.",
        },
        {
          key: "max_rental_days",
          label: "Thời gian thuê tối đa",
          value: SETTINGS.max_rental_days,
          suffix: "ngày",
          hint: `Tối thiểu ${SETTINGS.min_rental_days} ngày. Vượt mức này khách phải liên hệ shop.`,
        },
      ],
    },
    {
      title: "Giá thuê & tiền cọc",
      description: "Áp cho mọi đơn mới. Đơn cũ giữ nguyên giá đã snapshot lúc đặt.",
      fields: [
        {
          key: "deposit_rate_default",
          label: "Tỷ lệ cọc mặc định",
          value: Math.round(SETTINGS.deposit_rate_default * 100),
          suffix: "% giá trị đồ",
          hint: "Dùng khi tạo biến thể mới, có thể ghi đè ở từng biến thể.",
        },
        {
          key: "prepay_rental_rate",
          label: "Tỷ lệ tiền thuê trả trước",
          value: Math.round(SETTINGS.prepay_rental_rate * 100),
          suffix: "%",
          hint: "Phương án cọc giữ chỗ: khách trả cọc + phần trăm này của tiền thuê.",
        },
        {
          key: "full_payment_discount",
          label: "Giảm khi trả đủ ngay",
          value: Math.round(SETTINGS.full_payment_discount * 100),
          suffix: "%",
          hint: "Khuyến khích khách thanh toán toàn bộ ngay khi đặt.",
        },
        {
          key: "shipping",
          label: "Phí giao nhận 2 chiều",
          value: SHIPPING.round_trip_fee,
          suffix: "₫",
          hint: `Miễn phí cho đơn thuê từ ${SHIPPING.free_shipping_threshold.toLocaleString("vi-VN")}₫.`,
        },
      ],
    },
    {
      title: "Phí trễ hạn",
      description: "Công thức: số ngày trễ × hệ số × tiền thuê ngày của dòng đó.",
      fields: [
        {
          key: "late_fee_rate",
          label: "Hệ số phí trễ",
          value: SETTINGS.late_fee_rate,
          suffix: "× tiền thuê ngày",
          hint: "Hệ số càng cao càng răn đe, nhưng dễ gây khiếu nại.",
        },
        {
          key: "late_fee_grace_hours",
          label: "Ân hạn",
          value: SETTINGS.late_fee_grace_hours,
          suffix: "giờ",
          hint: "Trong khoảng ân hạn, hệ thống chưa tính phí trễ.",
        },
        {
          key: "late_fee_cap_multiplier",
          label: "Trần phí trễ",
          value: SETTINGS.late_fee_cap_multiplier,
          suffix: "× tiền cọc",
          hint: "Chặn trường hợp phí trễ vượt quá giá trị món đồ.",
        },
        {
          key: "return_due_hour",
          label: "Giờ hẹn trả trong ngày",
          value: STORE.return_due_hour,
          suffix: "giờ",
          hint: "Mốc để tính ngày trễ và nhắc khách trước 1 ngày.",
        },
      ],
    },
    {
      title: "Hạn mức & phê duyệt",
      description: "Điểm kiểm soát nội bộ: người áp phí và người duyệt phải khác nhau.",
      fields: [
        {
          key: "staff_fee_limit",
          label: "Hạn mức nhân viên tự quyết phí",
          value: SETTINGS.staff_fee_limit,
          suffix: "₫",
          hint: "Vượt mức này, biên bản phải chuyển quản lý duyệt.",
        },
        {
          key: "refund_auto_limit",
          label: "Hạn mức hoàn cọc tự động",
          value: SETTINGS.refund_auto_limit,
          suffix: "₫",
          hint: "Khoản hoàn lớn hơn cần quản lý phê duyệt trước khi chuyển tiền.",
        },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Cấu hình vận hành"
        description="Những con số này chính là quy tắc hệ thống dùng để tính tiền và dựng lịch trống. Đổi ở đây ảnh hưởng tới mọi đơn mới."
        breadcrumb={[{ label: "Hệ thống" }, { label: "Cấu hình vận hành" }]}
      />

      <div className="space-y-5 pb-20">
        {groups.map((group) => (
          <Section key={group.title} title={group.title} description={group.description}>
            <div className="card card-pad">
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((f) => (
                  <div key={f.key}>
                    <label className="field-label" htmlFor={f.key}>
                      {f.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={f.key}
                        defaultValue={String(f.value)}
                        onChange={() => setDirty(true)}
                        className="field num hide-spin"
                      />
                      {f.suffix && <span className="shrink-0 text-[12px] text-ink-2">{f.suffix}</span>}
                    </div>
                    <p className="field-hint">{f.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        ))}

        <Section
          title="Thời gian đệm giặt ủi theo danh mục"
          description="Sau mỗi lượt thuê, cá thể bị khoá thêm số ngày này trước khi cho thuê tiếp."
        >
          <div className="card overflow-hidden">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th className="text-right">Ngày đệm</th>
                  <th>Ảnh hưởng</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((c) => (
                  <tr key={c.slug}>
                    <td className="text-[12.5px]">{c.name}</td>
                    <td className="text-right">
                      <input
                        defaultValue={c.cleanBufferDays}
                        onChange={() => setDirty(true)}
                        className="field num hide-spin h-7 w-[64px] text-right text-[12.5px]"
                        aria-label={`Ngày đệm ${c.name}`}
                      />
                    </td>
                    <td className="text-[11.5px] text-ink-3">
                      {c.cleanBufferDays === 0
                        ? "Trả hôm nay, mai cho thuê tiếp được"
                        : `Khoá thêm ${c.cleanBufferDays} ngày sau mỗi lượt thuê`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Thông tin cửa hàng" description="Hiển thị cho khách ở web và trên phiếu bàn giao.">
          <div className="card card-pad grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="store-address">
                Địa chỉ
              </label>
              <input id="store-address" defaultValue={STORE.address} onChange={() => setDirty(true)} className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="store-hours">
                Giờ mở cửa
              </label>
              <input id="store-hours" defaultValue={STORE.hours} onChange={() => setDirty(true)} className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="store-phone">
                Hotline
              </label>
              <input id="store-phone" defaultValue={STORE.phone} onChange={() => setDirty(true)} className="field num" />
            </div>
          </div>
        </Section>

        <Callout tone="warning" icon={<IconAlert width={14} height={14} />} title="Thay đổi có hiệu lực ngay">
          Sửa buffer giặt ủi hoặc cửa sổ đặt trước sẽ làm lịch trống của khách thay đổi lập tức. Đơn đã xác nhận giữ
          nguyên giá và lịch đã snapshot.
        </Callout>
      </div>

      {/* thanh lưu dính */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/95 px-4 py-2.5 backdrop-blur-md lg:pl-[calc(var(--sidebar-w)+1rem)]">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-3">
          <p className="text-[11.5px] text-ink-3">{dirty ? "Có thay đổi chưa lưu" : "Chưa có thay đổi nào"}</p>
          <div className="flex gap-2">
            <button type="button" disabled={!dirty} onClick={() => setDirty(false)} className="btn btn-outline btn-sm">
              Huỷ
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                toast.push({ tone: "success", title: "Đã lưu cấu hình", body: "Áp dụng cho các đơn tạo từ bây giờ." });
              }}
              className="btn btn-sm"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
