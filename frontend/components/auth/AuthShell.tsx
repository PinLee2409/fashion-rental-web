import Link from "next/link";
import type { ReactNode } from "react";
import { ProductMedia } from "@/components/product/ProductMedia";
import { STORE } from "@/lib/settings";

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  tone,
  motif = "portrait",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
  tone: [string, string];
  motif?: "portrait" | "drape";
}) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
      {/* Ảnh biên tập */}
      <div className="relative hidden lg:block">
        <ProductMedia
          image={{ id: `auth-${title}`, motif, tone, alt: "StyleRent" }}
          ratio="3/4"
          className="h-full [&>div]:h-full"
          overlay
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" className="font-display text-[24px] text-canvas" style={{ letterSpacing: "0.04em" }}>
            StyleRent
          </Link>
          <div>
            <p className="display-2 max-w-[14ch] text-canvas">{STORE.tagline}</p>
            <p className="mt-4 max-w-[40ch] text-[13.5px] leading-relaxed text-canvas/75">
              Thuê trang phục cao cấp theo ngày. Cọc luôn được hoàn khi bạn trả đồ nguyên vẹn.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-[420px]">
          <Link href="/" className="font-display text-[22px] lg:hidden" style={{ letterSpacing: "0.04em" }}>
            StyleRent
          </Link>

          <p className="eyebrow mt-10 text-ink-3 lg:mt-0">{eyebrow}</p>
          <h1 className="display-2 mt-4">{title}</h1>
          <p className="lede mt-4 text-[14px]">{intro}</p>

          <div className="mt-9">{children}</div>

          <div className="mt-8 text-[13px] text-ink-2">{footer}</div>
        </div>
      </div>
    </div>
  );
}
