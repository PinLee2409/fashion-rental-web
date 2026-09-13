"use client";

import { useMemo, useState } from "react";
import { IconArrowLeft, IconArrowRight } from "@/components/ui/Icons";
import { useMounted } from "@/hooks";
import {
  bookingWindow,
  buildCalendar,
  countFreeUnits,

  suggestNextAvailableRange,
  validateRange,
} from "@/lib/availability";
import {
  addMonths,
  formatDate,
  formatMonthTitle,
  rentalDays,
  todayISO,
  WEEKDAY_SHORT,
  type ISODate,
} from "@/lib/date";
import { SETTINGS } from "@/lib/settings";
import type { AvailabilityLevel, UnitBooking, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  variants: Variant[];
  bookings: UnitBooking[];
  cleanBufferDays: number;
  pickupDate: ISODate | null;
  returnDate: ISODate | null;
  onChange: (pickup: ISODate | null, ret: ISODate | null) => void;
  months?: 1 | 2;
  /** Hiển thị chú thích màu bên dưới lịch */
  legend?: boolean;
  className?: string;
}

/**
 * `<RentalDatePicker>` — chọn khoảng ngày thuê.
 * Màu từng ngày lấy từ availability engine: 🟩 còn nhiều · 🟨 sắp hết ·
 * 🟥 hết đồ · ⬜ ngoài cửa sổ đặt (BR-07). Ngày hết đồ bị chặn chọn.
 */
