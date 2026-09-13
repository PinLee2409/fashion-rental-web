import { CustomerDetail } from "@/components/domain/CustomerDetail";
import { CUSTOMERS } from "@/data/operations";

/** Bản export tĩnh phải biết trước danh sách khách để sinh sẵn từng trang. */
export function generateStaticParams() {
  return CUSTOMERS.map((customer) => ({ id: customer.id }));
}

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  const { id } = await props.params;
  return <CustomerDetail id={id} />;
}
