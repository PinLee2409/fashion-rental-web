import { ProductEditor } from "@/components/domain/ProductEditor";

export default async function ProductEditorPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  return <ProductEditor slug={slug} />;
}
