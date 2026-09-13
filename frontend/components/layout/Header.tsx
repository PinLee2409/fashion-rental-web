"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { IconBag, IconHeart, IconMenu, IconSearch, IconUser } from "@/components/ui/Icons";
import { useMounted, useScrollY } from "@/hooks";
import { getProduct } from "@/data/products";
import { cn, routeOf } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import { categoriesOf, NAV_ITEMS, OCCASION_LINKS } from "./nav-data";

export function Header() {
  const pathname = routeOf(usePathname());
  const scrollY = useScrollY();
  const mounted = useMounted();
  const cart = useCart();
  const wishlist = useWishlist();

  const [menu, setMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  const overHero = pathname === "/";
  const solid = scrollY > 24 || !overHero || menu !== null;
  const compact = scrollY > 120;

  // Điều hướng xong thì đóng mọi lớp phủ đang mở
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMenu(null);
    setMobileOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  return (
    <>
      <header
        onMouseLeave={() => setMenu(null)}
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-[background-color,backdrop-filter,border-color] duration-500 ease-luxe",
          solid ? "border-b border-line bg-canvas/92 backdrop-blur-md" : "border-b border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "shell relative flex items-center justify-between transition-[height] duration-500 ease-luxe",
            compact ? "h-[62px]" : "h-[76px]",
          )}
        >
          {/* Trái — nút menu (mobile) và logo (desktop) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setMobileOpen(true)}
              className={cn('-ml-2 p-2 lg:hidden', solid ? 'text-ink' : 'text-canvas')}
            >
              <IconMenu />
            </button>
            <Link
              href="/"
              onMouseEnter={() => setMenu(null)}
              className={cn(
                'hidden font-display transition-all duration-500 ease-luxe lg:block',
                compact ? 'text-[19px]' : 'text-[22px]',
                solid ? 'text-ink' : 'text-canvas',
              )}
              style={{ letterSpacing: '0.04em' }}
            >
              StyleRent
            </Link>
          </div>

          {/* Giữa — logo trên mobile, điều hướng trên desktop */}
          <Link
            href="/"
            className={cn(
              'absolute left-1/2 -translate-x-1/2 font-display transition-all duration-500 ease-luxe lg:hidden',
              compact ? 'text-[19px]' : 'text-[21px]',
              solid ? 'text-ink' : 'text-canvas',
            )}
            style={{ letterSpacing: '0.04em' }}
          >
            StyleRent
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex xl:gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onMouseEnter={() => setMenu(item.menu ?? null)}
                className={cn(
                  'link-line link-underline-in whitespace-nowrap py-2 text-[11.5px] uppercase tracking-[0.13em] transition-colors',
                  solid ? 'text-ink' : 'text-canvas',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Phải — hành động */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen(true)}
              className={cn("p-2.5 transition-colors", solid ? "text-ink hover:text-accent" : "text-canvas")}
            >
              <IconSearch />
            </button>
            <Link
              href="/wishlist"
              aria-label="Yêu thích"
              className={cn("relative p-2.5 transition-colors", solid ? "text-ink hover:text-accent" : "text-canvas")}
            >
              <IconHeart />
              {mounted && wishlist.count > 0 && <Badge count={wishlist.count} solid={solid} />}
            </Link>
            <Link
              href="/account"
              aria-label="Tài khoản"
              className={cn(
                "hidden p-2.5 transition-colors sm:block",
                solid ? "text-ink hover:text-accent" : "text-canvas",
              )}
            >
              <IconUser />
            </Link>
            <button
              type="button"
              aria-label="Giỏ thuê"
              onClick={() => setBagOpen(true)}
              className={cn(
                "relative -mr-2 p-2.5 transition-colors",
                solid ? "text-ink hover:text-accent" : "text-canvas",
              )}
            >
              <IconBag />
              {mounted && cart.count > 0 && <Badge count={cart.count} solid={solid} pulse />}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        <div
          className={cn(
            "absolute inset-x-0 top-full hidden overflow-hidden border-b border-line bg-canvas transition-[max-height,opacity] duration-400 ease-luxe lg:block",
            menu ? "max-h-[540px] opacity-100" : "pointer-events-none max-h-0 opacity-0",
          )}
        >
          <div className="shell py-10">
            {menu === "women" && <CategoryMenu group="women" featured="ao-dai-cach-tan-do-theu-sen" />}
            {menu === "men" && <CategoryMenu group="men" featured="tuxedo-den-ve-satin" />}
            {menu === "accessories" && <CategoryMenu group="accessories" featured="clutch-ngoc-trai-da-tiec" />}
            {menu === "occasion" && <OccasionMenu />}
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CartDrawer open={bagOpen} onClose={() => setBagOpen(false)} />
    </>
  );
}

function Badge({ count, solid, pulse }: { count: number; solid: boolean; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center px-1 text-[9.5px] font-medium tabular-nums",
        solid ? "bg-ink text-canvas" : "bg-canvas text-ink",
        pulse && "animate-pop",
      )}
    >
      {count}
    </span>
  );
}

function CategoryMenu({ group, featured }: { group: "women" | "men" | "accessories"; featured: string }) {
  const categories = categoriesOf(group);
  const product = getProduct(featured);

  return (
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-3">
        <p className="eyebrow text-ink-3">Danh mục</p>
        <ul className="mt-5 space-y-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/collections/${c.slug}`} className="link-line link-underline-in text-[14px]">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-4">
        <p className="eyebrow text-ink-3">Thuê theo dịp</p>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
          {OCCASION_LINKS.slice(0, 6).map((o) => (
            <li key={o.slug}>
              <Link href={o.href} className="link-line link-underline-in text-[14px]">
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/collections/tat-ca" className="link-line link-underline-in mt-8 inline-block text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Xem tất cả
        </Link>
      </div>

      {product && (
        <div className="col-span-5">
          <Link href={`/products/${product.slug}`} className="group grid grid-cols-2 gap-5">
            <ProductMedia image={product.images[0]} ratio="4/5" />
            <div className="flex flex-col justify-end pb-2">
              <p className="eyebrow text-ink-3">Được chọn nhiều</p>
              <p className="display-4 mt-2">{product.name}</p>
              <p className="mt-2 text-[13px] text-ink-2">{product.editorialNote}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function OccasionMenu() {
  return (
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-7">
        <p className="eyebrow text-ink-3">Bạn cần đồ cho dịp nào?</p>
        <ul className="mt-6 grid grid-cols-2 gap-x-10 gap-y-5">
          {OCCASION_LINKS.map((o) => (
            <li key={o.slug}>
              <Link href={o.href} className="group block">
                <span className="link-line link-underline-in display-4">{o.name}</span>
                <span className="mt-1 block text-[12.5px] text-ink-2">{o.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-5">
        <Link href="/collections/vay-cuoi" className="group block">
          <ProductMedia
            image={{
              id: "menu-occasion",
              motif: "drape",
              tone: ["#8e6259", "#f6f2ec"],
              alt: "Chiến dịch mùa cưới",
            }}
            ratio="16/9"
          />
          <p className="display-4 mt-4">Mùa cưới 2026</p>
          <p className="mt-1.5 text-[13px] text-ink-2">Váy cưới, áo dài và vest chú rể — đặt trước tối đa 180 ngày.</p>
        </Link>
      </div>
    </div>
  );
}
