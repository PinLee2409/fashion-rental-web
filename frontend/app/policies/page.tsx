import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Primitives";
import { POLICY_SECTIONS } from "@/data/content";
import { formatVnd } from "@/lib/money";
import { CANCELLATION_POLICY, CONDITION_FEES, SETTINGS, STORE } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Chính sách thuê & hoàn cọc",
  description:
    "Chính sách đặt thuê, thanh toán, tiền cọc, huỷ đơn, phí phát sinh và gia hạn của StyleRent.",
};

export default function PolicyPage() {
  return (
    <div className="pt-[76px]">
      <header className="shell border-b border-line py-16 md:py-20">
        <Reveal className="max-w-[760px]">
          <p className="eyebrow text-ink-3">Điều khoản</p>
          <h1 className="display-1 mt-5">Chính sách thuê & hoàn cọc</h1>
          <p className="lede mt-6 max-w-[62ch]">
            Toàn bộ quy tắc áp dụng cho mọi đơn thuê tại StyleRent. Những con số dưới đây cũng chính là quy tắc hệ
            thống dùng để tính tiền — không có khoản nào phát sinh ngoài bảng này.
          </p>
        </Reveal>
      </header>

      <div className="shell grid gap-12 py-14 lg:grid-cols-[240px_1fr] lg:gap-16">
        {/* Mục lục */}
        <nav className="lg:sticky lg:top-[100px] lg:self-start">
          <p className="eyebrow text-ink-3">Nội dung</p>
          <ul className="mt-4 space-y-2.5">
            {POLICY_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link href={`#${section.id}`} className="link-line link-underline-in text-[13.5px] text-ink-2">
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          {POLICY_SECTIONS.map((section, i) => (
            <Reveal as="section" key={section.id} delay={i * 50} className="scroll-mt-[120px]">
              <div id={section.id} className="scroll-mt-[120px]">
                <h2 className="display-3">{section.title}</h2>
                <ul className="mt-5 space-y-3 border-t border-line pt-5">
                  {section.items.map((item, k) => (
                    <li key={k} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          {/* Bảng huỷ đơn */}
          <Reveal as="section">
            <h2 className="display-3">Bảng hoàn tiền khi huỷ</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-y border-ink text-left">
                    <th className="py-3 pr-4 font-medium">Thời điểm huỷ</th>
                    <th className="py-3 pr-4 font-medium">Hoàn tiền thuê đã trả</th>
                    <th className="py-3 font-medium">Hoàn tiền cọc</th>
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  {CANCELLATION_POLICY.map((tier) => (
                    <tr key={tier.label} className="border-b border-line">
                      <td className="py-3 pr-4 text-ink">{tier.label}</td>
                      <td className="py-3 pr-4">{Math.round(tier.rentalRefundRate * 100)}%</td>
                      <td className="py-3">{Math.round(tier.depositRefundRate * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12.5px] text-ink-3">
              Khoản hoàn trên {formatVnd(SETTINGS.refund_auto_limit)} cần quản lý duyệt trước khi chuyển tiền. Nếu shop
              là bên huỷ đơn, bạn được hoàn 100% mọi khoản kèm voucher xin lỗi.
            </p>
          </Reveal>

          {/* Bảng phí tình trạng */}
          <Reveal as="section">
            <h2 className="display-3">Phí theo tình trạng khi trả</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-y border-ink text-left">
                    <th className="py-3 pr-4 font-medium">Tình trạng</th>
                    <th className="py-3 pr-4 font-medium">Phí</th>
                    <th className="py-3 font-medium">Xử lý tiếp theo</th>
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  {CONDITION_FEES.map((row) => (
                    <tr key={row.condition} className="border-b border-line">
                      <td className="py-3 pr-4 text-ink">{row.condition}</td>
                      <td className="py-3 pr-4">{row.fee}</td>
                      <td className="py-3">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12.5px] text-ink-3">
              Mọi khoản phí khác 0đ đều phải có ảnh minh chứng trong biên bản kiểm tra. Bạn có quyền khiếu nại nếu
              không đồng ý với biên bản — đơn sẽ chuyển sang trạng thái “Đang khiếu nại” để quản lý xử lý.
            </p>
          </Reveal>

          <Reveal as="section" className="border-t border-line pt-10">
            <h2 className="display-4">Liên hệ</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
              {STORE.address}
              <br />
              {STORE.phone} · {STORE.email}
              <br />
              {STORE.hours}
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
