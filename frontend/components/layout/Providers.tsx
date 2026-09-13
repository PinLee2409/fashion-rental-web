"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { CartProvider } from "@/store/cart";
import { RentalDatesProvider } from "@/store/rental-dates";
import { WishlistProvider } from "@/store/wishlist";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <RentalDatesProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </RentalDatesProvider>
    </ToastProvider>
  );
}
