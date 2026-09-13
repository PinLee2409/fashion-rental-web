import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/CatalogView";
import { ProductCardSkeleton } from "@/components/ui/Primitives";
import { COLLECTION_SLUGS, resolveCollection } from "@/data/collections";

export function generateStaticParams() {
  return COLLECTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = resolveCollection(slug);
  if (!collection) return { title: "Không tìm thấy bộ sưu tập" };
  return { title: collection.title, description: collection.description };
}

export default async function CategoryPage(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const collection = resolveCollection(slug);
  if (!collection) notFound();

  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogView collection={collection} />
    </Suspense>
  );
}

function CatalogFallback() {
  return (
    <div className="shell pt-[140px]">
      <div className="grid gap-x-5 gap-y-12 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
