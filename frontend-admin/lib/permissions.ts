/**
 * RBAC — §2.2 của đặc tả.
 * Quyền đặt tên `<module>.<action>`, khớp nguyên văn ma trận phân quyền.
 * Phần frontend chỉ dùng để ẩn/hiện điều hướng và hành động; backend vẫn phải
 * kiểm tra lại bằng policy của Laravel.
 */

export type AdminRole = "staff" | "warehouse" | "manager" | "admin";

export type Permission =
  | "catalog.view"
  | "catalog.manage"
  | "unit.manage"
  | "unit.lifecycle"
  | "order.create"
  | "order.view.all"
  | "order.confirm"
  | "order.cancel"
  | "order.handover"
  | "order.return_inspect"
  | "fee.apply"
  | "fee.waive"
  | "refund.approve"
  | "payment.record"
  | "promotion.manage"
  | "report.view"
  | "user.manage"
  | "role.manage";

export const ROLE_LABEL: Record<AdminRole, string> = {
  staff: "Nhân viên bán hàng",
  warehouse: "Nhân viên kho / giặt ủi",
  manager: "Quản lý",
  admin: "Admin hệ thống",
};

export const ROLE_SHORT: Record<AdminRole, string> = {
  staff: "Staff",
  warehouse: "Warehouse",
  manager: "Manager",
  admin: "Admin",
};

export const ROLE_SCOPE: Record<AdminRole, string> = {
  staff: "Xử lý đơn, bàn giao, nhận trả, thu tiền",
  warehouse: "Cá thể trang phục, giặt ủi, sửa chữa",
  manager: "Duyệt phí & hoàn tiền, giá, khuyến mãi, báo cáo",
  admin: "Toàn quyền hệ thống, người dùng và cấu hình",
};

/** Ma trận phân quyền — sao y bảng §2.2. */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  staff: [
    "catalog.view",
    "unit.manage",
    "order.create",
    "order.view.all",
    "order.confirm",
    "order.cancel",
    "order.handover",
    "order.return_inspect",
    "fee.apply",
    "payment.record",
  ],
  warehouse: [
    "catalog.view",
    "unit.manage",
    "unit.lifecycle",
    "order.view.all",
    "order.handover",
    "order.return_inspect",
  ],
  manager: [
    "catalog.view",
    "catalog.manage",
    "unit.manage",
    "unit.lifecycle",
    "order.create",
    "order.view.all",
    "order.confirm",
    "order.cancel",
    "order.handover",
    "order.return_inspect",
    "fee.apply",
    "fee.waive",
    "refund.approve",
    "payment.record",
    "promotion.manage",
    "report.view",
  ],
  admin: [
    "catalog.view",
    "catalog.manage",
    "unit.manage",
    "unit.lifecycle",
    "order.create",
    "order.view.all",
    "order.confirm",
    "order.cancel",
    "order.handover",
    "order.return_inspect",
    "fee.apply",
    "fee.waive",
    "refund.approve",
    "payment.record",
    "promotion.manage",
    "report.view",
    "user.manage",
    "role.manage",
  ],
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: AdminRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/**
 * Nhóm quyền hiển thị ở màn hình Vai trò & phân quyền.
 * `specified: false` = đặc tả chưa nêu mã quyền riêng, frontend suy ra từ
 * quyền gần nhất trong §2.2 (ghi rõ để hội đồng đối chiếu được).
 */
export const PERMISSION_GROUPS: {
  module: string;
  items: { key: Permission; label: string; hint?: string }[];
}[] = [
  {
    module: "Catalog & giá",
    items: [
      { key: "catalog.view", label: "Xem catalog" },
      { key: "catalog.manage", label: "Quản lý sản phẩm, biến thể, bảng giá" },
    ],
  },
  {
    module: "Kho & cá thể",
    items: [
      { key: "unit.manage", label: "Quản lý cá thể, mã QR, tình trạng" },
      { key: "unit.lifecycle", label: "Vòng đời cá thể: giặt / sửa / thanh lý" },
    ],
  },
  {
    module: "Đơn thuê",
    items: [
      { key: "order.create", label: "Tạo đơn (online & tại quầy)" },
      { key: "order.view.all", label: "Xem toàn bộ đơn" },
      { key: "order.confirm", label: "Xác nhận đơn" },
      { key: "order.cancel", label: "Huỷ đơn" },
      { key: "order.handover", label: "Bàn giao đồ" },
      { key: "order.return_inspect", label: "Nhận lại & lập biên bản kiểm tra" },
    ],
  },
  {
    module: "Tiền & phí",
    items: [
      { key: "fee.apply", label: "Áp phí phát sinh", hint: "Hạn mức tự quyết 500.000₫" },
      { key: "fee.waive", label: "Miễn / giảm phí phát sinh", hint: "Tách khỏi người áp phí" },
      { key: "refund.approve", label: "Duyệt hoàn cọc" },
      { key: "payment.record", label: "Ghi nhận thu tiền mặt" },
    ],
  },
  {
    module: "Vận hành khác",
    items: [
      { key: "promotion.manage", label: "Quản lý khuyến mãi" },
      { key: "report.view", label: "Xem báo cáo" },
    ],
  },
  {
    module: "Hệ thống",
    items: [
      { key: "user.manage", label: "Quản lý người dùng" },
      { key: "role.manage", label: "Quản lý vai trò & phân quyền" },
    ],
  },
];
