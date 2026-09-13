"use client";

import Link from "next/link";
import { useState } from "react";
import { RentalDatePicker } from "@/components/rental/RentalDatePicker";
import { IconCalendar } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { useMounted } from "@/hooks";
import { formatDate } from "@/lib/date";
import { SETTINGS } from "@/lib/settings";
import { useRentalDates } from "@/store/rental-dates";

/**
 * Chọn ngày một lần, cả site hiểu theo ngày đó.
 * Đây là điểm khác cốt lõi so với web bán hàng: tồn kho là lịch bận theo thời gian.
 */
export function HomeDateBar() {
  const mounted = useMounted();
  const { pickupDate, returnDate, hasRange, days, setRange, clear } = useRentalDates();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-b border-line bg-canvas">
        <div className="shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconCalendar className="shrink-0 text-ink-2" />
            <div>
              <p className="text-[13.5px]">
                {mounted && hasRange ? (
                  <>
                    {formatDate(pickupDate!)} <span className="text-ink-3">→</span> {formatDate(returnDate!)}
                    <span className="ml-2 text-ink-2">· {days} ngày thuê</span>
                  </>
                ) : (
                  "Bạn cần đồ cho ngày nào?"
                )}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-2">
                {mounted && hasRange
                  ? "Toàn bộ catalog đang hiển thị tình trạng còn/hết theo khoảng ngày này."
                  : `Chọn ngày nhận và ngày trả để xem chính xác món nào còn rảnh. Đặt trước tối đa ${SETTINGS.max_advance_days} ngày.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mounted && hasRange && (
              <button
                type="button"
                onClick={clear}
                className="link-line link-underline-in text-[11px] uppercase tracking-[0.12em] text-ink-2"
              >
                Xoá ngày
              </button>
            )}
            <button type="button" onClick={() => setOpen(true)} className="btn btn-quiet">
              {mounted && hasRange ? "Đổi ngày" : "Chọn ngày thuê"}
            </button>
            {mounted && hasRange && (
              <Link href="/collections/tat-ca" className="btn btn-sm">
                Xem đồ còn trống
              </Link>
            )}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Chọn ngày thuê" width="max-w-[720px]">
        <RentalDatePicker
          variants={[]}
          bookings={[]}
          cleanBufferDays={SETTINGS.default_clean_buffer_days}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onChange={(from, to) => {
            setRange(from, to);
            if (from && to) setTimeout(() => setOpen(false), 220);
          }}
          legend={false}
        />
        <p className="mt-5 text-[12.5px] text-ink-2">
          Đây là khoảng ngày chung cho cả catalog. Vào từng sản phẩm, lịch sẽ hiển thị chi tiết ngày nào còn đồ theo
          từng size và màu.
        </p>
      </Modal>
    </>
  );
}
