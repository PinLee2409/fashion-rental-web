import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/layout/Providers";
import { STORE } from "@/lib/settings";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${STORE.brand} — ${STORE.tagline}`,
    template: `%s · ${STORE.brand}`,
  },
  description:
    "Cho thuê trang phục cao cấp theo ngày: áo dài, đầm dạ hội, váy cưới, vest và phụ kiện. Chọn ngày, kiểm tra lịch trống, nhận đồ đã giặt hấp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
