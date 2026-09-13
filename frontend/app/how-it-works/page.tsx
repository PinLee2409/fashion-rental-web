import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorks } from "@/components/home/Sections";
import { Accordion, Reveal } from "@/components/ui/Primitives";
import { FAQ, GUIDE_STEPS } from "@/data/content";
import { PRODUCTS } from "@/data/products";
import { SETTINGS, STORE } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Thuê đồ hoạt động thế nào",
  description:
    "Hướng dẫn thuê trang phục tại StyleRent: chọn ngày, kiểm tra lịch trống, đặt cọc giữ chỗ, nhận đồ và trả đồ.",
};

export default function GuidePage() {
  const sizeChart = PRODUCTS.find((p) => p.slug === "ao-dai-cach-tan-do-theu-sen")!.sizeChart;

  return (
    <div className="pt-[76px]">
      <header className="shell border-b border-line py-16 md:py-20">
        <Reveal className="max-w-[760px]">
          <p className="eyebrow text-ink-3">Hướng dẫn</p>
          <h1 className="display-1 mt-5">Thuê đồ hoạt động thế nào</h1>
          <p className="lede mt-6 max-w-[62ch]">
            Thuê trang phục khác mua đồ ở một điểm: mỗi món là một cá thể vật lý có lịch bận riêng. Dưới đây là toàn bộ
            hành trình, từ lúc chọn ngày tới lúc nhận lại tiền cọc.
          </p>
        </Reveal>
      </header>

      <section className="shell py-16">
        <HowItWorks />
      </section>

      <section className="shell border-t border-line py-16">
        <Reveal as="header" className="pb-10">
          <p className="eyebrow text-ink-3">Lưu ý theo từng chặng</p>
          <h2 className="display-2 mt-4">Để lượt thuê diễn ra trơn tru</h2>
        </Reveal>
        <div className="grid gap-px bg-line md:grid-cols-2">
          {GUIDE_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 70} className="bg-canvas p-7 md:p-8">
              <h3 className="display-4">{step.title}</h3>
              <p className="mt-3 max-w-[54ch] text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bảng size */}
      <section id="size" className="shell border-t border-line py-16">
        <Reveal as="header" className="pb-8">
          <p className="eyebrow text-ink-3">Chọn size</p>
          <h2 className="display-2 mt-4">Bảng size tham khảo</h2>
          <p className="lede mt-4 max-w-[62ch] text-[14px]">
            Mỗi thiết kế có bảng size riêng hiển thị ngay trong trang sản phẩm. Nếu số đo của bạn nằm giữa hai size,
            hãy chọn size lớn hơn — shop có thể kẹp lai hoặc chỉnh nhẹ khi bạn nhận đồ.
          </p>
        </Reveal>
        <Reveal delay={100} className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-3 pr-4 font-medium">Size</th>
                <th className="py-3 pr-4 font-medium">Vòng 1 (cm)</th>
                <th className="py-3 pr-4 font-medium">Vòng 2 (cm)</th>
                <th className="py-3 pr-4 font-medium">Vòng 3 (cm)</th>
                <th className="py-3 font-medium">Dài áo (cm)</th>
              </tr>
            </thead>
            <tbody className="text-ink-2">
              {sizeChart.map((row) => (
                <tr key={row.size} className="border-b border-line">
                  <td className="py-3 pr-4 text-ink">{row.size}</td>
                  <td className="py-3 pr-4">{row.bust}</td>
                  <td className="py-3 pr-4">{row.waist}</td>
                  <td className="py-3 pr-4">{row.hip}</td>
                  <td className="py-3">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="shell border-t border-line py-16">
        <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-ink-3">Hỏi nhanh</p>
            <h2 className="display-2 mt-4">Câu hỏi thường gặp</h2>
            <p className="lede mt-5 text-[14px]">
              Không tìm thấy câu trả lời? Gọi {STORE.phone} trong giờ mở cửa {STORE.hours}.
            </p>
            <Link href="/policies" className="btn btn-outline mt-7">
              Xem chính sách đầy đủ
            </Link>
          </Reveal>

          <Reveal delay={100} className="min-w-0">
            <Accordion
              defaultOpen={0}
              items={FAQ.map((item) => ({ title: item.q, content: <p className="max-w-[70ch]">{item.a}</p> }))}
            />
          </Reveal>
        </div>
      </section>

      <section className="shell border-t border-line py-16">
        <Reveal className="bg-warm px-8 py-12 text-center md:px-16 md:py-16">
          <h2 className="display-2 mx-auto max-w-[18ch]">Sẵn sàng chọn đồ cho dịp sắp tới?</h2>
          <p className="lede mx-auto mt-5 max-w-[52ch] text-[14px]">
            Chọn ngày trước, hệ thống sẽ chỉ hiện những món thật sự còn rảnh — đặt trước tối đa{" "}
            {SETTINGS.max_advance_days} ngày.
          </p>
          <Link href="/collections/tat-ca" className="btn mt-8">
            Khám phá bộ sưu tập
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
