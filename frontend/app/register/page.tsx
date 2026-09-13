"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Vui lòng nhập họ và tên.");
    if (!form.email.includes("@")) return setError("Email chưa hợp lệ.");
    if (form.phone.replace(/\D/g, "").length < 9) return setError("Số điện thoại chưa hợp lệ.");
    if (form.password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự.");
    if (!agreed) return setError("Vui lòng đồng ý với điều khoản thuê đồ.");

    setError(null);
    setLoading(true);
    setTimeout(() => {
      toast.push({
        tone: "success",
        title: "Tạo tài khoản thành công",
        body: "Bổ sung số đo trong hồ sơ để shop chọn đồ vừa người hơn.",
      });
      router.push("/account");
    }, 700);
  }

  return (
    <AuthShell
      eyebrow="Bắt đầu"
      title="Tạo tài khoản"
      intro="Chỉ cần vài thông tin cơ bản. Số đo và địa chỉ có thể bổ sung sau trong hồ sơ."
      tone={["#7c2230", "#f2e7dd"]}
      motif="drape"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="link-line link-underline-in text-ink">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="name">
            Họ và tên
          </label>
          <input
            id="name"
            className="field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="password">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            className="field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <p className="mt-2 text-[11.5px] text-ink-3">Tối thiểu 6 ký tự.</p>
        </div>

        {error && <p className="bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{error}</p>}

        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed">
          <input
            type="checkbox"
            checked={agreed}
            onChange={() => setAgreed((v) => !v)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#181818]"
          />
          <span>
            Tôi đồng ý với{" "}
            <Link href="/policies" className="link-line link-underline-in">
              điều khoản thuê đồ
            </Link>{" "}
            và chính sách hoàn cọc của StyleRent.
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn btn-block">
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>
      </form>
    </AuthShell>
  );
}
