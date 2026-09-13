import { AccountNav } from "@/components/account/AccountNav";
import { CUSTOMER } from "@/data/customer";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="pt-[76px]">
      <header className="shell border-b border-line py-12">
        <p className="eyebrow text-ink-3">Tài khoản</p>
        <h1 className="display-2 mt-3">Xin chào, {CUSTOMER.name.split(" ").slice(-1)[0]}</h1>
        <p className="mt-3 text-[13px] text-ink-2">
          {CUSTOMER.memberTier} · {CUSTOMER.completedRentals} đơn thuê đã hoàn tất · Thành viên từ{" "}
          {new Date(CUSTOMER.joinedAt).getFullYear()}
        </p>
      </header>

      <div className="shell grid min-w-0 gap-10 py-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <AccountNav />
        <div className="min-w-0 pb-16">{children}</div>
      </div>
    </div>
  );
}
