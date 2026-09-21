"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconCheck, IconInfo, IconRuler } from "@/components/ui/Icons";
import { Accordion, Note, Reveal } from "@/components/ui/Primitives";
import { CUSTOMER } from "@/data/customer";
import { MEASURE_GUIDE, SIZE_CHARTS, suggestSize, type BodyInput, type SizeChartKey } from "@/lib/size";
import { cn } from "@/lib/utils";

const FAQ = [
  {
    q: "Số đo của tôi rơi vào giữa hai size thì chọn cái nào?",
    a: "Chọn size lớn hơn. Đồ rộng thì shop kẹp lai, bóp eo hoặc chỉnh nhẹ ngay khi bạn tới nhận; đồ chật thì không sửa được vì trang phục cho thuê không được cắt vải.",
  },
  {
    q: "Bảng size này dùng cho mọi sản phẩm?",
    a: "Đây là bảng tham khảo chung. Mỗi thiết kế có bảng size riêng ngay trong trang sản phẩm — form áo dài ôm hơn đầm dạ hội, nên luôn đối chiếu bảng của đúng món bạn định thuê.",
  },
  {
    q: "Tôi đo ở nhà có chính xác không?",
    a: "Đủ dùng nếu đo sát người, mặc đồ mỏng, thước song song sàn và không siết. Nếu vẫn phân vân, bạn có thể tới cửa hàng thử trước khi chốt đơn — việc thử đồ không tính phí.",
  },
  {
    q: "Thuê rồi mới thấy không vừa thì sao?",
    a: "Báo ngay khi nhận đồ tại cửa hàng để được đổi sang cá thể size khác nếu còn trống trong kỳ thuê của bạn. Chi tiết nằm trong trang chính sách thuê & hoàn cọc.",
  },
];

