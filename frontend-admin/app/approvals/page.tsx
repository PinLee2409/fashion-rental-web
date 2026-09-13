"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UnitCode } from "@/components/domain/Chips";
import { IconAlert, IconCamera, IconCheck, IconShield } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { PageHeader } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, StatusChip, Tabs } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { APPROVALS } from "@/data/operations";
import { formatDateTime } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { ROLE_SHORT } from "@/lib/permissions";
import { SETTINGS } from "@/lib/settings";
import type { ApprovalRequest } from "@/lib/admin-types";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const KIND_LABEL: Record<ApprovalRequest["kind"], { label: string; hint: string }> = {
  fee_over_limit: {
    label: "Phí vượt hạn mức",
    hint: `Nhân viên chỉ tự quyết phí đến ${formatVnd(SETTINGS.staff_fee_limit)}`,
  },
  refund_over_limit: {
    label: "Hoàn cọc lớn",
    hint: `Khoản hoàn trên ${formatVnd(SETTINGS.refund_auto_limit)} cần quản lý duyệt`,
  },
  fee_waive: { label: "Đề xuất miễn phí", hint: "Người áp phí và người miễn phí phải khác nhau" },
  dispute: { label: "Khiếu nại của khách", hint: "Đối chiếu biên bản lúc giao và lúc nhận" },
};

type Tab = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
  const session = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [decisions, setDecisions] = useState<Record<string, { status: Tab; amount: number; note: string }>>({});
  const [acting, setActing] = useState<{ request: ApprovalRequest; mode: "approve" | "adjust" | "reject" } | null>(null);

  const statusOf = (r: ApprovalRequest): Tab => decisions[r.id]?.status ?? (r.status as Tab);

  const rows = useMemo(() => APPROVALS.filter((r) => statusOf(r) === tab), [tab, decisions]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session.canAny(["refund.approve", "fee.waive"])) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconShield width={22} height={22} />}
          title="Chỉ quản lý mới vào được hàng đợi duyệt"
          body="Đây là điểm kiểm soát nội bộ: người áp phí và người duyệt/miễn phí phải là hai người khác nhau."
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Hàng đợi duyệt"
        description="Yêu cầu vượt hạn mức của nhân viên. Duyệt, điều chỉnh hoặc từ chối — mọi quyết định đều ghi nhật ký kèm lý do."
        breadcrumb={[{ label: "Phê duyệt" }, { label: "Chờ duyệt" }]}
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "pending", label: "Chờ duyệt", count: APPROVALS.filter((r) => statusOf(r) === "pending").length },
            { key: "approved", label: "Đã duyệt", count: APPROVALS.filter((r) => statusOf(r) === "approved").length },
            { key: "rejected", label: "Từ chối", count: APPROVALS.filter((r) => statusOf(r) === "rejected").length },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<IconCheck width={22} height={22} />}
            title={tab === "pending" ? "Không có yêu cầu nào chờ bạn" : "Chưa có mục nào"}
            body={
              tab === "pending"
                ? "Khi nhân viên áp phí vượt hạn mức hoặc cần hoàn cọc lớn, yêu cầu sẽ xuất hiện ở đây."
                : "Các quyết định đã xử lý sẽ được lưu lại trong tab này."
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const decision = decisions[r.id];
            const amount = decision?.amount ?? r.staffAmount;
            const diff = r.suggestedAmount - amount;
            return (
              <li key={r.id} className="card overflow-hidden">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={r.kind === "dispute" ? "danger" : "warning"}>{KIND_LABEL[r.kind].label}</StatusChip>
                      <Link href={`/orders/${r.orderCode}`} className="num text-[12.5px] underline-offset-2 hover:underline">
                        {r.orderCode}
                      </Link>
                      <span className="text-[12.5px] text-ink-2">· {r.customerName}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink-3">
                      {r.requestedBy} ({ROLE_SHORT[r.requestedByRole]}) gửi lúc {formatDateTime(r.requestedAt)}
                    </p>
                  </div>
                  {statusOf(r) !== "pending" && (
                    <StatusChip tone={statusOf(r) === "approved" ? "success" : "danger"}>
                      {statusOf(r) === "approved" ? "Đã duyệt" : "Đã từ chối"}
                    </StatusChip>
                  )}
                </header>

                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_300px]">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="label-xs mb-1">Lý do nhân viên trình bày</p>
                      <p className="text-[13px] leading-relaxed">{r.reason}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {r.unitCode && <UnitCode code={r.unitCode} />}
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                        <IconCamera width={13} height={13} />
                        {r.evidenceCount > 0 ? `${r.evidenceCount} ảnh minh chứng` : "Chưa có ảnh minh chứng"}
                      </span>
                      {r.evidenceCount === 0 && r.kind !== "refund_over_limit" && (
                        <StatusChip tone="danger">Thiếu minh chứng</StatusChip>
                      )}
                    </div>

                    <Callout tone="info">{KIND_LABEL[r.kind].hint}</Callout>
                  </div>

                  <div className="card card-pad">
                    <KeyValue label="Hệ thống gợi ý">{formatVnd(r.suggestedAmount)}</KeyValue>
                    <KeyValue label="Nhân viên đề xuất">{formatVnd(r.staffAmount)}</KeyValue>
                    <KeyValue label="Chênh lệch">
                      <span className={cn(diff > 0 ? "text-warning" : diff < 0 ? "text-danger" : "text-ink-2")}>
                        {diff === 0 ? "Không đổi" : `${diff > 0 ? "giảm" : "tăng"} ${formatVnd(Math.abs(diff))}`}
                      </span>
                    </KeyValue>
                    {decision && (
                      <div className="mt-1 border-t border-line pt-1.5">
                        <KeyValue label="Mức đã duyệt">
                          <span className="font-medium">{formatVnd(decision.amount)}</span>
                        </KeyValue>
                      </div>
                    )}

                    {statusOf(r) === "pending" && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <button type="button" onClick={() => setActing({ request: r, mode: "approve" })} className="btn btn-sm btn-block">
                          Duyệt {formatVnd(r.staffAmount)}
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActing({ request: r, mode: "adjust" })}
                            className="btn btn-outline btn-sm flex-1"
                          >
                            Điều chỉnh
                          </button>
                          <button
                            type="button"
                            onClick={() => setActing({ request: r, mode: "reject" })}
                            className="btn btn-danger btn-sm flex-1"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    )}

                    {decision?.note && <p className="mt-2 text-[11.5px] text-ink-3">Ghi chú: {decision.note}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DecisionModal
        acting={acting}
        onClose={() => setActing(null)}
        onConfirm={(request, mode, amount, note) => {
          setDecisions((p) => ({
            ...p,
            [request.id]: { status: mode === "reject" ? "rejected" : "approved", amount, note },
          }));
          setActing(null);
          toast.push({
            tone: mode === "reject" ? "warning" : "success",
            title:
              mode === "reject"
                ? "Đã từ chối yêu cầu"
                : mode === "adjust"
                  ? `Đã duyệt mức điều chỉnh ${formatVnd(amount)}`
                  : "Đã duyệt yêu cầu",
            body: `${request.orderCode} · quyết định được ghi vào nhật ký cùng lý do.`,
          });
        }}
      />
    </>
  );
}

