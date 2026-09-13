import { CATEGORIES, OCCASIONS } from "@/data/catalog";

export interface NavItem {
  label: string;
  href: string;
  /** Khoá mega menu — null nghĩa là link đơn */
  menu?: "women" | "men" | "occasion" | "accessories";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Mới về", href: "/collections/moi-ve" },
  { label: "Nữ", href: "/collections/nu", menu: "women" },
  { label: "Nam", href: "/collections/nam", menu: "men" },
  { label: "Đầm & Váy", href: "/collections/dam-vay" },
  { label: "Dịp", href: "/collections/tat-ca", menu: "occasion" },
  { label: "Phụ kiện", href: "/collections/phu-kien", menu: "accessories" },
];

export function categoriesOf(group: "women" | "men" | "accessories") {
  return CATEGORIES.filter((c) => c.group === group);
}

export const OCCASION_LINKS = OCCASIONS.map((o) => ({
  ...o,
  href: `/collections/tat-ca?occasion=${o.slug}`,
}));

export const FOOTER_LINKS = [
  {
    title: "Mua sắm",
    links: [
      { label: "Toàn bộ bộ sưu tập", href: "/collections/tat-ca" },
      { label: "Mới về", href: "/collections/moi-ve" },
      { label: "Đang được thuê nhiều", href: "/collections/thinh-hanh" },
      { label: "Váy cưới", href: "/collections/vay-cuoi" },
      { label: "Vest & Tuxedo", href: "/collections/nam" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Thuê đồ hoạt động thế nào", href: "/how-it-works" },
      { label: "Chính sách thuê & hoàn cọc", href: "/policies" },
      { label: "Câu hỏi thường gặp", href: "/how-it-works#faq" },
      { label: "Bảng size", href: "/how-it-works#size" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Hồ sơ & số đo", href: "/account" },
      { label: "Đơn thuê của tôi", href: "/account/rentals" },
      { label: "Sổ địa chỉ", href: "/account/addresses" },
      { label: "Yêu thích", href: "/wishlist" },
    ],
  },
];