export function RentalDatePicker({
  variants,
  bookings,
  cleanBufferDays,
  pickupDate,
  returnDate,
  onChange,
  months = 2,
  legend = true,
  className,
}: Props) {
  const mounted = useMounted();
  const today = todayISO();
  const [anchor, setAnchor] = useState<ISODate>(() => (pickupDate ? `${pickupDate.slice(0, 7)}-01` : `${today.slice(0, 7)}-01`));
  const [hovered, setHovered] = useState<ISODate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ pickupDate: ISODate; returnDate: ISODate } | null>(null);

  const bookWindow = bookingWindow(today);
  const selecting = Boolean(pickupDate && !returnDate);
  /** Không có biến thể nào → chỉ chọn ngày, không tô màu tồn kho */
  const showStock = variants.length > 0;

  const calendars = useMemo(
    () =>
      Array.from({ length: months }, (_, i) => {
        const monthAnchor = addMonths(anchor, i);
        return { monthAnchor, days: buildCalendar(variants, bookings, monthAnchor, cleanBufferDays, today) };
      }),
    [anchor, months, variants, bookings, cleanBufferDays, today],
  );

  const canGoPrev = anchor > `${today.slice(0, 7)}-01`;
  const canGoNext = addMonths(anchor, months) <= `${bookWindow.max.slice(0, 7)}-01`;

  function handlePick(date: ISODate, level: AvailabilityLevel) {
    if (level === "none" || level === "closed") return;
    setError(null);
    setSuggestion(null);

    if (!pickupDate || (pickupDate && returnDate)) {
      onChange(date, null);
      return;
    }
    if (date < pickupDate) {
      onChange(date, null);
      return;
    }

    const check = validateRange(pickupDate, date, today);
    if (!check.ok) {
      setError(check.message ?? null);
      return;
    }

    // Kiểm tra cả khoảng: phải còn ít nhất 1 cá thể rảnh suốt [nhận → trả] + buffer
    const stillFree =
      !showStock || variants.some((v) => countFreeUnits(v, bookings, pickupDate, date, cleanBufferDays) > 0);
    if (!stillFree) {
      setError("Khoảng ngày này đã kín. Hãy thử ngày khác hoặc chọn biến thể khác.");
      const days = rentalDays(pickupDate, date);
      for (const variant of variants) {
        const next = suggestNextAvailableRange(variant, bookings, pickupDate, days, cleanBufferDays);
        if (next) {
          setSuggestion(next);
          break;
        }
      }
      return;
    }

    onChange(pickupDate, date);
  }

  const previewEnd = selecting && hovered && pickupDate && hovered > pickupDate ? hovered : returnDate;

  return (
    <div className={className}>
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          aria-label="Tháng trước"
          disabled={!canGoPrev}
          onClick={() => setAnchor(addMonths(anchor, -1))}
          className="grid h-8 w-8 place-items-center text-ink-2 transition-colors hover:text-ink disabled:opacity-25"
        >
          <IconArrowLeft width={16} height={16} />
        </button>
        <div className="flex flex-1 justify-around">
          {calendars.map((c) => (
            <p key={c.monthAnchor} className="text-[13px] tracking-[0.04em]">
              {formatMonthTitle(c.monthAnchor)}
            </p>
          ))}
        </div>
        <button
          type="button"
          aria-label="Tháng sau"
          disabled={!canGoNext}
          onClick={() => setAnchor(addMonths(anchor, 1))}
          className="grid h-8 w-8 place-items-center text-ink-2 transition-colors hover:text-ink disabled:opacity-25"
        >
          <IconArrowRight width={16} height={16} />
        </button>
      </div>

      <div className={cn("grid gap-8", months === 2 ? "md:grid-cols-2" : "grid-cols-1")}>
        {calendars.map((calendar, index) => (
          <div key={calendar.monthAnchor} className={cn(index > 0 && months === 2 && "hidden md:block")}>
            <div className="grid grid-cols-7 gap-px pb-1">
              {WEEKDAY_SHORT.map((d) => (
                <div key={d} className="py-1 text-center text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px" onMouseLeave={() => setHovered(null)}>
              {calendar.days.map((day) => {
                if (!day.inMonth) return <div key={day.date} />;

                const isStart = day.date === pickupDate;
                const isEnd = day.date === returnDate;
                const inRange =
                  pickupDate && previewEnd && day.date > pickupDate && day.date < previewEnd;
                const disabled = !mounted || day.level === "none" || day.level === "closed";

                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={disabled}
                    onMouseEnter={() => setHovered(day.date)}
                    onClick={() => handlePick(day.date, day.level)}
                    aria-label={`${formatDate(day.date)}${
                      !showStock
                        ? ""
                        : day.level === "closed"
                          ? " — ngoài thời gian nhận đặt"
                          : day.level === "none"
                            ? " — hết đồ"
                            : ` — còn ${day.freeUnits} bộ`
                    }`}
                    className={cn(
                      "relative flex h-11 flex-col items-center justify-center text-[13px] transition-colors duration-150",
                      disabled && "cursor-not-allowed text-ink-3",
                      !disabled && "hover:bg-warm",
                      inRange && "bg-warm",
                      (isStart || isEnd) && "bg-ink text-canvas hover:bg-ink",
                      day.date === todayISO() && !isStart && !isEnd && "font-medium",
                    )}
                  >
                    <span className={cn(day.level === "none" && "line-through decoration-ink-3")}>
                      {Number(day.date.slice(8, 10))}
                    </span>
                    {mounted && showStock && !isStart && !isEnd && day.level !== "closed" && (
                      <span
                        className={cn(
                          "absolute bottom-1.5 h-1 w-1 rounded-full",
                          day.level === "plenty" && "bg-success/70",
                          day.level === "limited" && "bg-warning",
                          day.level === "none" && "bg-danger/50",
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {legend && showStock && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[11.5px] text-ink-2">
          <LegendDot className="bg-success/70" label="Còn nhiều" />
          <LegendDot className="bg-warning" label="Sắp hết" />
          <LegendDot className="bg-danger/50" label="Hết đồ" />
          <span className="text-ink-3">
            Thuê {SETTINGS.min_rental_days}–{SETTINGS.max_rental_days} ngày · đặt trước tối đa{" "}
            {SETTINGS.max_advance_days} ngày
          </span>
        </div>
      )}

      {selecting && !error && (
        <p className="mt-3 text-[12.5px] text-ink-2">Chọn tiếp ngày trả đồ.</p>
      )}

      {error && (
        <div className="mt-3 bg-danger-soft px-3.5 py-3 text-[12.5px] text-danger">
          <p>{error}</p>
          {suggestion && (
            <button
              type="button"
              onClick={() => {
                onChange(suggestion.pickupDate, suggestion.returnDate);
                setError(null);
                setSuggestion(null);
                setAnchor(`${suggestion.pickupDate.slice(0, 7)}-01`);
              }}
              className="link-line link-underline-in mt-1.5 inline-block uppercase tracking-[0.12em]"
            >
              Khoảng trống gần nhất: {formatDate(suggestion.pickupDate)} → {formatDate(suggestion.returnDate)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", className)} />
      {label}
    </span>
  );
}

/** Ô hiển thị khoảng ngày đã chọn — dùng ở PDP, giỏ thuê, trang danh mục. */
export function DateRangeSummary({
  pickupDate,
  returnDate,
  onEdit,
  compact,
}: {
  pickupDate: ISODate | null;
  returnDate: ISODate | null;
  onEdit?: () => void;
  compact?: boolean;
}) {
  const has = pickupDate && returnDate;
  const days = has ? rentalDays(pickupDate, returnDate) : 0;

  return (
    <div className={cn("flex items-center justify-between gap-4", compact ? "text-[12.5px]" : "text-[13.5px]")}>
      <div>
        {has ? (
          <>
            <p>
              {formatDate(pickupDate)} <span className="text-ink-3">→</span> {formatDate(returnDate)}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-2">{days} ngày thuê</p>
          </>
        ) : (
          <p className="text-ink-2">Chưa chọn ngày thuê</p>
        )}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="link-line link-underline-in shrink-0 text-[11px] uppercase tracking-[0.14em]"
        >
          {has ? "Đổi ngày" : "Chọn ngày"}
        </button>
      )}
    </div>
  );
}

