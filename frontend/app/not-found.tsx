import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center pt-[76px] text-center">
      <p className="eyebrow text-ink-3">Lỗi 404</p>
      <h1 className="display-1 mt-5 max-w-[16ch]">Không tìm thấy trang này</h1>
      <p className="lede mt-5 max-w-[48ch]">
        Có thể liên kết đã cũ, hoặc thiết kế bạn tìm đã được đưa ra khỏi tủ đồ cho thuê.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/danh-muc/tat-ca" className="btn">
          Khám phá bộ sưu tập
        </Link>
        <Link href="/" className="btn btn-outline">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