export function SizeGuideView() {
  const [chart, setChart] = useState<SizeChartKey>("women");
  const [body, setBody] = useState<BodyInput>({});

  const suggestion = useMemo(() => suggestSize(chart, body), [chart, body]);
  const rows = SIZE_CHARTS[chart].rows;

  /** Nạp số đo đã lưu trong hồ sơ để khách khỏi phải đo lại. */
  function useMyMeasurements() {
    const m = CUSTOMER.measurements;
    setBody({ bustCm: m.bustCm ?? undefined, waistCm: m.waistCm ?? undefined, hipCm: m.hipCm ?? undefined });
  }

  function update(key: keyof BodyInput, raw: string) {
    const value = Number(raw);
    setBody((prev) => ({ ...prev, [key]: raw === "" || Number.isNaN(value) ? undefined : value }));
  }

  return (
    <div className="pt-[76px]">
      {/* ------------------------------------------------------------ mở đầu -- */}
      <header className="shell border-b border-line py-14">
        <Reveal>
          <p className="eyebrow text-ink-3">Chọn size</p>
          <h1 className="display-2 mt-4 max-w-[18ch]">Bảng size & gợi ý size</h1>
          <p className="lede mt-5 max-w-[62ch]">
            Nhập hai trong ba vòng là đủ để nhận gợi ý. Chọn sai size là lý do trả đồ nhiều nhất, nên nếu bạn nằm giữa
            hai size, hệ thống luôn đề xuất size lớn hơn.
          </p>
        </Reveal>
      </header>

      {/* ------------------------------------------------------ gợi ý size -- */}
      <section className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
          {/* Ô nhập số đo */}
          <Reveal>
            <div className="flex items-center gap-2.5">
              <IconRuler width={18} height={18} className="text-ink-3" />
              <h2 className="display-4">Số đo của bạn</h2>
            </div>

            <div className="mt-6 flex gap-2">
              {(Object.keys(SIZE_CHARTS) as SizeChartKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChart(key)}
                  aria-pressed={chart === key}
                  className={cn(
                    "flex-1 border px-4 py-2.5 text-[12.5px] uppercase tracking-[0.12em] transition-colors",
                    chart === key ? "border-ink bg-ink text-canvas" : "border-line text-ink-2 hover:border-ink hover:text-ink",
                  )}
                >
                  {SIZE_CHARTS[key].label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[12.5px] text-ink-2">{SIZE_CHARTS[chart].note}</p>

            <div className="mt-8 space-y-6">
              {MEASURE_GUIDE.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="field-label">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id={field.key}
                      type="number"
                      inputMode="decimal"
                      min={40}
                      max={200}
                      value={body[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      placeholder="—"
                      className="field hide-number-spin max-w-[140px]"
                    />
                    <span className="text-[12.5px] text-ink-3">cm</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{field.how}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={useMyMeasurements} className="btn btn-quiet">
                Dùng số đo trong hồ sơ
              </button>
              {(body.bustCm || body.waistCm || body.hipCm) && (
                <button type="button" onClick={() => setBody({})} className="btn btn-quiet">
                  Xoá
                </button>
              )}
            </div>
          </Reveal>

          {/* Kết quả gợi ý */}
          <Reveal delay={100}>
            <h2 className="display-4">Gợi ý cho bạn</h2>

            {suggestion.provided < 2 ? (
              <div className="panel mt-6 px-6 py-12 text-center">
                <IconRuler width={26} height={26} className="mx-auto text-ink-3" />
                <p className="mt-5 text-[14px]">Nhập ít nhất hai vòng để xem gợi ý</p>
                <p className="lede mx-auto mt-2.5 max-w-[38ch] text-[13px]">
                  Vòng 1 và vòng 2 là đủ cho phần lớn thiết kế. Thêm vòng 3 nếu bạn thuê đầm ôm hoặc váy cưới.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {suggestion.best && (
                  <SuggestionCard
                    primary
                    title={`Size ${suggestion.best.size}`}
                    caption={
                      suggestion.best.gap === 0
                        ? "Cả ba số đo nằm trọn trong khoảng của size này."
                        : "Size sát số đo của bạn nhất."
                    }
                    notes={suggestion.best.notes}
                  />
                )}

                {suggestion.alternative && (
                  <SuggestionCard
                    title={`Hoặc size ${suggestion.alternative.size}`}
                    caption="Size trên liền kề — thoải mái hơn, shop chỉnh lại được khi bạn nhận đồ."
                    notes={suggestion.alternative.notes}
                  />
                )}

                {suggestion.alternative && (
                  <Note tone="warning" icon={<IconInfo width={15} height={15} />}>
                    Số đo của bạn vượt cận trên của size gợi ý ở ít nhất một vòng. Trang phục cho thuê không được cắt
                    vải nên chật là không sửa được — nên ưu tiên size lớn hơn.
                  </Note>
                )}

                <Note tone="info" icon={<IconInfo width={15} height={15} />}>
                  Đây là gợi ý theo bảng size chung. Mỗi thiết kế có bảng riêng trong trang sản phẩm — form áo dài ôm
                  hơn đầm dạ hội khoảng một size.
                </Note>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collections/tat-ca" className="btn">
                Xem bộ sưu tập
              </Link>
              <Link href="/account" className="btn btn-outline">
                Lưu số đo vào hồ sơ
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- bảng size -- */}
      <section className="shell border-t border-line py-14">
        <Reveal as="header" className="flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <p className="eyebrow text-ink-3">Tra cứu</p>
            <h2 className="display-3 mt-3">Bảng size {SIZE_CHARTS[chart].label.toLowerCase()}</h2>
          </div>
          <div className="flex gap-2">
            {(Object.keys(SIZE_CHARTS) as SizeChartKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setChart(key)}
                aria-pressed={chart === key}
                className={cn(
                  "border px-4 py-2 text-[12px] uppercase tracking-[0.12em] transition-colors",
                  chart === key ? "border-ink bg-ink text-canvas" : "border-line text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {SIZE_CHARTS[key].label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Bảng cuộn ngang trên mobile — thanh cuộn để hiện, khách biết còn cột. */}
        <Reveal delay={100} className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-3 pr-4 font-medium">Size</th>
                <th className="py-3 pr-4 font-medium">Vòng 1 (cm)</th>
                <th className="py-3 pr-4 font-medium">Vòng 2 (cm)</th>
                <th className="py-3 pr-4 font-medium">Vòng 3 (cm)</th>
                <th className="py-3 font-medium">Dài áo (cm)</th>
              </tr>
            </thead>
            <tbody className="text-ink-2">
              {rows.map((row) => {
                const highlight = suggestion.best?.size === row.size;
                return (
                  <tr
                    key={row.size}
                    className={cn("border-b border-line transition-colors", highlight && "bg-accent-soft")}
                  >
                    <td className={cn("py-3 pr-4", highlight ? "text-ink" : "text-ink")}>
                      <span className="flex items-center gap-1.5">
                        {row.size}
                        {highlight && <IconCheck width={13} height={13} className="text-accent" />}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{row.bust}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.waist}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.hip}</td>
                    <td className="py-3 tabular-nums">{row.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Reveal>

        <p className="mt-5 text-[12.5px] text-ink-2">
          Số đo trong bảng là số đo cơ thể, không phải số đo trang phục. Trang phục đã cộng sẵn độ rộng cử động.
        </p>
      </section>

      {/* -------------------------------------------------------------- FAQ -- */}
      <section className="shell border-t border-line py-14">
        <div className="grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-ink-3">Hỏi nhanh</p>
            <h2 className="display-3 mt-3">Về size & form dáng</h2>
            <p className="lede mt-4 text-[13.5px]">
              Còn phân vân? Xem thêm{" "}
              <Link href="/policies" className="link-line link-underline-in">
                chính sách thuê & hoàn cọc
              </Link>{" "}
              hoặc{" "}
              <Link href="/how-it-works" className="link-line link-underline-in">
                cách thuê đồ
              </Link>
              .
            </p>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={FAQ.map((f) => ({ title: f.q, content: f.a }))} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function SuggestionCard({
  title,
  caption,
  notes,
  primary,
}: {
  title: string;
  caption: string;
  notes: string[];
  primary?: boolean;
}) {
  return (
    <div className={cn("panel px-5 py-5", primary && "border-ink")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={cn("font-display", primary ? "text-[26px]" : "text-[20px] text-ink-2")}>{title}</p>
        {primary && <span className="eyebrow text-accent">Gợi ý chính</span>}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{caption}</p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {notes.map((n) => (
          <li
            key={n}
            className={cn(
              "text-[12px]",
              n.includes("chật") ? "text-danger" : n.includes("rộng") ? "text-warning" : "text-success",
            )}
          >
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
