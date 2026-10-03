"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/product/ProductMedia";
import { useScrollY } from "@/hooks";
import { HERO } from "@/data/content";

export function Hero() {
  const scrollY = useScrollY();
  const parallax = Math.min(scrollY * 0.18, 120);

  return (
    <section className="relative w-full overflow-hidden bg-ink">
      {/* Ảnh nền — chuyển động rất nhẹ khi cuộn */}
      <div
        className="absolute inset-0 scale-[1.08]"
        style={{ transform: `translate3d(0, ${parallax}px, 0) scale(1.08)` }}
      >
        <ProductMedia
          image={{
            id: "hero-main",
            motif: "drape",
            tone: ["#6d4a44", "#efe6da"],
            alt: "Chiến dịch StyleRent — lụa rủ trên nền sáng",
          }}
          ratio="16/9"
          className="h-full w-full [&>div]:h-full"
        />
      </div>
      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-ink/35" />

      {/* Khối chữ đặt lệch, không canh giữa */}
      <div className="shell relative flex min-h-[100svh] flex-col justify-end pb-12 pt-28 sm:pt-32 md:min-h-[92svh] md:pb-20">
        <div className="max-w-[760px]">
          <p className="eyebrow animate-fade-up text-canvas/75" style={{ animationDelay: "120ms" }}>
            {HERO.eyebrow}
          </p>

          <h1 className="display-1 mt-5 text-canvas">
            {HERO.headline.map((line, i) => (
              <span key={line} className="clip-mask">
                <span
                  className="animate-fade-up block"
                  style={{ animationDelay: `${220 + i * 110}ms`, animationDuration: "820ms" }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="animate-fade-up mt-7 max-w-[52ch] text-[15px] leading-relaxed text-canvas/85"
            style={{ animationDelay: "520ms" }}
          >
            {HERO.body}
          </p>

          <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
            <Link href={HERO.primaryCta.href} className="btn btn-light">
              {HERO.primaryCta.label}
            </Link>
            <Link href={HERO.secondaryCta.href} className="btn btn-outline border-canvas/60 text-canvas hover:bg-canvas hover:text-ink">
              {HERO.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div
          className="animate-fade-up mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-canvas/20 pt-6 min-[360px]:grid-cols-3 sm:gap-x-8 md:mt-16 md:flex md:flex-wrap md:gap-x-12"
          style={{ animationDelay: "760ms" }}
        >
          {HERO.stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-[22px] text-canvas sm:text-[26px]">{stat.value}</p>
              <p className="mt-0.5 text-[11px] uppercase leading-snug tracking-[0.08em] text-canvas/70 sm:text-[11.5px] sm:tracking-[0.14em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
