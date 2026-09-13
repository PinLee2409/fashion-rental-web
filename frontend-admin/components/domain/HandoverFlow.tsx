"use client";

import { useMemo, useState } from "react";
import { UnitCode } from "@/components/domain/Chips";
import { ProductMedia } from "@/components/domain/ProductMedia";
import { ScanDialog } from "@/components/domain/QrScanner";
import { IconAlert, IconCamera, IconCheck, IconScan, IconStore, IconTruck } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { Callout, KeyValue, StatusChip } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { customerOfOrder } from "@/data/operations";
import { formatDate } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import { STORE } from "@/lib/settings";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const STEPS = [
  "Xác minh khách",
  "Quét cá thể",
  "Đối chiếu",
  "Tình trạng",
  "Thanh toán",
  "Khách xác nhận",
  "Hoàn tất",
];

/**
 * Bàn giao đồ (UC-11) — quét QR từng cá thể, đối chiếu với đơn, chụp biên bản
 * lúc giao rồi mới chuyển đơn sang `in_use`.
 */
export function HandoverFlow({
  open,
  onClose,
  order,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
  onComplete: () => void;
}) {
  const toast = useToast();
  const session = useSession();
  const customer = customerOfOrder(order.code);

  const [step, setStep] = useState(0);
  const [idChecked, setIdChecked] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState<string[]>([]);
  const [conditionOk, setConditionOk] = useState(false);
  const [photos, setPhotos] = useState(0);
  const [paymentTaken, setPaymentTaken] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const expected = useMemo(() => order.items.flatMap((i) => i.unitCodes ?? []), [order]);
  const missing = expected.filter((code) => !scanned.includes(code));
  const unexpected = scanned.filter((code) => !expected.includes(code));
  const due = Math.max(0, order.grandTotal - order.paidAmount);

  function addScan(raw: string) {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    if (scanned.includes(code)) {
      toast.push({ tone: "warning", title: "Mã đã quét rồi", body: code });
      setScanInput("");
      return;
    }
    setScanned((p) => [...p, code]);
    setScanInput("");
    if (expected.includes(code)) {
      toast.push({ tone: "success", title: "Khớp cá thể trong đơn", body: code });
    } else {
      toast.push({
        tone: "danger",
        title: "Cá thể không thuộc đơn này",
        body: `${code} — kiểm tra lại tem QR trước khi giao.`,
      });
    }
  }

  const canNext = [
    idChecked,
    scanned.length > 0,
    missing.length === 0 && unexpected.length === 0,
    conditionOk && photos > 0,
    due === 0 || paymentTaken,
    acknowledged,
    true,
  ][step];

  function finish() {
    onComplete();
    toast.push({
      tone: "success",
      title: "Đã bàn giao đồ",
      body: `${order.code} chuyển sang Đang thuê · ${expected.length} cá thể đã giao.`,
    });
    onClose();
  }

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={`Bàn giao đồ · ${order.code}`}
      description={`${order.receiverName} · ${order.pickupMethod === "at_store" ? "Nhận tại cửa hàng" : "Giao tận nơi"}`}
      width="max-w-[760px]"
      footer={
        <>
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="btn btn-outline btn-sm"
          >
            {step === 0 ? "Huỷ" : "Quay lại"}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="btn btn-sm">
              Tiếp tục
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn btn-sm">
              Hoàn tất bàn giao
            </button>
          )}
        </>
      }
    >
      {/* Chỉ dẫn bước */}
      <ol className="mb-5 flex flex-wrap gap-x-1 gap-y-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "num grid h-5 w-5 place-items-center rounded-full text-[10.5px]",
                i < step ? "bg-ink text-white" : i === step ? "border border-ink" : "border border-line text-ink-3",
              )}
            >
              {i < step ? <IconCheck width={11} height={11} /> : i + 1}
            </span>
            <span className={cn("text-[11.5px]", i === step ? "text-ink" : "text-ink-3")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-3 bg-line" />}
          </li>
        ))}
      </ol>

      {/* Bước 1 — xác minh khách */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">{order.receiverName}</p>
                <p className="num text-[12.5px] text-ink-2">{order.receiverPhone}</p>
                {order.address && <p className="mt-1 text-[12px] text-ink-2">{order.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-[12px] text-ink-2">Đã thuê {customer?.totalRentals ?? 0} lần</p>
                {customer && customer.lateReturns > 0 && (
                  <StatusChip tone="warning" className="mt-1">
                    {customer.lateReturns} lần trả trễ
                  </StatusChip>
                )}
                {customer && customer.damageIncidents > 0 && (
                  <StatusChip tone="danger" className="mt-1">
                    {customer.damageIncidents} lần hư hỏng
                  </StatusChip>
                )}
              </div>
            </div>
          </div>

          <Callout tone="info">
            Kỳ thuê {formatDate(order.pickupDate)} → {formatDate(order.returnDate)} · hẹn trả lúc{" "}
            {STORE.return_due_hour}:00. Nhắc khách mốc trả và quy định phí trễ trước khi ký nhận.
          </Callout>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line p-3 text-[12.5px]">
            <input
              type="checkbox"
              checked={idChecked}
              onChange={() => setIdChecked((v) => !v)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
            />
            <span>
              Đã đối chiếu giấy tờ thế chân với người nhận
              <span className="mt-0.5 block text-[11.5px] text-ink-3">
                Hệ thống chỉ lưu ghi chú đối chiếu, không lưu số giấy tờ của khách.
              </span>
            </span>
          </label>
        </div>
      )}

      {/* Bước 2 — quét cá thể */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-dashed border-line bg-surface-2 px-4 py-6 text-center">
            <IconScan width={26} height={26} className="mx-auto text-ink-3" />
            <p className="mt-2 text-[13px]">Quét mã QR trên tem cá thể</p>
            <p className="mt-0.5 text-[11.5px] text-ink-3">
              Đầu đọc barcode gõ thẳng vào ô bên dưới. Trên điện thoại hoặc tablet thì bật camera để quét.
            </p>
            <button type="button" onClick={() => setCameraOpen(true)} className="btn btn-outline btn-sm mt-3 gap-1.5">
              <IconCamera width={14} height={14} />
              Bật camera quét mã
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addScan(scanInput);
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Nhập hoặc quét mã cá thể, ví dụ AD-M-DO-003"
              className="field num"
              aria-label="Mã cá thể"
            />
            <button type="submit" className="btn btn-sm shrink-0">
              Thêm
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11.5px] text-ink-3">Mã mong đợi:</span>
            {expected.map((code) => (
              <button key={code} type="button" onClick={() => addScan(code)} className="text-left">
                <UnitCode code={code} muted={!scanned.includes(code)} />
              </button>
            ))}
          </div>

          <ul className="space-y-1.5">
            {scanned.map((code) => {
              const ok = expected.includes(code);
              return (
                <li
                  key={code}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                    ok ? "border-line" : "border-danger/40 bg-danger-soft",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {ok ? (
                      <IconCheck width={14} height={14} className="text-success" />
                    ) : (
                      <IconAlert width={14} height={14} className="text-danger" />
                    )}
                    <UnitCode code={code} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setScanned((p) => p.filter((c) => c !== code))}
                    className="text-[11.5px] text-ink-3 hover:text-danger"
                  >
                    Bỏ
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bước 3 — đối chiếu */}
      {step === 2 && (
        <div className="space-y-3">
          {missing.length === 0 && unexpected.length === 0 ? (
            <Callout tone="success" icon={<IconCheck width={14} height={14} />} title="Khớp toàn bộ cá thể">
              {expected.length} cá thể đã quét đúng với danh sách trong đơn.
            </Callout>
          ) : (
            <Callout tone="danger" icon={<IconAlert width={14} height={14} />} title="Chưa khớp — không được bàn giao">
              Kiểm tra lại tem QR trên từng món trước khi tiếp tục.
            </Callout>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card p-3">
              <p className="label-xs mb-2">Mong đợi theo đơn</p>
              <ul className="space-y-1.5">
                {expected.map((code) => (
                  <li key={code} className="flex items-center justify-between gap-2">
                    <UnitCode code={code} />
                    {scanned.includes(code) ? (
                      <span className="text-[11.5px] text-success">đã quét</span>
                    ) : (
                      <span className="text-[11.5px] text-danger">thiếu</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-3">
              <p className="label-xs mb-2">Thực tế đã quét</p>
              {scanned.length === 0 ? (
                <p className="text-[12px] text-ink-3">Chưa quét mã nào.</p>
              ) : (
                <ul className="space-y-1.5">
                  {scanned.map((code) => (
                    <li key={code} className="flex items-center justify-between gap-2">
                      <UnitCode code={code} muted={!expected.includes(code)} />
                      {expected.includes(code) ? (
                        <span className="text-[11.5px] text-success">khớp</span>
                      ) : (
                        <span className="text-[11.5px] text-danger">không thuộc đơn</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bước 4 — tình trạng lúc giao */}
      {step === 3 && (
        <div className="space-y-3">
          <Callout tone="info">
            Ảnh chụp lúc giao là căn cứ đối chiếu khi khách trả đồ. Có biên bản lúc giao thì tranh chấp “vết này có sẵn
            hay không” xử lý được ngay.
          </Callout>

          <div className="card divide-y divide-line">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <ProductMedia image={item.image} ratio="1/1" className="h-10 w-10 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{item.productNameSnapshot}</p>
                  <p className="text-[11.5px] text-ink-2">
                    {item.variantSnapshot.size} · {item.variantSnapshot.color}
                  </p>
                </div>
                {item.unitCodes?.map((c) => <UnitCode key={c} code={c} />)}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPhotos((p) => p + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-5 text-[12.5px] text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            <IconCamera width={16} height={16} />
            Chụp / tải ảnh tình trạng ({photos} ảnh)
          </button>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line p-3 text-[12.5px]">
            <input
              type="checkbox"
              checked={conditionOk}
              onChange={() => setConditionOk((v) => !v)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
            />
            <span>
              Đã cùng khách kiểm tra tình trạng từng món
              <span className="mt-0.5 block text-[11.5px] text-ink-3">Cần ít nhất 1 ảnh minh chứng để tiếp tục.</span>
            </span>
          </label>
        </div>
      )}

      {/* Bước 5 — thanh toán */}
      {step === 4 && (
        <div className="space-y-3">
          <div className="card card-pad">
            <KeyValue label="Giá trị đơn">{formatVnd(order.grandTotal)}</KeyValue>
            <KeyValue label="Đã thu">{formatVnd(order.paidAmount)}</KeyValue>
            <KeyValue label="Trong đó tiền cọc đang giữ">{formatVnd(order.totalDeposit)}</KeyValue>
            <div className="mt-1 border-t border-line pt-1.5">
              <KeyValue label="Cần thu khi nhận đồ">
                <span className={due > 0 ? "text-warning" : "text-success"}>{formatVnd(due)}</span>
              </KeyValue>
            </div>
          </div>

          {due === 0 ? (
            <Callout tone="success" icon={<IconCheck width={14} height={14} />}>
              Đơn đã thu đủ, không cần thu thêm tại quầy.
            </Callout>
          ) : session.can("payment.record") ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line p-3 text-[12.5px]">
              <input
                type="checkbox"
                checked={paymentTaken}
                onChange={() => setPaymentTaken((v) => !v)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
              />
              <span>
                Đã thu {formatVnd(due)} bằng tiền mặt / chuyển khoản
                <span className="mt-0.5 block text-[11.5px] text-ink-3">
                  Hệ thống sẽ ghi một phiếu thu gắn với đơn này.
                </span>
              </span>
            </label>
          ) : (
            <Callout tone="warning" icon={<IconAlert width={14} height={14} />}>
              Bạn không có quyền ghi nhận thu tiền. Nhờ nhân viên bán hàng hoặc quản lý thu {formatVnd(due)} trước khi
              bàn giao.
            </Callout>
          )}
        </div>
      )}

      {/* Bước 6 — khách xác nhận */}
      {step === 5 && (
        <div className="space-y-3">
          <div className="card card-pad space-y-1.5 text-[12.5px] text-ink-2">
            <p className="text-[13px] text-ink">Khách xác nhận đã nhận đủ và đúng tình trạng</p>
            <p>· Nhận {expected.length} cá thể, đã kiểm tra cùng nhân viên</p>
            <p>
              · Hạn trả {formatDate(order.returnDate)} lúc {STORE.return_due_hour}:00, ân hạn 3 giờ
            </p>
            <p>· Trả trễ tính 1.5× tiền thuê ngày cho mỗi ngày trễ, tối đa 2× tiền cọc</p>
            <p>· Tiền cọc {formatVnd(order.totalDeposit)} được hoàn sau khi kiểm tra đồ khi trả</p>
          </div>

          <div className="rounded-lg border border-dashed border-line bg-surface-2 px-4 py-8 text-center text-[12px] text-ink-3">
            Khu vực ký xác nhận của khách (ký trên màn hình hoặc ký phiếu in)
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line p-3 text-[12.5px]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={() => setAcknowledged((v) => !v)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#181818]"
            />
            <span>Khách đã xác nhận nhận đủ đồ và nắm được quy định trả</span>
          </label>
        </div>
      )}

      {/* Bước 7 — hoàn tất */}
      {step === 6 && (
        <div className="space-y-3">
          <Callout tone="success" icon={<IconCheck width={14} height={14} />} title="Sẵn sàng hoàn tất">
            Bấm “Hoàn tất bàn giao” để chuyển đơn sang trạng thái Đang thuê và bắt đầu đếm hạn trả.
          </Callout>
          <div className="card card-pad space-y-2">
            <KeyValue label="Đơn">{order.code}</KeyValue>
            <KeyValue label="Cá thể bàn giao">{expected.length}</KeyValue>
            <KeyValue label="Ảnh biên bản lúc giao">{photos}</KeyValue>
            <KeyValue label="Hình thức">
              <span className="inline-flex items-center gap-1.5">
                {order.pickupMethod === "at_store" ? <IconStore width={13} height={13} /> : <IconTruck width={13} height={13} />}
                {order.pickupMethod === "at_store" ? "Nhận tại shop" : "Giao tận nơi"}
              </span>
            </KeyValue>
            <KeyValue label="Người thực hiện">{session.user.name}</KeyValue>
          </div>
        </div>
      )}
    </Modal>

    <ScanDialog
      open={cameraOpen}
      onClose={() => setCameraOpen(false)}
      onDetect={(code) => addScan(code)}
      continuous
      title="Quét cá thể bàn giao"
      hint="Quét từng món trước khi giao cho khách. Mã không thuộc đơn này sẽ bị cảnh báo ngay."
    />
    </>
  );
}
