"use client";

import Link from "next/link";
import { OrderStatusChip } from "@/components/domain/Chips";
import { IconArrowLeft, IconMail, IconPhone, IconPin, IconRuler } from "@/components/ui/Icons";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, StatusChip } from "@/components/ui/Primitives";
import { CUSTOMERS, ordersOfCustomer } from "@/data/operations";
import { REVIEWS } from "@/data/reviews";
import { formatDate, formatDateTime } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { isActiveRental } from "@/lib/order-status";
import { useSession } from "@/store/session";

export function CustomerDetail({ id }: { id: string }) {
  const session = useSession();
  const customer = CUSTOMERS.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="card">
        <EmptyState
          title="Không tìm thấy khách hàng"
          body={`Không có hồ sơ nào ứng với mã ${id}.`}
          action={
            <Link href="/customers" className="btn btn-outline btn-sm">
              Về danh sách khách hàng
            </Link>
          }
        />
      </div>
    );
  }

  const orders = ordersOfCustomer(customer.id);
  const active = orders.filter((o) => isActiveRental(o.status));
  const reviews = REVIEWS.filter((r) => r.author === customer.name);

  return (
    <>
      <Link href="/customers" className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink">
        <IconArrowLeft width={13} height={13} />
        Khách hàng
      </Link>

      <PageHeader
        title={customer.name}
        description={`Thành viên từ ${formatDate(customer.joinedAt.slice(0, 10))} · ${customer.totalRentals} lượt thuê đã hoàn tất`}
        actions={
          customer.status === "blocked" ? (
            <StatusChip tone="danger">Đang bị khoá</StatusChip>
          ) : (
            <StatusChip tone="success">Bình thường</StatusChip>
          )
        }
      />

      {customer.status === "blocked" && (
        <div className="mb-4">
          <Callout tone="danger" title="Khách đang bị khoá">
            {customer.blacklistReason}
          </Callout>
        </div>
      )}

      {customer.note && (
        <div className="mb-4">
          <Callout tone="warning" title="Lưu ý vận hành">
            {customer.note}
          </Callout>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h2 className="h-section">Đơn đang thuê</h2>
              <span className="text-[11.5px] text-ink-3">{active.length} đơn</span>
            </header>
            {active.length === 0 ? (
              <EmptyState compact title="Không có đơn đang thuê" body="Khách hiện không giữ món nào của shop." />
            ) : (
              <ul className="divide-y divide-line">
                {active.map((o) => (
                  <li key={o.code} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/orders/${o.code}`} className="num text-[12.5px] underline-offset-2 hover:underline">
                        {o.code}
                      </Link>
                      <p className="truncate text-[12px] text-ink-2">
                        {o.items.map((i) => i.productNameSnapshot).join(" · ")}
                      </p>
                      <p className="num text-[11.5px] text-ink-3">
                        {formatDate(o.pickupDate)} → {formatDate(o.returnDate)}
                      </p>
                    </div>
                    <OrderStatusChip status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <header className="border-b border-line px-4 py-2.5">
              <h2 className="h-section">Lịch sử thuê</h2>
            </header>
            {orders.length === 0 ? (
              <EmptyState compact title="Chưa có đơn nào" body="Khách chưa từng thuê tại shop." />
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Kỳ thuê</th>
                      <th>Món</th>
                      <th className="text-right">Giá trị</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.code}>
                        <td>
                          <Link href={`/orders/${o.code}`} className="num text-[12px] underline-offset-2 hover:underline">
                            {o.code}
                          </Link>
                        </td>
                        <td className="num text-[12px] text-ink-2">
                          {formatDate(o.pickupDate)} → {formatDate(o.returnDate)}
                        </td>
                        <td className="max-w-[220px] truncate text-[12px] text-ink-2">
                          {o.items.map((i) => i.productNameSnapshot).join(" · ")}
                        </td>
                        <td className="num text-right text-[12px]">{formatVnd(o.grandTotal)}</td>
                        <td>
                          <OrderStatusChip status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {reviews.length > 0 && (
            <section className="card overflow-hidden">
              <header className="border-b border-line px-4 py-2.5">
                <h2 className="h-section">Đánh giá đã gửi</h2>
              </header>
              <ul className="divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px]">{"★".repeat(r.rating)}</span>
                      <span className="text-[11.5px] text-ink-3">{formatDate(r.createdAt.slice(0, 10))}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{r.content}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card card-pad">
            <p className="label-xs mb-2">Liên hệ</p>
            <p className="num flex items-center gap-2 text-[13px]">
              <IconPhone width={14} height={14} className="text-ink-3" />
              {customer.phone}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-2">
              <IconMail width={14} height={14} className="text-ink-3" />
              {customer.email}
            </p>
            <p className="mt-1.5 flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
              <IconPin width={14} height={14} className="mt-0.5 shrink-0 text-ink-3" />
              {customer.address}
            </p>
            <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-ink-3">{customer.idCardNote}</p>
          </section>

          <section className="card card-pad">
            <p className="label-xs mb-2">Chỉ số vận hành</p>
            <KeyValue label="Tổng lượt thuê">{customer.totalRentals}</KeyValue>
            <KeyValue label="Tổng chi tiêu">{formatVnd(customer.totalSpend)}</KeyValue>
            <KeyValue label="Số lần trả trễ">
              <span className={customer.lateReturns > 0 ? "text-warning" : undefined}>{customer.lateReturns}</span>
            </KeyValue>
            <KeyValue label="Sự cố hư hỏng">
              <span className={customer.damageIncidents > 0 ? "text-danger" : undefined}>{customer.damageIncidents}</span>
            </KeyValue>
            <KeyValue label="Thuê gần nhất">
              {customer.lastRentalAt ? formatDateTime(customer.lastRentalAt) : "—"}
            </KeyValue>
          </section>

          {customer.measurements && (
            <section className="card card-pad">
              <p className="label-xs mb-2 flex items-center gap-1.5">
                <IconRuler width={13} height={13} />
                Số đo
              </p>
              <KeyValue label="Chiều cao">{customer.measurements.heightCm} cm</KeyValue>
              <KeyValue label="Cân nặng">{customer.measurements.weightKg} kg</KeyValue>
              <KeyValue label="Vòng 1 / 2 / 3">
                {customer.measurements.bust} · {customer.measurements.waist} · {customer.measurements.hip}
              </KeyValue>
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                Dùng để chọn cá thể vừa người nhất trong số các bộ cùng size khi soạn đồ.
              </p>
            </section>
          )}

          {session.can("user.manage") && (
            <section className="card card-pad">
              <p className="label-xs mb-2">Quản trị</p>
              <button type="button" className="btn btn-outline btn-sm btn-block">
                {customer.status === "blocked" ? "Mở khoá tài khoản" : "Khoá tài khoản khách"}
              </button>
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                Chỉ Admin mới đổi được trạng thái tài khoản khách.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
