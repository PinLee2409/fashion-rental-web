import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/catalog/SearchResults";
import { ProductCardSkeleton } from "@/components/ui/Primitives";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm trang phục cho thuê theo tên, chất liệu, danh mục hoặc dịp sử dụng.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchFallback() {
  return (
    <div className="shell pt-[140px]">
      <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
