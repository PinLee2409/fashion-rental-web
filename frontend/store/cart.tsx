"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { findPromotion } from "@/data/promotions";
import { findVariantGlobal, getProduct } from "@/data/products";
import { rentalDays } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { buildQuote, type Quote } from "@/lib/pricing";
import { SETTINGS } from "@/lib/settings";
import type { CartLine, PaymentPlan, PickupMethod, Product, Promotion, Variant } from "@/lib/types";

const STORAGE_KEY = "stylerent.cart.v1";
const PROMO_KEY = "stylerent.promo.v1";

export interface DetailedLine {
  line: CartLine;
  product: Product;
  variant: Variant;
  days: number;
  rentalTotal: number;
  depositTotal: number;
  /** Hold đã hết hạn (BR-05) */
  expired: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  detailed: DetailedLine[];
  hydrated: boolean;
  count: number;
  quote: Quote;
  promotion: Promotion | null;
  promotionError: string | null;
  /** Mốc hết hạn giữ chỗ gần nhất trong giỏ */
  holdExpiresAt: number | null;
  hasExpiredHold: boolean;
  addLine: (input: { productSlug: string; variantId: string; quantity: number; pickupDate: string; returnDate: string }) => void;
  updateLine: (id: string, patch: Partial<Omit<CartLine, "id">>) => void;
  removeLine: (id: string) => void;
  clear: () => void;
  /** Gia hạn giữ chỗ; mặc định 15 phút, bước thanh toán dùng 30 phút (BR-05) */
  renewHolds: (minutes?: number) => void;
  applyPromotion: (code: string) => { ok: boolean; message: string };
  clearPromotion: () => void;
  buildQuoteWith: (options: { pickupMethod: PickupMethod; paymentPlan: PaymentPlan }) => Quote;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải nằm trong <CartProvider>");
  return ctx;
}

function holdDeadline(minutes: number = SETTINGS.hold_ttl_minutes): number {
  return Date.now() + minutes * 60_000;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [promotionCode, setPromotionCode] = useState<string | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /** Mốc thời gian hiện tại, cập nhật mỗi giây để HoldTimer và trạng thái hết hạn luôn tươi. */
  const [now, setNow] = useState(0);

  // Nạp giỏ đã lưu
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      /* eslint-disable react-hooks/set-state-in-effect */
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
      const promo = window.localStorage.getItem(PROMO_KEY);
      if (promo) setPromotionCode(promo);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* storage bị chặn — giỏ chạy trong bộ nhớ */
    }
    setHydrated(true);
  }, []);

  // Lưu lại mỗi khi đổi
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* bỏ qua */
    }
  }, [lines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (promotionCode) window.localStorage.setItem(PROMO_KEY, promotionCode);
      else window.localStorage.removeItem(PROMO_KEY);
    } catch {
      /* bỏ qua */
    }
  }, [promotionCode, hydrated]);

  // Nhịp 1 giây để theo dõi TTL giữ chỗ (BR-05)
  useEffect(() => {
    if (lines.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lines.length]);

  const detailed = useMemo<DetailedLine[]>(() => {
    return lines
      .map((line) => {
        const product = getProduct(line.productSlug);
        const found = findVariantGlobal(line.variantId);
        if (!product || !found) return null;
        const days = rentalDays(line.pickupDate, line.returnDate);
        const quote = buildQuote([{ variant: found.variant, days, quantity: line.quantity }]);
        return {
          line,
          product,
          variant: found.variant,
          days,
          rentalTotal: quote.subtotalRental,
          depositTotal: quote.totalDeposit,
          expired: now > 0 && line.holdExpiresAt <= now,
        } satisfies DetailedLine;
      })
      .filter(Boolean) as DetailedLine[];
  }, [lines, now]);

  const promotion = useMemo(() => (promotionCode ? findPromotion(promotionCode) ?? null : null), [promotionCode]);

  const quote = useMemo(
    () =>
      buildQuote(
        detailed.map((d) => ({ variant: d.variant, days: d.days, quantity: d.line.quantity })),
        { promotion },
      ),
    [detailed, promotion],
  );

  const buildQuoteWith = useCallback(
    ({ pickupMethod, paymentPlan }: { pickupMethod: PickupMethod; paymentPlan: PaymentPlan }) =>
      buildQuote(
        detailed.map((d) => ({ variant: d.variant, days: d.days, quantity: d.line.quantity })),
        { promotion, pickupMethod, paymentPlan },
      ),
    [detailed, promotion],
  );

  const addLine: CartContextValue["addLine"] = useCallback((input) => {
    setLines((prev) => {
      const match = prev.find(
        (l) =>
          l.variantId === input.variantId &&
          l.pickupDate === input.pickupDate &&
          l.returnDate === input.returnDate,
      );
      if (match) {
        return prev.map((l) =>
          l.id === match.id
            ? { ...l, quantity: Math.min(9, l.quantity + input.quantity), holdExpiresAt: holdDeadline() }
            : l,
        );
      }
      return [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          productSlug: input.productSlug,
          variantId: input.variantId,
          quantity: input.quantity,
          pickupDate: input.pickupDate,
          returnDate: input.returnDate,
          holdExpiresAt: holdDeadline(),
        },
      ];
    });
  }, []);

  const updateLine: CartContextValue["updateLine"] = useCallback((id, patch) => {
    setLines((prev) =>
      prev.map((line) =>
        line.id === id
          ? {
              ...line,
              ...patch,
              // Mọi thay đổi đều làm mới hold
              holdExpiresAt: holdDeadline(),
            }
          : line,
      ),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setPromotionCode(null);
  }, []);

  const renewHolds = useCallback((minutes?: number) => {
    setLines((prev) => prev.map((line) => ({ ...line, holdExpiresAt: holdDeadline(minutes) })));
  }, []);

  const applyPromotion = useCallback(
    (code: string): { ok: boolean; message: string } => {
      const found = findPromotion(code);
      if (!found) {
        setPromotionError("Mã giảm giá không tồn tại hoặc đã hết hiệu lực.");
        return { ok: false, message: "Mã giảm giá không tồn tại hoặc đã hết hiệu lực." };
      }
      const subtotal = quote.subtotalRental;
      if (found.type !== "freeship" && subtotal < found.minOrder) {
        const message = `Mã ${found.code} áp dụng cho đơn thuê từ ${formatVnd(found.minOrder)}.`;
        setPromotionError(message);
        return { ok: false, message };
      }
      setPromotionError(null);
      setPromotionCode(found.code);
      return { ok: true, message: `Đã áp dụng mã ${found.code}.` };
    },
    [quote.subtotalRental],
  );

  const clearPromotion = useCallback(() => {
    setPromotionCode(null);
    setPromotionError(null);
  }, []);

  const holdExpiresAt = useMemo(
    () => (lines.length ? Math.min(...lines.map((l) => l.holdExpiresAt)) : null),
    [lines],
  );

  const value: CartContextValue = {
    lines,
    detailed,
    hydrated,
    count: lines.reduce((sum, l) => sum + l.quantity, 0),
    quote,
    promotion,
    promotionError,
    holdExpiresAt,
    hasExpiredHold: detailed.some((d) => d.expired),
    addLine,
    updateLine,
    removeLine,
    clear,
    renewHolds,
    applyPromotion,
    clearPromotion,
    buildQuoteWith,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