function DecisionModal({
  acting,
  onClose,
  onConfirm,
}: {
  acting: { request: ApprovalRequest; mode: "approve" | "adjust" | "reject" } | null;
  onClose: () => void;
  onConfirm: (r: ApprovalRequest, mode: "approve" | "adjust" | "reject", amount: number, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  if (!acting) return null;
  const { request, mode } = acting;
  const value = mode === "adjust" ? Number(amount.replace(/\D/g, "")) || 0 : request.staffAmount;
  const needsNote = mode !== "approve";

  return (
    <Modal
      open
      onClose={onClose}
      tone={mode === "reject" ? "danger" : undefined}
      title={mode === "approve" ? "Duyệt yêu cầu" : mode === "adjust" ? "Điều chỉnh mức phí" : "Từ chối yêu cầu"}
      description={`${request.orderCode} · ${request.customerName}`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button
            type="button"
            disabled={(needsNote && !note.trim()) || (mode === "adjust" && value <= 0)}
            onClick={() => onConfirm(request, mode, value, note)}
            className={cn("btn btn-sm", mode === "reject" && "btn-danger")}
          >
            {mode === "approve" ? "Xác nhận duyệt" : mode === "adjust" ? "Duyệt mức mới" : "Xác nhận từ chối"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="card card-pad">
          <KeyValue label="Hệ thống gợi ý">{formatVnd(request.suggestedAmount)}</KeyValue>
          <KeyValue label="Nhân viên đề xuất">{formatVnd(request.staffAmount)}</KeyValue>
        </div>

        {mode === "adjust" && (
          <div>
            <label className="field-label" htmlFor="adjust-amount">
              Mức phí sau điều chỉnh
            </label>
            <input
              id="adjust-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(request.staffAmount)}
              className="field num hide-spin"
            />
            <p className="field-hint">Mức mới sẽ áp cho đơn và hiển thị cho khách trong bảng quyết toán.</p>
          </div>
        )}

        {needsNote && (
          <div>
            <label className="field-label" htmlFor="decision-note">
              Lý do (bắt buộc)
            </label>
            <textarea
              id="decision-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field"
              placeholder={
                mode === "reject"
                  ? "Ví dụ: vết bẩn đã có trong biên bản lúc giao, không thu phí khách."
                  : "Ví dụ: giảm còn 800.000₫ vì thợ báo giá thực tế thấp hơn."
              }
            />
          </div>
        )}

        {mode === "approve" && request.evidenceCount === 0 && request.kind !== "refund_over_limit" && (
          <Callout tone="danger" icon={<IconAlert width={14} height={14} />}>
            Yêu cầu này chưa có ảnh minh chứng. Cân nhắc yêu cầu nhân viên bổ sung trước khi duyệt.
          </Callout>
        )}
      </div>
    </Modal>
  );
}
