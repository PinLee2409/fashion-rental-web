"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";
import { CUSTOMER } from "@/data/customer";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState(CUSTOMER.email);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Email hoặc mật khẩu chưa đúng. Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      toast.push({ tone: "success", title: `Chào mừng trở lại, ${CUSTOMER.name.split(" ").slice(-1)[0]}` });
      router.push("/tai-khoan");
    }, 700);
  }

  return (
    <AuthShell
      eyebrow="Tài khoản"
      title="Đăng nhập"
      intro="Theo dõi đơn thuê, hạn trả và tình trạng hoàn cọc ở một nơi."
      tone={["#6d4a44", "#efe6da"]}
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="link-line link-underline-in text-ink">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu bất kỳ để xem bản demo"
          />
        </div>

        {error && <p className="bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{error}</p>}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((v) => !v)}
              className="h-4 w-4 accent-[#181818]"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link href="/dang-nhap" className="link-line link-underline-in text-[12.5px] text-ink-2">
            Quên mật khẩu?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn btn-block">
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthShell>
  );
}
