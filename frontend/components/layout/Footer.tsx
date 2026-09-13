"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconMail, IconPhone, IconPin } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { STORE } from "@/lib/settings";
import { FOOTER_LINKS } from "./nav-data";

export function Footer() {
  const toast = useToast();
  const [email, setEmail] = useState("");

  return (
    <footer className="mt-24 border-t border-line bg-canvas">
      <div className="shell">
        {/* Newsletter */}
        <div className="grid gap-10 border-b border-line py-16 md:grid-cols-2 md:gap-20">
          <div data-reveal>
            <p className="eyebrow text-ink-3">Thư của StyleRent</p>
            <h2 className="display-2 mt-4 max-w-[14ch]">Tủ đồ mới, gửi mỗi tháng một lần.</h2>
          </div>
          <div className="flex flex-col justify-end" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <p className="lede max-w-[46ch] text-[14px]">
              Thiết kế mới về, mẹo chọn size và lịch mở đặt cho mùa cưới. Không quảng cáo dày đặc.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes("@")) return;
                toast.push({ tone: "success", title: "Đã đăng ký nhận thư", body: email });
                setEmail("");
              }}
              className="mt-6 flex items-center gap-3 border-b border-ink pb-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email của bạn"
                className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3"
                aria-label="Email nhận bản tin"
              />
              <button type="submit" aria-label="Đăng ký" className="p-1 transition-transform duration-300 hover:translate-x-1">
                <IconArrowRight width={18} height={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-10 py-16 md:grid-cols-4">
          <div>
            <p className="font-display text-[22px]" style={{ letterSpacing: "0.04em" }}>
              StyleRent
            </p>
            <p className="mt-3 text-[13px] text-ink-2">{STORE.tagline}</p>
            <ul className="mt-6 space-y-2.5 text-[13px] text-ink-2">
              <li className="flex items-start gap-2.5">
                <IconPin width={15} height={15} className="mt-0.5 shrink-0" />
                {STORE.address}
              </li>
              <li className="flex items-center gap-2.5">
                <IconPhone width={15} height={15} className="shrink-0" />
                {STORE.phone}
              </li>
              <li className="flex items-center gap-2.5">
                <IconMail width={15} height={15} className="shrink-0" />
                {STORE.email}
              </li>
            </ul>
            <p className="mt-4 text-[12.5px] text-ink-3">{STORE.hours}</p>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.title}>
              <p className="eyebrow text-ink-3">{column.title}</p>
              <ul className="mt-5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-line link-underline-in text-[13.5px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line py-7 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} StyleRent · Đồ án hệ thống cho thuê trang phục</p>
          <p>Giá đã bao gồm giặt hấp · Cọc hoàn 100% khi trả đồ nguyên vẹn</p>
        </div>
      </div>
    </footer>
  );
}
