"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NOTIFICATIONS } from "@/data/customer";
import { ORDERS } from "@/data/orders";
import { useMounted } from "@/hooks";
import { isActiveRental } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";

const LINKS = [
  { href: "/tai-khoan", label: "Tổng quan" },
  { href: "/tai-khoan/don-thue", label: "Đơn thuê" },
  { href: "/tai-khoan/dia-chi", label: "Sổ địa chỉ" },
  { href: "/tai-khoan/danh-gia", label: "Đánh giá" },
  { href: "/tai-khoan/thong-bao", label: "Thông báo" },
  { href: "/yeu-thich", label: "Yêu thích" },
];

export function AccountNav() {
  const pathname = usePathname();
  const mounted = useMounted();
  const wishlist = useWishlist();

  const counts: Record<string, number> = {
    "/tai-khoan/don-thue": ORDERS.filter((o) => isActiveRental(o.status) || o.status === "pending_payment").length,
    "/tai-khoan/thong-bao": NOTIFICATIONS.filter((n) => !n.read).length,
    "/yeu-thich": mounted ? wishlist.count : 0,
  };

  return (
    <nav className="min-w-0 lg:sticky lg:top-[100px] lg:self-start">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line pb-1 lg:block lg:space-y-1 lg:border-b-0 lg:pb-0">
        {LINKS.map((link) => {
          const active = link.href === "/tai-khoan" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className={cn(
                  "flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-[13.5px] transition-colors lg:px-4",
                  active ? "bg-ink text-canvas" : "text-ink-2 hover:bg-warm hover:text-ink",
                )}
              >
                {link.label}
                {counts[link.href] > 0 && (
                  <span
                    className={cn(
                      "min-w-5 px-1.5 py-0.5 text-center text-[10.5px] tabular-nums",
                      active ? "bg-canvas/20" : "bg-line-2",
                    )}
                  >
                    {counts[link.href]}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/dang-nhap"
        className="mt-6 hidden text-[11.5px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink lg:block"
      >
        Đăng xuất
      </Link>
    </nav>
  );
}
