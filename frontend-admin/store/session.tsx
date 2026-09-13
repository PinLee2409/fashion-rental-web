"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks";
import { CURRENT_USER_BY_ROLE } from "@/data/operations";
import type { StaffUser } from "@/lib/admin-types";
import { can, canAny, type AdminRole, type Permission } from "@/lib/permissions";

/**
 * Phiên làm việc của người dùng admin.
 * Bản demo cho phép đổi vai trò ngay trên header để thấy rõ UI thay đổi theo
 * quyền; hệ thống thật sẽ lấy vai trò từ token đăng nhập.
 */
interface SessionValue {
  role: AdminRole;
  user: StaffUser;
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
  const [role, setRoleState, hydrated] = usePersistentState<AdminRole>("stylerent.admin.role", "staff");

  const setRole = useCallback((next: AdminRole) => setRoleState(next), [setRoleState]);

  const value = useMemo<SessionValue>(
    () => ({
      role,
      user: CURRENT_USER_BY_ROLE[role],
      setRole,
      can: (permission) => can(role, permission),
      canAny: (permissions) => canAny(role, permissions),
      hydrated,
    }),
    [role, setRole, hydrated],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
