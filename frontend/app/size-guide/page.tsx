import type { Metadata } from "next";
import { SizeGuideView } from "@/components/catalog/SizeGuideView";

export const metadata: Metadata = {
  title: "Bảng size & gợi ý size",
  description:
    "Bảng size nữ và nam của StyleRent, cách đo ba vòng, và gợi ý size theo số đo của bạn.",
};

export default function SizeGuidePage() {
  return <SizeGuideView />;
}
