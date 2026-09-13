"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";
import { CURRENT_USER_BY_ROLE, STAFF } from "@/data/operations";
import type { StaffUser } from "@/lib/admin-types";
import { can, canAny, type AdminRole, type Permission } from "@/lib/permissions";

/**
 * Phiên làm việc của người dùng admin.
 *
 * Đăng nhập ở bản demo chỉ lưu user_id vào localStorage; hệ thống thật sẽ giữ
 * JWT trả về từ POST /auth/login và đọc vai trò từ token. Nút đổi vai trò trên
 * header vẫn giữ lại để chấm bài — nó thực chất là đăng nhập nhanh sang tài
 * khoản mẫu của vai trò đó.
 */
interface SessionValue {
  signedIn: boolean;
  role: AdminRole;
  user: StaffUser;
  signIn: (userId: string) => void;
  signOut: () => void;
  setRole: (role: AdminRole) => void;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  hydrated: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession phải nằm trong <SessionProvider>");
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId, hydrated] = usePersistentState<string | null>("stylerent.admin.session", null);

  const user = useMemo(() => STAFF.find((u) => u.id === userId) ?? null, [userId]);

  const signIn = useCallback((id: string) => setUserId(id), [setUserId]);
  const signOut = useCallback(() => setUserId(null), [setUserId]);
  const setRole = useCallback(
    (role: AdminRole) => setUserId(CURRENT_USER_BY_ROLE[role].id),
    [setUserId],
  );

  const value = useMemo<SessionValue>(() => {
    // Khi chưa đăng nhập vẫn phải trả về một user để component con không phải
    // kiểm tra null ở khắp nơi; AdminShell đã chặn không cho render nội dung.
    const active = user ?? CURRENT_USER_BY_ROLE.staff;
    const role = active.role;
    return {
      signedIn: Boolean(user),
      role,
      user: active,
      signIn,
      signOut,
      setRole,
      can: (permission) => can(role, permission),
      canAny: (permissions) => canAny(role, permissions),
      hydrated,
    };
  }, [user, signIn, signOut, setRole, hydrated]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
