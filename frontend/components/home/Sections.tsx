"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { IconArrowRight } from "@/components/ui/Icons";
import { Reveal, Stars } from "@/components/ui/Primitives";
import { CATEGORIES } from "@/data/catalog";
import { EDITORIAL, HOW_IT_WORKS, LOOKBOOK, MARQUEE_WORDS, WHY_RENT } from "@/data/content";
import { getProduct } from "@/data/products";
import { FEATURED_REVIEWS } from "@/data/reviews";
import { cn } from "@/lib/utils";
import { OCCASION_LINKS } from "@/components/layout/nav-data";

/* ------------------------------------------------------------------ chung -- */

export function SectionHead({
  eyebrow,
  title,
  link,
  className,
  align = "between",
}: {
  eyebrow: string;
  title: ReactNode;
  link?: { label: string; href: string };
  className?: string;
  align?: "between" | "center";
}) {
  return (
    <Reveal
      as="header"
      className={cn(
        "flex gap-6 pb-10",
        align === "between" ? "flex-col md:flex-row md:items-end md:justify-between" : "flex-col items-center text-center",
        className,
      )}
    >
      <div className={align === "center" ? "max-w-[52ch]" : "max-w-[26ch]"}>
        <p className="eyebrow text-ink-3">{eyebrow}</p>
        <h2 className="display-2 mt-4">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="link-line link-underline-in inline-flex shrink-0 items-center gap-2 text-[11.5px] uppercase tracking-[0.14em]"
        >
          {link.label}
          <IconArrowRight width={15} height={15} />
        </Link>
      )}
    </Reveal>
  );
}

/* --------------------------------------------------------------- marquee -- */

export function Marquee() {
  const words = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div className="overflow-hidden border-y border-line bg-warm py-5">
      <div className="marquee-track" style={{ "--marquee-duration": "48s" } as React.CSSProperties}>
        {words.map((word, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="font-display text-[26px] tracking-[-0.01em] text-ink/85 md:text-[32px]">{word}</span>
            <span className="mx-8 h-1 w-1 rounded-full bg-accent/70 md:mx-11" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- danh mục -- */

export function CategoryStrip() {
  const picks = [
    { slug: "ao-dai", product: "ao-dai-cach-tan-do-theu-sen", span: "md:col-span-5" },
    { slug: "dam-da-hoi", product: "dam-da-hoi-satin-midnight", span: "md:col-span-3" },
    { slug: "vay-cuoi", product: "vay-cuoi-ren-phap-tay-phong", span: "md:col-span-4" },
    { slug: "vest-nam", product: "vest-nam-navy-may-do", span: "md:col-span-4" },
    { slug: "do-bieu-dien", product: "do-bieu-dien-anh-kim", span: "md:col-span-4" },
    { slug: "tui-clutch", product: "clutch-ngoc-trai-da-tiec", span: "md:col-span-4" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12">
      {picks.map((pick, i) => {
        const category = CATEGORIES.find((c) => c.slug === pick.slug);
        const product = getProduct(pick.product);
        if (!category || !product) return null;
        return (
          <Reveal key={pick.slug} as="div" delay={i * 70} className={cn("group", pick.span)}>
            <Link href={`/danh-muc/${category.slug}`} className="block">
              <ProductMedia image={product.images[i % product.images.length]} ratio={i < 2 ? "4/5" : "3/4"} />
              <div className="flex items-baseline justify-between gap-4 pt-4">
                <h3 className="display-4">{category.name}</h3>
                <span className="text-[11.5px] uppercase tracking-[0.12em] text-ink-3 transition-transform duration-500 ease-luxe group-hover:translate-x-1">
                  Xem →
                </span>
              </div>
              <p className="mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-ink-2">{category.description}</p>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- dịp -- */

export function OccasionGrid() {
  return (
    <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
      {OCCASION_LINKS.map((occasion, i) => (
        <Reveal key={occasion.slug} as="div" delay={i * 55}>
          <Link
            href={occasion.href}
            className="group flex h-full flex-col justify-between gap-8 bg-canvas p-7 transition-colors duration-400 hover:bg-warm"
          >
            <span className="eyebrow text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="display-4 block">{occasion.name}</span>
              <span className="mt-1.5 block text-[13px] text-ink-2">{occasion.blurb}</span>
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- biên tập -- */

export function EditorialBlock() {
  return (
    <div className="grid items-center gap-10 md:grid-cols-12 md:gap-16">
      <Reveal as="div" className="md:col-span-7">
        <ProductMedia
          image={{
            id: "editorial-campaign",
            motif: "runway",
            tone: ["#7c2230", "#f2e7dd"],
            alt: EDITORIAL.title,
          }}
          ratio="4/5"
        />
      </Reveal>
      <Reveal as="div" delay={140} className="md:col-span-5">
        <p className="eyebrow text-ink-3">{EDITORIAL.eyebrow}</p>
        <h2 className="display-2 mt-5">{EDITORIAL.title}</h2>
        <p className="lede mt-6">{EDITORIAL.body}</p>
        <Link href={EDITORIAL.cta.href} className="btn btn-outline mt-9">
          {EDITORIAL.cta.label}
        </Link>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------- cách thuê đồ -- */

export function HowItWorks() {
  return (
    <div className="grid gap-px bg-line md:grid-cols-4">
      {HOW_IT_WORKS.map((step, i) => (
        <Reveal key={step.step} as="div" delay={i * 80} className="bg-canvas p-7 md:p-8">
          <p className="font-display text-[40px] leading-none text-accent/35">{step.step}</p>
          <h3 className="display-4 mt-6">{step.title}</h3>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function WhyRent() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-x-16">
      {WHY_RENT.map((item, i) => (
        <Reveal key={item.title} as="div" delay={i * 70} className="border-t border-line pt-6">
          <h3 className="display-4">{item.title}</h3>
          <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-ink-2">{item.body}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- reviews -- */

export function ReviewWall() {
  return (
    <div className="grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
      {FEATURED_REVIEWS.map((review, i) => {
        const product = getProduct(review.productSlug);
        return (
          <Reveal key={review.id} as="figure" delay={i * 70} className="flex h-full flex-col bg-canvas p-7">
            <Stars value={review.rating} size={13} />
            <blockquote className="mt-5 flex-1 text-[14px] leading-relaxed">“{review.content}”</blockquote>
            <figcaption className="mt-6 border-t border-line pt-4">
              <p className="text-[13px]">{review.author}</p>
              {product && (
                <Link href={`/san-pham/${product.slug}`} className="link-line link-underline-in mt-1 block text-[12px] text-ink-2">
                  {product.name} · size {review.sizeWorn}
                </Link>
              )}
            </figcaption>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- lookbook -- */

export function Lookbook() {
  return (
    <div className="no-scrollbar -mx-[clamp(1.25rem,4vw,4rem)] flex snap-x gap-3 overflow-x-auto px-[clamp(1.25rem,4vw,4rem)] lg:mx-0 lg:grid lg:grid-cols-6 lg:px-0">
      {LOOKBOOK.map((item, i) => {
        const product = getProduct(item.slug);
        if (!product) return null;
        return (
          <Reveal key={item.handle + i} as="div" delay={i * 60} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] lg:w-auto">
            <Link href={`/san-pham/${product.slug}`} className="group block">
              <ProductMedia image={product.images[(i + 2) % product.images.length]} ratio="1/1" />
              <p className="mt-3 text-[12px]">{item.handle}</p>
              <p className="text-[11.5px] text-ink-3">{item.caption}</p>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
