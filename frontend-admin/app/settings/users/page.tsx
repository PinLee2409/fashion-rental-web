"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconAlert, IconCheck, IconPlus, IconUsers } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, MoreMenu, StatusChip, Switch } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { STAFF } from "@/data/operations";
import { formatDateTime } from "@/lib/date";
import { PERMISSION_GROUPS, ROLE_LABEL, ROLE_PERMISSIONS, ROLE_SCOPE, ROLE_SHORT, type AdminRole } from "@/lib/permissions";
import type { StaffUser } from "@/lib/admin-types";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const ROLES: AdminRole[] = ["staff", "warehouse", "manager", "admin"];
const SHIFTS = ["Ca sáng 08:00 – 16:00", "Ca chiều 13:00 – 21:00", "Ca hành chính 08:30 – 17:30", "Theo lịch phân công"];

export default function UsersPage() {
  const session = useSession();
  const toast = useToast();

  const [invited, setInvited] = useState<StaffUser[]>([]);
  const [roleOverride, setRoleOverride] = useState<Record<string, AdminRole>>({});
  const [disabled, setDisabled] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState<StaffUser | null>(null);

  const rows = useMemo(() => [...invited, ...STAFF], [invited]);
  const roleOf = (u: StaffUser) => roleOverride[u.id] ?? u.role;

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
          <span data-thumb className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-beige text-[11px] font-medium">
            {initial(u.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px]">
              {u.name}
              {u.id === session.user.id && <span className="ml-1.5 text-[11px] text-ink-3">(bạn)</span>}
            </p>
            <p className="truncate text-[11px] text-ink-3">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      width: "190px",
      sortValue: (u) => roleOf(u),
      render: (u) => {
        const role = roleOf(u);
        return (
          <div>
            <StatusChip tone={role === "admin" ? "danger" : role === "manager" ? "accent" : "neutral"} dot={false}>
              {ROLE_SHORT[role]}
            </StatusChip>
            <p className="mt-1 text-[11px] text-ink-3">{ROLE_LABEL[role]}</p>
          </div>
        );
      },
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
      width: "142px",
      render: (u) => {
        const active = !disabled.includes(u.id);
        const self = u.id === session.user.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              disabled={self}
              label={`Bật/tắt tài khoản ${u.name}`}
              onChange={(next) => {
                setDisabled((p) => (next ? p.filter((x) => x !== u.id) : [...p, u.id]));
                toast.push({
                  tone: next ? "success" : "warning",
                  title: next ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản",
                  body: u.name,
                });
              }}
            />
            <span className={cn("text-[11.5px]", active ? "text-ink-2" : "text-danger")}>
              {active ? "Hoạt động" : "Đã khoá"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "right",
      render: (u) => (
        <MoreMenu
          items={[
            { label: "Đổi vai trò", onSelect: () => setRoleEditing(u) },
            {
              label: "Gửi lại email đặt mật khẩu",
              onSelect: () => toast.push({ tone: "info", title: "Đã gửi email đặt mật khẩu", body: u.email }),
            },
            {
              label: disabled.includes(u.id) ? "Mở khoá tài khoản" : "Khoá tài khoản",
              danger: !disabled.includes(u.id),
              disabled: u.id === session.user.id,
              hint: u.id === session.user.id ? "Không tự khoá tài khoản đang đăng nhập" : undefined,
              onSelect: () => {
                const nowDisabled = disabled.includes(u.id);
                setDisabled((p) => (nowDisabled ? p.filter((x) => x !== u.id) : [...p, u.id]));
                toast.push({
                  tone: nowDisabled ? "success" : "warning",
                  title: nowDisabled ? "Đã mở khoá" : "Đã khoá tài khoản",
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
          <button type="button" onClick={() => setFormOpen(true)} className="btn btn-sm gap-1.5">
            <IconPlus width={14} height={14} />
            Thêm người dùng
          </button>
        }
        meta={
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
            <span>
              Tổng <span className="num text-ink">{rows.length}</span> tài khoản
            </span>
            {ROLES.map((r) => (
              <span key={r}>
                {ROLE_SHORT[r]} <span className="num text-ink">{rows.filter((u) => roleOf(u) === r).length}</span>
              </span>
            ))}
          </div>
        }
      />

      <DataTable columns={columns} rows={rows} getKey={(u) => u.id} density="comfortable" />

      <div className="mt-4">
        <Callout tone="info">
          Tài khoản khách hàng nằm ở mục Khách hàng, tách riêng khỏi tài khoản nhân viên vận hành.
        </Callout>
      </div>

      {/* Key ép form dựng lại mỗi lần mở để không giữ dữ liệu của lượt trước. */}
      <UserFormDialog
        key={formOpen ? "open" : "closed"}
        open={formOpen}
        existingEmails={rows.map((u) => u.email.toLowerCase())}
        onClose={() => setFormOpen(false)}
        onCreate={(user) => {
          setInvited((p) => [user, ...p]);
          setFormOpen(false);
          toast.push({
            tone: "success",
            title: "Đã tạo tài khoản",
            body: `${user.name} · ${ROLE_LABEL[user.role]} — email đặt mật khẩu đã gửi tới ${user.email}`,
          });
        }}
      />

      <RoleDialog
        key={roleEditing?.id ?? "none"}
        user={roleEditing}
        currentRole={roleEditing ? roleOf(roleEditing) : "staff"}
        onClose={() => setRoleEditing(null)}
        onSave={(user, role) => {
          setRoleOverride((p) => ({ ...p, [user.id]: role }));
          setRoleEditing(null);
          toast.push({ tone: "success", title: `${user.name} → ${ROLE_LABEL[role]}`, body: "Quyền áp dụng ở lần đăng nhập kế tiếp." });
        }}
      />
    </>
  );
}

/* ==========================================================================
   Thêm người dùng
   ========================================================================== */

function UserFormDialog({
  open,
  existingEmails,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingEmails: string[];
  onClose: () => void;
  onCreate: (user: StaffUser) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [shift, setShift] = useState(SHIFTS[0]);
  const [sendInvite, setSendInvite] = useState(true);
  const [touched, setTouched] = useState(false);

  const errors = {
    name: name.trim().length < 3 ? "Nhập họ tên đầy đủ." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Email không hợp lệ."
      : existingEmails.includes(email.trim().toLowerCase())
        ? "Email này đã có tài khoản."
        : "",
  };
  const valid = !errors.name && !errors.email;

  function submit() {
    setTouched(true);
    if (!valid) return;
    onCreate({
      id: `u-new-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: "active",
      lastActiveAt: new Date().toISOString(),
      shift,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm người dùng vận hành"
      description="Tài khoản được tạo ở trạng thái chờ đặt mật khẩu. Người dùng tự đặt mật khẩu qua email, Admin không thấy mật khẩu."
      width="max-w-[640px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" onClick={submit} disabled={touched && !valid} className="btn btn-sm">
            Tạo tài khoản
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="u-name">
              Họ và tên
            </label>
            <input
              id="u-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Thu Hà"
              className={cn("field", touched && errors.name && "field-error")}
            />
            {touched && errors.name && <p className="field-hint text-danger">{errors.name}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="u-email">
              Email công việc
            </label>
            <input
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ha.nguyen@stylerent.vn"
              className={cn("field", touched && errors.email && "field-error")}
            />
            {touched && errors.email ? (
              <p className="field-hint text-danger">{errors.email}</p>
            ) : (
              <p className="field-hint">Email này cũng là tên đăng nhập.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="u-shift">
              Ca làm việc
            </label>
            <select id="u-shift" value={shift} onChange={(e) => setShift(e.target.value)} className="field">
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="field-label">Vai trò</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                  role === r ? "border-ink bg-beige" : "border-line bg-surface hover:border-ink-3",
                )}
              >
                <span className="mt-0.5 w-3.5 shrink-0">{role === r && <IconCheck width={13} height={13} />}</span>
                <span className="min-w-0">
                  <span className="block text-[12.5px]">{ROLE_LABEL[r]}</span>
                  <span className="block text-[11px] leading-snug text-ink-3">{ROLE_SCOPE[r]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <RolePreview role={role} />

        {role === "admin" && (
          <Callout tone="warning" icon={<IconAlert width={15} height={15} />}>
            Admin có toàn quyền, kể cả đổi cấu hình tiền cọc và hạn mức duyệt phí. Chỉ cấp cho người chịu trách nhiệm hệ
            thống.
          </Callout>
        )}

        <label className="flex cursor-pointer select-none items-start gap-2 text-[12.5px] text-ink-2">
          <input
            type="checkbox"
            checked={sendInvite}
            onChange={(e) => setSendInvite(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-ink)]"
          />
          <span>
            Gửi email mời đặt mật khẩu ngay
            <span className="mt-0.5 block text-[11px] text-ink-3">
              Bỏ chọn nếu muốn kích hoạt tài khoản sau, ví dụ nhân viên chưa nhận việc.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}

/** Xem trước quyền của vai trò đang chọn — tránh cấp nhầm. */
function RolePreview({ role }: { role: AdminRole }) {
  const granted = ROLE_PERMISSIONS[role];
  return (
    <div className="card card-pad bg-surface-2">
      <p className="label-xs mb-2">
        Vai trò này được làm gì · {granted.length}/{PERMISSION_GROUPS.flatMap((g) => g.items).length} quyền
      </p>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {PERMISSION_GROUPS.flatMap((g) => g.items).map((item) => {
          const on = granted.includes(item.key);
          return (
            <div key={item.key} className="flex items-start gap-1.5 text-[11.5px]">
              <span className={cn("mt-[3px] w-3 shrink-0", on ? "text-success" : "text-ink-3")}>
                {on ? <IconCheck width={11} height={11} /> : "—"}
              </span>
              <span className={cn("min-w-0 flex-1", on ? "text-ink-2" : "text-ink-3 line-through decoration-line")}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   Đổi vai trò
   ========================================================================== */

function RoleDialog({
  user,
  currentRole,
  onClose,
  onSave,
}: {
  user: StaffUser | null;
  currentRole: AdminRole;
  onClose: () => void;
  onSave: (user: StaffUser, role: AdminRole) => void;
}) {
  const [role, setRole] = useState<AdminRole>(currentRole);

  if (!user) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Đổi vai trò · ${user.name}`}
      description="Đổi vai trò là đổi toàn bộ quyền của tài khoản. Phiên đang đăng nhập sẽ nhận quyền mới ở lần đăng nhập kế tiếp."
      width="max-w-[560px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" disabled={role === currentRole} onClick={() => onSave(user, role)} className="btn btn-sm">
            Lưu vai trò
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                role === r ? "border-ink bg-beige" : "border-line bg-surface hover:border-ink-3",
              )}
            >
              <span className="mt-0.5 w-3.5 shrink-0">{role === r && <IconCheck width={13} height={13} />}</span>
              <span className="min-w-0">
                <span className="block text-[12.5px]">
                  {ROLE_LABEL[r]}
                  {r === currentRole && <span className="ml-1.5 text-[11px] text-ink-3">đang giữ</span>}
                </span>
                <span className="block text-[11px] leading-snug text-ink-3">{ROLE_SCOPE[r]}</span>
              </span>
            </button>
          ))}
        </div>
        <RolePreview role={role} />
      </div>
    </Modal>
  );
}

function initial(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1]?.[0] ?? "?";
}
