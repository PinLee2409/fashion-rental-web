"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconPlus, IconUsers } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, MoreMenu, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { STAFF } from "@/data/operations";
import { formatDateTime } from "@/lib/date";
import { ROLE_LABEL, ROLE_SHORT } from "@/lib/permissions";
import type { StaffUser } from "@/lib/admin-types";
import { useSession } from "@/store/session";

export default function UsersPage() {
  const session = useSession();
  const toast = useToast();
  const [disabled, setDisabled] = useState<string[]>([]);

  if (!session.can("user.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconUsers width={22} height={22} />}
          title="Chỉ Admin quản lý được người dùng"
          body="Thêm, khoá hoặc đổi vai trò nhân viên là quyền của Admin hệ thống."
        />
      </div>
    );
  }

  const columns: Column<StaffUser>[] = [
    {
      key: "name",
      header: "Người dùng",
      sortValue: (u) => u.name,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-beige text-[11px] font-medium">
            {u.name.split(" ").slice(-1)[0][0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px]">{u.name}</p>
            <p className="truncate text-[11px] text-ink-3">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      width: "190px",
      sortValue: (u) => u.role,
      render: (u) => (
        <div>
          <StatusChip tone={u.role === "admin" ? "danger" : u.role === "manager" ? "accent" : "neutral"} dot={false}>
            {ROLE_SHORT[u.role]}
          </StatusChip>
          <p className="mt-1 text-[11px] text-ink-3">{ROLE_LABEL[u.role]}</p>
        </div>
      ),
    },
    {
      key: "shift",
      header: "Ca / bộ phận",
      hideBelow: "lg",
      render: (u) => <span className="text-[12px] text-ink-2">{u.shift ?? "—"}</span>,
    },
    {
      key: "active",
      header: "Hoạt động gần nhất",
      width: "170px",
      hideBelow: "md",
      sortValue: (u) => u.lastActiveAt,
      render: (u) => <span className="num text-[12px] text-ink-2">{formatDateTime(u.lastActiveAt)}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "120px",
      render: (u) =>
        disabled.includes(u.id) ? <StatusChip tone="danger">Đã khoá</StatusChip> : <StatusChip tone="success">Đang hoạt động</StatusChip>,
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "right",
      render: (u) => (
        <MoreMenu
          items={[
            { label: "Đổi vai trò", onSelect: () => toast.push({ tone: "info", title: "Đổi vai trò", body: u.name }) },
            { label: "Đặt lại mật khẩu", onSelect: () => toast.push({ tone: "info", title: "Đã gửi email đặt lại mật khẩu" }) },
            {
              label: disabled.includes(u.id) ? "Mở khoá tài khoản" : "Khoá tài khoản",
              danger: !disabled.includes(u.id),
              onSelect: () => {
                setDisabled((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]));
                toast.push({
                  tone: disabled.includes(u.id) ? "success" : "warning",
                  title: disabled.includes(u.id) ? "Đã mở khoá" : "Đã khoá tài khoản",
                  body: u.name,
                });
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Người dùng hệ thống"
        description="Tài khoản nhân viên vận hành. Mỗi người một vai trò, quyền lấy theo ma trận phân quyền."
        breadcrumb={[{ label: "Hệ thống" }, { label: "Cài đặt", href: "/settings" }, { label: "Người dùng" }]}
        actions={
          <button
            type="button"
            onClick={() => toast.push({ tone: "info", title: "Mời người dùng mới", body: "Nhập email và chọn vai trò." })}
            className="btn btn-sm gap-1.5"
          >
            <IconPlus width={14} height={14} />
            Thêm người dùng
          </button>
        }
      />

      <DataTable columns={columns} rows={STAFF} getKey={(u) => u.id} density="comfortable" />

      <div className="mt-4">
        <Callout tone="info">
          Tài khoản khách hàng nằm ở mục Khách hàng, tách riêng khỏi tài khoản nhân viên vận hành.
        </Callout>
      </div>
    </>
  );
}
