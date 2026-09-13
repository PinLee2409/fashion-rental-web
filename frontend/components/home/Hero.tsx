"use client";

import Link from "next/link";
import { ProductMedia } from "@/components/product/ProductMedia";
import { useScrollY } from "@/hooks";
import { HERO } from "@/data/content";

export function Hero() {
  const scrollY = useScrollY();
  const parallax = Math.min(scrollY * 0.18, 120);

  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-ink md:h-[92vh]">
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
      <div className="shell relative flex h-full flex-col justify-end pb-16 md:pb-20">
        <div className="max-w-[min(760px,80vw)]">
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
          className="animate-fade-up mt-12 flex flex-wrap gap-x-12 gap-y-4 border-t border-canvas/20 pt-6 md:mt-16"
          style={{ animationDelay: "760ms" }}
        >
          {HERO.stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-[26px] text-canvas">{stat.value}</p>
              <p className="mt-0.5 text-[11.5px] uppercase tracking-[0.14em] text-canvas/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
