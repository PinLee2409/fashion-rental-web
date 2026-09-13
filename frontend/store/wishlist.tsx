"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";

/**
 * Danh sách yêu thích — tính năng phía frontend, lưu cục bộ trên trình duyệt.
 * Đặc tả chưa có bảng/API cho wishlist nên phần này KHÔNG gọi backend;
 * khi có endpoint tương ứng, chỉ cần thay phần lưu trữ bên dưới.
 */
interface WishlistContextValue {
  slugs: string[];
  hydrated: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist phải nằm trong <WishlistProvider>");
  return ctx;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs, hydrated] = usePersistentState<string[]>("stylerent.wishlist.v1", []);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback(
    (slug: string) => {
      const next = !slugs.includes(slug);
      setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
      return next;
    },
    [slugs, setSlugs],
  );

  const remove = useCallback((slug: string) => setSlugs((prev) => prev.filter((s) => s !== slug)), [setSlugs]);
  const clear = useCallback(() => setSlugs([]), [setSlugs]);

  const value = useMemo(
    () => ({ slugs, hydrated, has, toggle, remove, clear, count: slugs.length }),
    [slugs, hydrated, has, toggle, remove, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
