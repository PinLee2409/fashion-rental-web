import { CATEGORIES, OCCASIONS } from "@/data/catalog";

export interface NavItem {
  label: string;
  href: string;
  /** Khoá mega menu — null nghĩa là link đơn */
  menu?: "women" | "men" | "occasion" | "accessories";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Mới về", href: "/danh-muc/moi-ve" },
  { label: "Nữ", href: "/danh-muc/nu", menu: "women" },
  { label: "Nam", href: "/danh-muc/nam", menu: "men" },
  { label: "Đầm & Váy", href: "/danh-muc/dam-vay" },
  { label: "Dịp", href: "/danh-muc/tat-ca", menu: "occasion" },
  { label: "Phụ kiện", href: "/danh-muc/phu-kien", menu: "accessories" },
];

export function categoriesOf(group: "women" | "men" | "accessories") {
  return CATEGORIES.filter((c) => c.group === group);
}

export const OCCASION_LINKS = OCCASIONS.map((o) => ({
  ...o,
  href: `/danh-muc/tat-ca?dip=${o.slug}`,
}));

export const FOOTER_LINKS = [
  {
    title: "Mua sắm",
    links: [
      { label: "Toàn bộ bộ sưu tập", href: "/danh-muc/tat-ca" },
      { label: "Mới về", href: "/danh-muc/moi-ve" },
      { label: "Đang được thuê nhiều", href: "/danh-muc/thinh-hanh" },
      { label: "Váy cưới", href: "/danh-muc/vay-cuoi" },
      { label: "Vest & Tuxedo", href: "/danh-muc/nam" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Thuê đồ hoạt động thế nào", href: "/huong-dan" },
      { label: "Chính sách thuê & hoàn cọc", href: "/chinh-sach" },
      { label: "Câu hỏi thường gặp", href: "/huong-dan#faq" },
      { label: "Bảng size", href: "/huong-dan#size" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Hồ sơ & số đo", href: "/tai-khoan" },
      { label: "Đơn thuê của tôi", href: "/tai-khoan/don-thue" },
      { label: "Sổ địa chỉ", href: "/tai-khoan/dia-chi" },
      { label: "Yêu thích", href: "/yeu-thich" },
    ],
  },
];
