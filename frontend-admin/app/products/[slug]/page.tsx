import { ProductEditor } from "@/components/domain/ProductEditor";
import { PRODUCTS } from "@/data/products";

/** Bản export tĩnh phải biết trước danh sách sản phẩm để sinh sẵn từng trang. */
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export default async function ProductEditorPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  return <ProductEditor slug={slug} />;
}
