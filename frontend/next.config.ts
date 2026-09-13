import type { NextConfig } from "next";

/**
 * GitHub Pages chỉ phục vụ file tĩnh nên bản deploy chạy `output: "export"`.
 *
 * Hai biến môi trường dưới đây chỉ được đặt trong workflow deploy, vì vậy
 * `npm run dev` ở máy vẫn giữ nguyên http://localhost:3000 không có tiền tố.
 */
const isExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isExport && {
    output: "export",
    // Pages phục vụ theo thư mục, nên sinh `foo/index.html` thay vì `foo.html`.
    trailingSlash: true,
    ...(basePath && { basePath }),
    images: { unoptimized: true },
  }),
};

export default nextConfig;
