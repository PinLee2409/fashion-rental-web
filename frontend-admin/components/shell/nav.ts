import type { Permission } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Chỉ hiện khi người dùng có ít nhất một trong các quyền này */
  permissions?: Permission[];
  children?: { href: string; label: string; permissions?: Permission[] }[];
  /** Khoá đếm badge lấy từ dashboard counters */
  badge?: "orders" | "returns" | "approvals" | "maintenance" | "reviews";
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Điều hướng suy từ ma trận phân quyền §2.2 và danh sách màn hình §8.1.
 * Module nào người dùng không có quyền thì ẩn hẳn, không hiển thị mờ.
 */
export const NAV: NavGroup[] = [
  {
    title: "Vận hành",
    items: [
      { href: "/", label: "Bảng điều hành", icon: "grid" },
      { href: "/orders", label: "Đơn thuê", icon: "list", permissions: ["order.view.all"], badge: "orders" },
      { href: "/calendar", label: "Lịch thuê", icon: "calendar", permissions: ["order.view.all"] },
      {
        href: "/returns",
        label: "Quầy nhận trả",
        icon: "scan",
        permissions: ["order.return_inspect"],
        badge: "returns",
      },
    ],
  },
  {
    title: "Kho & cá thể",
    items: [
      { href: "/inventory", label: "Kho cá thể", icon: "box", permissions: ["unit.manage"] },
      {
        href: "/maintenance",
        label: "Giặt ủi & sửa chữa",
        icon: "wrench",
        permissions: ["unit.lifecycle"],
        badge: "maintenance",
      },
    ],
  },
  {
    title: "Phê duyệt",
    items: [
      {
        href: "/approvals",
        label: "Chờ duyệt",
        icon: "shield",
        permissions: ["refund.approve", "fee.waive"],
        badge: "approvals",
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/products", label: "Sản phẩm", icon: "tag", permissions: ["catalog.manage"] },
      { href: "/promotions", label: "Khuyến mãi", icon: "sparkle", permissions: ["promotion.manage"] },
      { href: "/reviews", label: "Đánh giá", icon: "star", permissions: ["catalog.manage"], badge: "reviews" },
    ],
  },
  {
    title: "Khách hàng",
    items: [{ href: "/customers", label: "Khách hàng", icon: "users", permissions: ["order.view.all"] }],
  },
  {
    title: "Phân tích",
    items: [{ href: "/reports", label: "Báo cáo", icon: "chart", permissions: ["report.view"] }],
  },
  {
    title: "Hệ thống",
    items: [
      {
        href: "/settings",
        label: "Cài đặt",
        icon: "settings",
        permissions: ["user.manage", "role.manage"],
        children: [
          { href: "/settings", label: "Cấu hình vận hành" },
          { href: "/settings/roles", label: "Vai trò & phân quyền", permissions: ["role.manage"] },
          { href: "/settings/users", label: "Người dùng", permissions: ["user.manage"] },
        ],
      },
    ],
  },
];
