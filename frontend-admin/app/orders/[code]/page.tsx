import { Suspense } from "react";
import { OrderDetailView } from "@/components/domain/OrderDetailView";
import { Skeleton } from "@/components/ui/Primitives";
import { ORDERS } from "@/data/operations";

/** Bản export tĩnh phải biết trước danh sách đơn để sinh sẵn từng trang. */
export function generateStaticParams() {
  return ORDERS.map((order) => ({ code: order.code }));
}

export default async function OrderDetailPage(props: PageProps<"/orders/[code]">) {
  const { code } = await props.params;
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
      <OrderDetailView code={code} />
    </Suspense>
  );
}
