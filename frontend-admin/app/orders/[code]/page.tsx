import { Suspense } from "react";
import { OrderDetailView } from "@/components/domain/OrderDetailView";
import { Skeleton } from "@/components/ui/Primitives";

export default async function OrderDetailPage(props: PageProps<"/orders/[code]">) {
  const { code } = await props.params;
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
      <OrderDetailView code={code} />
    </Suspense>
  );
}
