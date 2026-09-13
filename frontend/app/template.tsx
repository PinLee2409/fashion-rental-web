"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/hooks";

/**
 * Chuyển trang: nội dung mới mờ dần và trượt lên ~12px trong 420ms.
 * Không chặn điều hướng — trang render ngay, chuyển động chỉ là lớp trình bày.
 * Đồng thời kích hoạt scroll-reveal cho các khối trong trang mới.
 */
export default function Template({ children }: { children: ReactNode }) {
  useReveal();
  return <div className="page-enter">{children}</div>;
}
