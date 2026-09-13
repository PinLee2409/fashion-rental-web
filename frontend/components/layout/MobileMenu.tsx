"use client";

import Link from "next/link";
import { useState } from "react";
import { IconChevronDown, IconClose } from "@/components/ui/Icons";
import { FullOverlay } from "@/components/ui/Overlay";
import { STORE } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { categoriesOf, NAV_ITEMS, OCCASION_LINKS } from "./nav-data";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <FullOverlay open={open} onClose={onClose}>
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-line px-5">
        <span className="font-display text-[21px]" style={{ letterSpacing: "0.04em" }}>
          StyleRent
        </span>
        <button type="button" onClick={onClose} aria-label="Đóng menu" className="-mr-2 p-2 text-ink-2">
          <IconClose />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-5 py-6">
        <ul>
          {NAV_ITEMS.map((item, i) => {
            const hasChildren = item.menu && item.menu !== "occasion";
            const isOccasion = item.menu === "occasion";
            const isOpen = expanded === item.label;

            return (
              <li
                key={item.label}
                className="animate-fade-up border-b border-line"
                style={{ animationDelay: `${60 + i * 55}ms` }}
              >
                {hasChildren || isOccasion ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : item.label)}
                      className="flex w-full items-center justify-between py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="display-4">{item.label}</span>
                      <IconChevronDown
                        width={16}
                        height={16}
                        className={cn("text-ink-2 transition-transform duration-300", isOpen && "rotate-180")}
                      />
                    </button>
                    {isOpen && (
                      <ul className="animate-fade-up pb-5 pl-1">
                        {isOccasion
                          ? OCCASION_LINKS.map((o) => (
                              <li key={o.slug} className="py-2">
                                <Link href={o.href} onClick={onClose} className="text-[14.5px] text-ink-2">
                                  {o.name}
                                </Link>
                              </li>
                            ))
                          : categoriesOf(item.menu as "women" | "men" | "accessories").map((c) => (
                              <li key={c.slug} className="py-2">
                                <Link href={`/danh-muc/${c.slug}`} onClick={onClose} className="text-[14.5px] text-ink-2">
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                        <li className="py-2">
                          <Link href={item.href} onClick={onClose} className="text-[12px] uppercase tracking-[0.14em]">
                            Xem tất cả {item.label}
                          </Link>
                        </li>
                      </ul>
                    )}
                  </>
                ) : (
                  <Link href={item.href} onClick={onClose} className="block py-4">
                    <span className="display-4">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="mt-8 space-y-3.5 text-[14px]">
          {[
            { label: "Tài khoản của tôi", href: "/tai-khoan" },
            { label: "Đơn thuê", href: "/tai-khoan/don-thue" },
            { label: "Yêu thích", href: "/yeu-thich" },
            { label: "Thuê đồ hoạt động thế nào", href: "/huong-dan" },
            { label: "Chính sách thuê & hoàn cọc", href: "/chinh-sach" },
          ].map((link, i) => (
            <li key={link.href} className="animate-fade-up" style={{ animationDelay: `${420 + i * 45}ms` }}>
              <Link href={link.href} onClick={onClose} className="text-ink-2">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="animate-fade-up mt-10 border-t border-line pt-6 text-[12.5px] text-ink-2" style={{ animationDelay: "660ms" }}>
          <p>{STORE.address}</p>
          <p className="mt-1">{STORE.hours}</p>
          <p className="mt-1">{STORE.phone}</p>
        </div>
      </nav>
    </FullOverlay>
  );
}
