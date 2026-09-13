"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export { useReveal, useRevealRef } from "./useReveal";

const emptySubscribe = () => () => {};

/**
 * Chỉ true sau khi component đã mount trên client — tránh lệch hydration
 * ở những chỗ phụ thuộc vào ngày hôm nay hoặc localStorage.
 * Dùng useSyncExternalStore để server luôn trả về false mà không cần setState trong effect.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** Khoá cuộn nền khi mở drawer / modal / bottom sheet. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = previous;
      document.body.style.paddingRight = "";
    };
  }, [locked]);
}

/** Đóng khi bấm Escape. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onEscape]);
}

/** Vị trí cuộn hiện tại — dùng cho header dính và parallax nhẹ. */
export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return y;
}

/** Debounce giá trị — đặc tả yêu cầu debounce 300ms khi đổi ngày rồi gọi lại availability. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** localStorage có type, an toàn khi SSR. */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Đọc localStorage sau khi mount: server không có storage nên phải đồng bộ ở đây,
    // nếu đọc ngay trong render sẽ lệch hydration.
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* bỏ qua — chế độ ẩn danh hoặc storage bị chặn */
    }
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* bỏ qua */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated];
}
