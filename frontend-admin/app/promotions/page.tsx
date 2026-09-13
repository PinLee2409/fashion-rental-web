"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { IconPlus, IconSparkle } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Overlay";
import { PageHeader, Toolbar } from "@/components/ui/PageParts";
import { Callout, EmptyState, KeyValue, MoreMenu, StatusChip, Switch } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { PROMOTIONS } from "@/data/promotions";
import { CATEGORIES } from "@/data/catalog";
import { useMounted } from "@/hooks";
import { diffDays, formatDate, todayISO } from "@/lib/date";
import { formatVnd } from "@/lib/money";
import type { Promotion } from "@/lib/types";
import { deaccent } from "@/lib/utils";
import { useSession } from "@/store/session";

interface PromoRow extends Promotion {
  used: number;
  limit: number;
  perUser: number;
  active: boolean;
  scope: string;
}

const ROWS: PromoRow[] = PROMOTIONS.map((p, i) => ({
  ...p,
  used: [42, 17, 8, 3][i] ?? 0,
  limit: [200, 100, 300, 50][i] ?? 100,
  perUser: [1, 1, 2, 1][i] ?? 1,
  active: true,
  scope: ["Toàn shop", "Toàn shop", "Toàn shop", "Danh mục váy cưới"][i] ?? "Toàn shop",
}));

