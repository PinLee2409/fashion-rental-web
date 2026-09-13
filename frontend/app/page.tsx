import { Hero } from "@/components/home/Hero";
import {
  CategoryStrip,
  EditorialBlock,
  HowItWorks,
  Lookbook,
  Marquee,
  OccasionGrid,
  ReviewWall,
  SectionHead,
  WhyRent,
} from "@/components/home/Sections";
import { ProductRail } from "@/components/product/ProductGrid";
import { HomeDateBar } from "@/components/home/HomeDateBar";
import { PRODUCTS } from "@/data/products";

export default function HomePage() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew).slice(0, 4);
  const trending = [...PRODUCTS].sort((a, b) => b.rentalCount - a.rentalCount).slice(0, 4);

  return (
    <>
      <Hero />
      <HomeDateBar />
      <Marquee />

      <section className="shell py-20 md:py-28">
        <SectionHead
          eyebrow="Tủ đồ"
          title="Thuê theo danh mục"
          link={{ label: "Toàn bộ bộ sưu tập", href: "/collections/tat-ca" }}
        />
        <CategoryStrip />
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHead eyebrow="Vừa nhập tủ" title="Mới về" link={{ label: "Xem tất cả", href: "/collections/moi-ve" }} />
        <ProductRail products={newArrivals} />
      </section>

      <section className="bg-warm py-20 md:py-28">
        <div className="shell">
          <SectionHead
            eyebrow="Khách quay lại nhiều nhất"
            title="Đang được thuê nhiều"
            link={{ label: "Xem bảng xếp hạng", href: "/collections/thinh-hanh" }}
          />
          <ProductRail products={trending} />
        </div>
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHead eyebrow="Dịp sử dụng" title="Bạn cần đồ cho dịp nào?" />
        <OccasionGrid />
      </section>

      <section className="shell py-20 md:py-28">
        <EditorialBlock />
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHead
          eyebrow="Bốn bước"
          title="Thuê đồ hoạt động thế nào"
          link={{ label: "Hướng dẫn chi tiết", href: "/how-it-works" }}
        />
        <HowItWorks />
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHead eyebrow="Vì sao thuê" title="Mặc nhiều hơn, sở hữu ít đi" align="center" />
        <WhyRent />
      </section>

      <section className="shell py-20 md:py-28">
        <SectionHead eyebrow="Khách nói gì" title="Đánh giá sau khi trả đồ" />
        <ReviewWall />
      </section>

      <section className="shell pb-8 pt-20 md:pt-28">
        <SectionHead eyebrow="Lookbook" title="Ảnh khách gửi về" />
        <Lookbook />
      </section>
    </>
  );
}
