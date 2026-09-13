"use client";

import { IconCheck, IconShield } from "@/components/ui/Icons";
import { PageHeader, Section } from "@/components/ui/PageParts";
import { Callout, EmptyState, StatusChip } from "@/components/ui/Primitives";
import { STAFF } from "@/data/operations";
import {
  can,
  PERMISSION_GROUPS,
  ROLE_LABEL,
  ROLE_SCOPE,
  ROLE_SHORT,
  type AdminRole,
} from "@/lib/permissions";
import { useSession } from "@/store/session";

const ROLES: AdminRole[] = ["staff", "warehouse", "manager", "admin"];

export default function RolesPage() {
  const session = useSession();

  if (!session.can("role.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconShield width={22} height={22} />}
          title="Chỉ Admin xem được phân quyền"
          body="Ma trận quyền quyết định ai làm được gì trong hệ thống nên chỉ Admin mới truy cập."
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Vai trò & phân quyền"
        description="Quyền đặt tên theo dạng module.hành-động. Giao diện ẩn hẳn module người dùng không có quyền, backend vẫn kiểm tra lại ở tầng policy."
        breadcrumb={[{ label: "Hệ thống" }, { label: "Cài đặt", href: "/settings" }, { label: "Vai trò & phân quyền" }]}
      />

      <div className="mb-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="card card-pad">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium">{ROLE_LABEL[role]}</p>
              <StatusChip tone={role === "admin" ? "danger" : role === "manager" ? "accent" : "neutral"} dot={false}>
                {ROLE_SHORT[role]}
              </StatusChip>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">{ROLE_SCOPE[role]}</p>
            <p className="mt-2.5 border-t border-line pt-2 text-[11.5px] text-ink-3">
              {STAFF.filter((s) => s.role === role).length} người dùng
            </p>
          </div>
        ))}
      </div>

      <Section
        title="Ma trận phân quyền"
        description="Nguyên tắc quan trọng: người áp phí và người miễn phí phải là hai vai trò khác nhau."
      >
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="min-w-[280px]">Quyền</th>
                  {ROLES.map((r) => (
                    <th key={r} className="text-center">
                      {ROLE_SHORT[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((group) => (
                  <>
                    <tr key={group.module}>
                      <td colSpan={5} className="bg-surface-2 py-1.5">
                        <span className="label-xs">{group.module}</span>
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <p className="text-[12.5px]">{item.label}</p>
                          <p className="num text-[11px] text-ink-3">
                            {item.key}
                            {item.hint ? ` · ${item.hint}` : ""}
                          </p>
                        </td>
                        {ROLES.map((role) => {
                          const allowed = can(role, item.key);
                          return (
                            <td key={role} className="text-center">
                              {allowed ? (
                                <span className="inline-grid h-5 w-5 place-items-center rounded bg-success-soft text-success">
                                  <IconCheck width={12} height={12} />
                                </span>
                              ) : (
                                <span className="text-ink-3">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <div className="mt-4">
        <Callout tone="info" icon={<IconShield width={14} height={14} />} title="Vì sao tách quyền áp phí và miễn phí">
          Nhân viên áp phí phát sinh nhưng không tự miễn được phí do chính mình áp. Mọi khoản vượt hạn mức đều đi qua
          hàng đợi duyệt của quản lý và được ghi nhật ký kèm lý do.
        </Callout>
      </div>
    </>
  );
}
