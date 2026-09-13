import type { Product } from "@/lib/types";
import { CATEGORIES, getCategory } from "./catalog";
import { PRODUCTS } from "./products";

export interface Collection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  products: Product[];
  /** Danh mục con hiển thị dưới tiêu đề, nếu là nhóm lớn */
  relatedCategories: { slug: string; name: string }[];
}

const GROUP_LABEL = {
  women: "Nữ",
  men: "Nam",
  accessories: "Phụ kiện",
} as const;

/**
 * Bộ sưu tập hiển thị ở route `/danh-muc/[slug]`.
 * Ngoài slug danh mục thật, có thêm vài slug tổng hợp cho điều hướng:
 * tat-ca · moi-ve · thinh-hanh · nu · nam · phu-kien · dam-vay.
 */
export function resolveCollection(slug: string): Collection | null {
  const categoriesOf = (group: keyof typeof GROUP_LABEL) =>
    CATEGORIES.filter((c) => c.group === group).map((c) => ({ slug: c.slug, name: c.name }));

  switch (slug) {
    case "tat-ca":
      return {
        slug,
        title: "Toàn bộ bộ sưu tập",
        eyebrow: "Tủ đồ StyleRent",
        description:
          "Áo dài, dạ hội, váy cưới, vest, đồ biểu diễn và phụ kiện — tất cả đều cho thuê theo ngày, đã giặt hấp và kiểm tra trước khi đến tay bạn.",
        products: PRODUCTS,
        relatedCategories: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name })),
      };
    case "moi-ve":
      return {
        slug,
        title: "Mới về",
        eyebrow: "Vừa nhập tủ",
        description: "Những thiết kế vừa được bổ sung vào tủ đồ cho thuê trong tháng này.",
        products: PRODUCTS.filter((p) => p.isNew),
        relatedCategories: [],
      };
    case "thinh-hanh":
      return {
        slug,
        title: "Đang được thuê nhiều",
        eyebrow: "Thịnh hành",
        description: "Xếp theo số lượt thuê thực tế — những món khách quay lại nhiều nhất.",
        products: [...PRODUCTS].sort((a, b) => b.rentalCount - a.rentalCount).slice(0, 12),
        relatedCategories: [],
      };
    case "nu":
    case "nam":
    case "phu-kien": {
      const group = slug === "nu" ? "women" : slug === "nam" ? "men" : "accessories";
      const cats = CATEGORIES.filter((c) => c.group === group).map((c) => c.slug);
      return {
        slug,
        title: GROUP_LABEL[group],
        eyebrow: "Bộ sưu tập",
        description:
          group === "women"
            ? "Áo dài, đầm dạ hội, váy cưới và áo khoác — chọn theo dịp và theo khoảng ngày bạn cần."
            : group === "men"
              ? "Vest may đo, tuxedo và áo dài nam cho lễ cưới, dạ tiệc và sự kiện công ty."
              : "Clutch và trang sức — phụ kiện không cần thời gian đệm giặt ủi nên luôn sẵn sàng.",
        products: PRODUCTS.filter((p) => cats.includes(p.categorySlug)),
        relatedCategories: categoriesOf(group),
      };
    }
    case "dam-vay":
      return {
        slug,
        title: "Đầm & Váy",
        eyebrow: "Bộ sưu tập",
        description: "Từ đầm cocktail đến váy cưới — mọi dáng váy trong tủ đồ cho thuê.",
        products: PRODUCTS.filter((p) =>
          ["dam-da-hoi", "dam-du-tiec", "vay-cuoi"].includes(p.categorySlug),
        ),
        relatedCategories: [
          { slug: "dam-da-hoi", name: "Đầm dạ hội" },
          { slug: "dam-du-tiec", name: "Đầm dự tiệc" },
          { slug: "vay-cuoi", name: "Váy cưới" },
        ],
      };
    default: {
      const category = getCategory(slug);
      if (!category) return null;
      return {
        slug,
        title: category.name,
        eyebrow: GROUP_LABEL[category.group],
        description: category.description,
        products: PRODUCTS.filter((p) => p.categorySlug === slug),
        relatedCategories: CATEGORIES.filter((c) => c.group === category.group && c.slug !== slug).map((c) => ({
          slug: c.slug,
          name: c.name,
        })),
      };
    }
  }
}

export const COLLECTION_SLUGS = [
  "tat-ca",
  "moi-ve",
  "thinh-hanh",
  "nu",
  "nam",
  "phu-kien",
  "dam-vay",
  ...CATEGORIES.map((c) => c.slug),
];

/** Sản phẩm gợi ý — cùng danh mục, loại trừ chính nó. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug);
  const sameOccasion = PRODUCTS.filter(
    (p) =>
      p.slug !== product.slug &&
      !sameCategory.includes(p) &&
      p.occasions.some((o) => product.occasions.includes(o)),
  );
  return [...sameCategory, ...sameOccasion].slice(0, limit);
}

export function productsByOccasion(occasionSlug: string): Product[] {
  return PRODUCTS.filter((p) => p.occasions.includes(occasionSlug));
}