export default function PromotionsPage() {
  const session = useSession();
  const toast = useToast();
  const mounted = useMounted();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [states, setStates] = useState<Record<string, boolean>>({});

  const activeOf = (p: PromoRow) => states[p.code] ?? p.active;

  const rows = useMemo(() => {
    const q = deaccent(search.trim());
    return ROWS.filter((p) => !q || deaccent(`${p.code} ${p.description}`).includes(q));
  }, [search]);

  if (!session.can("promotion.manage")) {
    return (
      <div className="card">
        <EmptyState
          icon={<IconSparkle width={22} height={22} />}
          title="Bạn không có quyền quản lý khuyến mãi"
          body="Tạo và sửa mã giảm giá là quyền của Quản lý và Admin."
        />
      </div>
    );
  }

  const columns: Column<PromoRow>[] = [
    {
      key: "code",
      header: "Mã",
      width: "140px",
      sortValue: (p) => p.code,
      render: (p) => (
        <span className="num rounded border border-dashed border-ink-3 px-1.5 py-0.5 text-[12px]">{p.code}</span>
      ),
    },
    {
      key: "type",
      header: "Loại",
      width: "120px",
      render: (p) => (
        <StatusChip tone={p.type === "freeship" ? "info" : "accent"} dot={false}>
          {p.type === "percent" ? "Giảm %" : p.type === "fixed" ? "Giảm tiền" : "Miễn phí ship"}
        </StatusChip>
      ),
    },
    {
      key: "value",
      header: "Giá trị",
      width: "150px",
      render: (p) => (
        <span className="num text-[12.5px]">
          {p.type === "percent" ? `${p.value}%` : p.type === "fixed" ? formatVnd(p.value) : "—"}
          {p.maxDiscount ? <span className="text-ink-3"> · tối đa {formatVnd(p.maxDiscount)}</span> : null}
        </span>
      ),
    },
    {
      key: "min",
      header: "Đơn tối thiểu",
      align: "right",
      width: "128px",
      hideBelow: "lg",
      sortValue: (p) => p.minOrder,
      render: (p) => <span className="num text-[12.5px] text-ink-2">{formatVnd(p.minOrder)}</span>,
    },
    {
      key: "scope",
      header: "Phạm vi",
      width: "150px",
      hideBelow: "xl",
      render: (p) => <span className="text-[12px] text-ink-2">{p.scope}</span>,
    },
    {
      key: "usage",
      header: "Đã dùng",
      align: "right",
      width: "110px",
      sortValue: (p) => p.used / p.limit,
      render: (p) => (
        <span className="num text-[12.5px]">
          {p.used}
          <span className="text-ink-3">/{p.limit}</span>
        </span>
      ),
    },
    {
      key: "period",
      header: "Hiệu lực đến",
      width: "130px",
      sortValue: (p) => p.endsAt,
      render: (p) => {
        const left = mounted ? diffDays(today, p.endsAt) : 0;
        return (
          <span className="num text-[12px] text-ink-2">
            {formatDate(p.endsAt)}
            {mounted && left <= 7 && left >= 0 && <span className="ml-1 text-warning">còn {left}n</span>}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "150px",
      render: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={activeOf(p)}
            label={`Bật/tắt ${p.code}`}
            onChange={(next) => {
              setStates((s) => ({ ...s, [p.code]: next }));
              toast.push({ tone: next ? "success" : "warning", title: next ? `Đã bật ${p.code}` : `Đã tắt ${p.code}` });
            }}
          />
          <span className={activeOf(p) ? "text-[11.5px] text-ink-2" : "text-[11.5px] text-ink-3"}>
            {activeOf(p) ? "Đang chạy" : "Tắt"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "96px",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setEditing(p)} className="btn btn-outline btn-sm">
            Sửa
          </button>
          <MoreMenu
            items={[
              { label: "Xem đơn đã dùng mã", onSelect: () => toast.push({ tone: "info", title: `${p.used} đơn dùng ${p.code}` }) },
              { label: "Nhân bản", onSelect: () => toast.push({ tone: "info", title: "Đã tạo bản sao nháp" }) },
              { label: "Kết thúc sớm", danger: true, onSelect: () => toast.push({ tone: "warning", title: `Đã kết thúc ${p.code}` }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Khuyến mãi"
        description="Mã giảm giá chỉ áp lên tiền thuê, không áp lên tiền cọc. Không cộng dồn nhiều mã, trừ trường hợp một mã freeship đi kèm một mã giảm giá."
        breadcrumb={[{ label: "Catalog" }, { label: "Khuyến mãi" }]}
        actions={
          <button type="button" onClick={() => setCreating(true)} className="btn btn-sm gap-1.5">
            <IconPlus width={14} height={14} />
            Tạo mã mới
          </button>
        }
      />

      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="Tìm mã khuyến mãi..." resultLabel={`${rows.length} mã`} />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(p) => p.code}
        onRowClick={(p) => setEditing(p)}
        empty={<EmptyState icon={<IconSparkle width={22} height={22} />} title="Chưa có mã nào" body="Tạo mã đầu tiên để chạy ưu đãi." />}
        cardRender={(p) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="num text-[12.5px]">{p.code}</p>
              <p className="truncate text-[11.5px] text-ink-3">{p.description}</p>
            </div>
            <StatusChip tone={activeOf(p) ? "success" : "neutral"}>{activeOf(p) ? "Đang chạy" : "Tắt"}</StatusChip>
          </div>
        )}
      />

      <PromotionForm
        key={editing ? editing.code : creating ? "new" : "closed"}
        open={creating || Boolean(editing)}
        promo={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(code) => {
          setCreating(false);
          setEditing(null);
          toast.push({ tone: "success", title: editing ? `Đã lưu mã ${code}` : `Đã tạo mã ${code}` });
        }}
      />
    </>
  );
}

function PromotionForm({
  open,
  promo,
  onClose,
  onSave,
}: {
  open: boolean;
  promo: PromoRow | null;
  onClose: () => void;
  onSave: (code: string) => void;
}) {
  const [code, setCode] = useState(promo?.code ?? "");
  const [type, setType] = useState<Promotion["type"]>(promo?.type ?? "percent");
  const [value, setValue] = useState(String(promo?.value ?? 10));
  const [maxDiscount, setMaxDiscount] = useState(String(promo?.maxDiscount ?? 300000));
  const [minOrder, setMinOrder] = useState(String(promo?.minOrder ?? 800000));

  const numValue = Number(value.replace(/\D/g, "")) || 0;
  const numMax = Number(maxDiscount.replace(/\D/g, "")) || 0;
  const numMin = Number(minOrder.replace(/\D/g, "")) || 0;

  if (!open) return null;

  const sample = 2_000_000;
  const discount =
    type === "percent" ? Math.min(numMax || Infinity, (sample * numValue) / 100) : type === "fixed" ? numValue : 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={promo ? `Sửa mã ${promo.code}` : "Tạo mã khuyến mãi"}
      description="Điều kiện áp dụng sẽ được kiểm tra lại ở bước thanh toán của khách."
      width="max-w-[620px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Huỷ
          </button>
          <button type="button" disabled={!code.trim()} onClick={() => onSave(code.toUpperCase())} className="btn btn-sm">
            {promo ? "Lưu thay đổi" : "Tạo mã"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="promo-code">
              Mã khuyến mãi
            </label>
            <input
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SEN10"
              className="field num"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="promo-type">
              Loại
            </label>
            <select
              id="promo-type"
              value={type}
              onChange={(e) => setType(e.target.value as Promotion["type"])}
              className="field"
            >
              <option value="percent">Giảm theo %</option>
              <option value="fixed">Giảm số tiền cố định</option>
              <option value="freeship">Miễn phí giao nhận</option>
            </select>
          </div>

          {type !== "freeship" && (
            <>
              <div>
                <label className="field-label" htmlFor="promo-value">
                  {type === "percent" ? "Phần trăm giảm" : "Số tiền giảm"}
                </label>
                <input id="promo-value" value={value} onChange={(e) => setValue(e.target.value)} className="field num hide-spin" />
              </div>
              {type === "percent" && (
                <div>
                  <label className="field-label" htmlFor="promo-max">
                    Giảm tối đa
                  </label>
                  <input
                    id="promo-max"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="field num hide-spin"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="field-label" htmlFor="promo-min">
              Đơn thuê tối thiểu
            </label>
            <input id="promo-min" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="field num hide-spin" />
          </div>
          <div>
            <label className="field-label" htmlFor="promo-scope">
              Phạm vi áp dụng
            </label>
            <select id="promo-scope" className="field" defaultValue="all">
              <option value="all">Toàn shop</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  Danh mục: {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="promo-limit">
              Giới hạn tổng lượt
            </label>
            <input id="promo-limit" defaultValue={promo?.limit ?? 100} className="field num hide-spin" />
          </div>
          <div>
            <label className="field-label" htmlFor="promo-peruser">
              Giới hạn lượt / khách
            </label>
            <input id="promo-peruser" defaultValue={promo?.perUser ?? 1} className="field num hide-spin" />
          </div>
        </div>

        <div className="card card-pad bg-surface-2">
          <p className="label-xs mb-2">Xem trước quy tắc</p>
          <KeyValue label="Đơn thuê mẫu">{formatVnd(sample)}</KeyValue>
          <KeyValue label="Điều kiện">{numMin > 0 ? `Tiền thuê từ ${formatVnd(numMin)}` : "Không giới hạn"}</KeyValue>
          <KeyValue label="Khách được giảm">
            <span className="text-success">
              {type === "freeship" ? "Miễn phí giao nhận 2 chiều" : formatVnd(Math.min(discount, sample))}
            </span>
          </KeyValue>
        </div>

        <Callout tone="info">
          Giảm giá chỉ trừ vào tiền thuê. Tiền cọc giữ nguyên vì đây là khoản hoàn lại cho khách, không phải doanh thu.
        </Callout>
      </div>
    </Modal>
  );
}
