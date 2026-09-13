import { OrderDetailView } from "@/components/account/OrderDetailView";

export default async function OrderDetailPage(props: PageProps<"/tai-khoan/don-thue/[code]">) {
  const { code } = await props.params;
  return <OrderDetailView code={code} />;
}
