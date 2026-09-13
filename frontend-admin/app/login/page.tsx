"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { IconAlert, IconArrowRight, IconCheck, IconEye, IconEyeOff, IconLock, IconMail } from "@/components/ui/Icons";
import { Callout } from "@/components/ui/Primitives";
import { authenticate, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth";
import { ROLE_LABEL, ROLE_SCOPE, ROLE_SHORT } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";

const YEAR = new Date().getFullYear();

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<{ field?: "email" | "password"; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const next = params.get("next") ?? "/";

  // Đã có phiên thì vào thẳng, không bắt đăng nhập lại.
  useEffect(() => {
    if (session.hydrated && session.signedIn) router.replace(next);
  }, [session.hydrated, session.signedIn, next, router]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const result = authenticate(email, password);
    if (!result.ok || !result.user) {
      setError({ field: result.field, message: result.message ?? "Đăng nhập không thành công." });
      return;
    }

    // Giả lập độ trễ gọi API để trạng thái chờ không nháy quá nhanh.
    setPending(true);
    const user = result.user;
    setTimeout(() => {
      session.signIn(user.id);
      router.replace(next);
    }, 420);
  }

  function fillDemo(userEmail: string) {
    setEmail(userEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------ cột thương hiệu -- */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[380px] w-[380px] rounded-full bg-white/8 blur-[120px]" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[13px] font-semibold text-ink">S</span>
          <span>
            <span className="block text-[14px] font-semibold leading-tight">StyleRent</span>
            <span className="block text-[11px] leading-tight text-white/55">Operations</span>
          </span>
        </div>

        <div className="relative max-w-[30rem]">
          <p className="font-[family-name:var(--font-display)] text-[40px] leading-[1.12] tracking-[-0.02em]">
            Mỗi bộ trang phục là một cá thể có lịch riêng.
          </p>
          <p className="mt-5 text-[13.5px] leading-relaxed text-white/62">
            Hệ thống vận hành cho thuê trang phục: đơn thuê, lịch bận từng cá thể, bàn giao, nhận trả và quyết toán cọc —
            tất cả trên một màn hình duy nhất.
          </p>

          <ul className="mt-9 space-y-3">
            {[
              "Lịch bận theo từng cá thể, đã cộng ngày đệm giặt ủi",
              "Quét QR để bàn giao và nhận trả, không nhập tay mã",
              "Cọc tách khỏi doanh thu, phí vượt hạn mức phải qua duyệt",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13px] text-white/78">
                <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-white/12">
                  <IconCheck width={11} height={11} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11.5px] text-white/40">
          © {YEAR} StyleRent · Khu vực dành riêng cho nhân viên vận hành
        </p>
      </aside>

      {/* ----------------------------------------------------- cột biểu mẫu -- */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">S</span>
            <span>
              <span className="block text-[14px] font-semibold leading-tight">StyleRent</span>
              <span className="block text-[11px] leading-tight text-ink-3">Operations</span>
            </span>
          </div>

          <h1 className="text-[22px] font-[560] tracking-[-0.015em]">Đăng nhập hệ thống vận hành</h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
            Dùng tài khoản nhân viên được Admin cấp. Quyền hiển thị trên giao diện lấy theo vai trò của tài khoản.
          </p>

          <form onSubmit={submit} noValidate className="mt-7 space-y-4">
            <div>
              <label className="field-label" htmlFor="login-email">
                Email công việc
              </label>
              <div className="relative">
                <IconMail
                  width={15}
                  height={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  id="login-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="ten.ban@stylerent.vn"
                  aria-invalid={error?.field === "email"}
                  className={cn("field pl-8", error?.field === "email" && "field-error")}
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="field-label" htmlFor="login-password">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setError({ message: "Liên hệ Admin hệ thống để đặt lại mật khẩu." })}
                  className="mb-[0.3rem] text-[11.5px] text-ink-3 underline underline-offset-2 hover:text-ink"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <IconLock
                  width={15}
                  height={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  aria-invalid={error?.field === "password"}
                  className={cn("field px-8", error?.field === "password" && "field-error")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-3 transition-colors hover:text-ink"
                >
                  {showPassword ? <IconEyeOff width={15} height={15} /> : <IconEye width={15} height={15} />}
                </button>
              </div>
            </div>

            {error && (
              <Callout tone="danger" icon={<IconAlert width={15} height={15} />}>
                {error.message}
              </Callout>
            )}

            <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-ink-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-ink)]"
              />
              Ghi nhớ thiết bị này trong 30 ngày
            </label>

            <button type="submit" disabled={pending} className="btn btn-lg btn-block gap-1.5">
              {pending ? "Đang mở phiên làm việc…" : "Đăng nhập"}
              {!pending && <IconArrowRight width={15} height={15} />}
            </button>
          </form>

          {/* ------------------------------------------- tài khoản dùng thử -- */}
          <div className="mt-8 border-t border-line pt-5">
            <p className="label-xs">Tài khoản mẫu để chấm bài</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-3">
              Bấm một dòng để điền sẵn. Mật khẩu chung cho mọi tài khoản mẫu:{" "}
              <span className="num rounded border border-dashed border-ink-3 px-1 py-0.5 text-ink-2">{DEMO_PASSWORD}</span>
            </p>
            <div className="mt-3 grid gap-1.5">
              {DEMO_ACCOUNTS.map(({ role, user }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(user.email)}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
                    email.toLowerCase() === user.email.toLowerCase()
                      ? "border-ink bg-beige"
                      : "border-line bg-surface hover:border-ink-3",
                  )}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-ink text-[10px] font-semibold text-white">
                    {ROLE_SHORT[role][0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px]">{ROLE_LABEL[role]}</span>
                    <span className="block truncate text-[11px] text-ink-3">{ROLE_SCOPE[role]}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-3">{ROLE_SHORT[role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
