import { OrderDetailView } from "@/components/account/OrderDetailView";
import { ORDERS } from "@/data/orders";

/** Bản export tĩnh phải biết trước danh sách đơn để sinh sẵn từng trang. */
export function generateStaticParams() {
  return ORDERS.map((order) => ({ code: order.code }));
}

export default async function OrderDetailPage(props: PageProps<"/account/rentals/[code]">) {
  const { code } = await props.params;
  return <OrderDetailView code={code} />;
}
