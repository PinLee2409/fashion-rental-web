import type { Category, Occasion } from "@/lib/types";

/**
 * Danh mục — `categories` (id, parent_id, name, slug, clean_buffer_days...).
 * `cleanBufferDays` quyết định khoảng đệm giặt ủi sau mỗi lượt thuê (BR-02):
 * váy cưới 2 ngày, áo dài 1 ngày, phụ kiện 0 ngày.
 */
export const CATEGORIES: Category[] = [
  {
    id: "c-ao-dai",
    slug: "ao-dai",
    name: "Áo dài",
    parentSlug: null,
    description:
      "Áo dài truyền thống và cách tân, lụa tơ tằm và gấm thêu tay — cho cưới hỏi, Tết và những dịp cần chỉn chu.",
    cleanBufferDays: 1,
    sortOrder: 1,
    group: "women",
  },
  {
    id: "c-dam-da-hoi",
    slug: "dam-da-hoi",
    name: "Đầm dạ hội",
    parentSlug: null,
    description: "Những chiếc đầm dài dành cho gala, tiệc cưới và thảm đỏ.",
    cleanBufferDays: 1,
    sortOrder: 2,
    group: "women",
  },
  {
    id: "c-vay-cuoi",
    slug: "vay-cuoi",
    name: "Váy cưới",
    parentSlug: null,
    description: "Váy cưới ren, satin và tulle. Cần 2 ngày đệm để giặt hấp chuyên sâu sau mỗi lượt thuê.",
    cleanBufferDays: 2,
    sortOrder: 3,
    group: "women",
  },
  {
    id: "c-dam-du-tiec",
    slug: "dam-du-tiec",
    name: "Đầm dự tiệc",
    parentSlug: null,
    description: "Đầm cocktail, đầm midi cho tiệc tối, sinh nhật và hẹn hò.",
    cleanBufferDays: 1,
    sortOrder: 4,
    group: "women",
  },
  {
    id: "c-ao-khoac",
    slug: "ao-khoac",
    name: "Áo khoác",
    parentSlug: null,
    description: "Trench, blazer và áo khoác da — lớp ngoài làm nên dáng vẻ của cả bộ đồ.",
    cleanBufferDays: 1,
    sortOrder: 5,
    group: "women",
  },
  {
    id: "c-do-bieu-dien",
    slug: "do-bieu-dien",
    name: "Đồ biểu diễn & Cosplay",
    parentSlug: null,
    description: "Trang phục sân khấu, cosplay và lễ hội — thiết kế để lên hình và lên sân khấu.",
    cleanBufferDays: 1,
    sortOrder: 6,
    group: "women",
  },
  {
    id: "c-vest-nam",
    slug: "vest-nam",
    name: "Vest & Suit nam",
    parentSlug: null,
    description: "Suit may đo dáng slim và classic, đủ cỡ cho chú rể và khách mời.",
    cleanBufferDays: 1,
    sortOrder: 7,
    group: "men",
  },
  {
    id: "c-tuxedo",
    slug: "tuxedo",
    name: "Tuxedo",
    parentSlug: null,
    description: "Tuxedo ve satin cho tiệc tối black-tie.",
    cleanBufferDays: 1,
    sortOrder: 8,
    group: "men",
  },
  {
    id: "c-ao-dai-nam",
    slug: "ao-dai-nam",
    name: "Áo dài nam",
    parentSlug: null,
    description: "Áo dài gấm nam cho lễ ăn hỏi, chụp ảnh cưới và Tết.",
    cleanBufferDays: 1,
    sortOrder: 9,
    group: "men",
  },
  {
    id: "c-tui-clutch",
    slug: "tui-clutch",
    name: "Túi & Clutch",
    parentSlug: null,
    description: "Clutch dạ tiệc và túi nhỏ — phụ kiện không cần thời gian đệm giặt ủi.",
    cleanBufferDays: 0,
    sortOrder: 10,
    group: "accessories",
  },
  {
    id: "c-trang-suc",
    slug: "trang-suc",
    name: "Trang sức",
    parentSlug: null,
    description: "Bông tai, vòng cổ và cài tóc để hoàn thiện tổng thể.",
    cleanBufferDays: 0,
    sortOrder: 11,
    group: "accessories",
  },
];

export const CATEGORY_GROUPS: { key: Category["group"]; label: string; href: string; blurb: string }[] = [
  { key: "women", label: "Nữ", href: "/collections/nu", blurb: "Áo dài, đầm dạ hội, váy cưới" },
  { key: "men", label: "Nam", href: "/collections/nam", blurb: "Vest, tuxedo, áo dài nam" },
  { key: "accessories", label: "Phụ kiện", href: "/collections/phu-kien", blurb: "Clutch, trang sức" },
];

/** `products.occasion` — dịp sử dụng (json) */
export const OCCASIONS: Occasion[] = [
  { slug: "cuoi", name: "Cưới & Đính hôn", blurb: "Cô dâu, chú rể, lễ gia tiên" },
  { slug: "khach-moi-cuoi", name: "Khách mời đám cưới", blurb: "Chỉn chu nhưng không lấn át cô dâu" },
  { slug: "tet", name: "Tết & Lễ truyền thống", blurb: "Áo dài, gấm, màu son" },
  { slug: "da-tiec", name: "Dạ tiệc & Gala", blurb: "Đầm dài, tuxedo, black-tie" },
  { slug: "chup-anh", name: "Chụp ảnh & Lookbook", blurb: "Lên hình là ưu tiên số một" },
  { slug: "bieu-dien", name: "Biểu diễn & Cosplay", blurb: "Sân khấu, sự kiện, lễ hội" },
  { slug: "cong-so", name: "Sự kiện công ty", blurb: "Year end party, hội thảo" },
  { slug: "hen-ho", name: "Hẹn hò & Dạo phố", blurb: "Nhẹ nhàng, thoải mái, có gu" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getOccasion(slug: string): Occasion | undefined {
  return OCCASIONS.find((o) => o.slug === slug);
}

/** BR-02 — buffer giặt ủi theo danh mục, mặc định 1 ngày. */
export function cleanBufferFor(categorySlug: string): number {
  return getCategory(categorySlug)?.cleanBufferDays ?? 1;
}

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Free"];

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
}
