import { CustomerDetail } from "@/components/domain/CustomerDetail";

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  return <CustomerDetail id={id} />;
}
