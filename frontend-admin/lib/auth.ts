import { STAFF } from "@/data/operations";
import type { StaffUser } from "@/lib/admin-types";
import type { AdminRole } from "@/lib/permissions";

/**
 * Xác thực phía frontend — bản demo không có backend nên toàn bộ tài khoản
 * nhân viên dùng chung một mật khẩu mẫu. Hệ thống thật sẽ gọi POST /auth/login
 * (§7.1) và nhận JWT chứa user_id + role; frontend chỉ giữ token, không giữ mật khẩu.
 */
export const DEMO_PASSWORD = "stylerent";

export interface AuthResult {
  ok: boolean;
  user?: StaffUser;
  /** Lỗi gắn với ô nhập nào để hiển thị đúng chỗ. */
  field?: "email" | "password";
  message?: string;
}

export function authenticate(email: string, password: string): AuthResult {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { ok: false, field: "email", message: "Nhập email công việc của bạn." };
  }

  const user = STAFF.find((u) => u.email.toLowerCase() === normalized);
  if (!user) {
    return { ok: false, field: "email", message: "Email này chưa có tài khoản vận hành." };
  }
  if (user.status === "disabled") {
    return { ok: false, field: "email", message: "Tài khoản đã bị khoá. Liên hệ Admin hệ thống." };
  }
  if (!password) {
    return { ok: false, field: "password", message: "Nhập mật khẩu." };
  }
  if (password !== DEMO_PASSWORD) {
    return { ok: false, field: "password", message: "Mật khẩu không đúng." };
  }

  return { ok: true, user };
}

/** Tài khoản mẫu hiển thị ngay trên màn đăng nhập để chấm bài / demo nhanh. */
export const DEMO_ACCOUNTS: { role: AdminRole; user: StaffUser }[] = (
  ["staff", "warehouse", "manager", "admin"] as AdminRole[]
).map((role) => ({ role, user: STAFF.find((u) => u.role === role)! }));
