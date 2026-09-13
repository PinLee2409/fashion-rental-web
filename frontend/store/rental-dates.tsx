"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";
import { rentalDays, type ISODate } from "@/lib/date";

/**
 * Khoảng ngày thuê đang chọn, dùng chung toàn site.
 * Khách chọn một lần ở trang danh mục → trang chi tiết, giỏ thuê đều hiểu theo
 * khoảng ngày đó, đúng tinh thần "availability theo thời gian" của đặc tả.
 */
interface RentalDatesValue {
  pickupDate: ISODate | null;
  returnDate: ISODate | null;
  days: number;
  hasRange: boolean;
  hydrated: boolean;
  setRange: (pickup: ISODate | null, ret: ISODate | null) => void;
  clear: () => void;
}

const RentalDatesContext = createContext<RentalDatesValue | null>(null);

export function useRentalDates(): RentalDatesValue {
  const ctx = useContext(RentalDatesContext);
  if (!ctx) throw new Error("useRentalDates phải nằm trong <RentalDatesProvider>");
  return ctx;
}

export function RentalDatesProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState, hydrated] = usePersistentState<{ from: ISODate | null; to: ISODate | null }>(
    "stylerent.dates.v1",
    { from: null, to: null },
  );

  const setRange = useCallback(
    (pickup: ISODate | null, ret: ISODate | null) => setRangeState({ from: pickup, to: ret }),
    [setRangeState],
  );

  const clear = useCallback(() => setRangeState({ from: null, to: null }), [setRangeState]);

  const value = useMemo<RentalDatesValue>(() => {
    const hasRange = Boolean(range.from && range.to);
    return {
      pickupDate: range.from,
      returnDate: range.to,
      days: hasRange ? rentalDays(range.from!, range.to!) : 0,
      hasRange,
      hydrated,
      setRange,
      clear,
    };
  }, [range, hydrated, setRange, clear]);

  return <RentalDatesContext.Provider value={value}>{children}</RentalDatesContext.Provider>;
}
