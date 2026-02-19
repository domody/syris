import { BackButton } from "@/components/nav/back-button";
import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { PageWrap } from "@/components/ui/page-wrap";
import { SyrisCard } from "@/components/ui/syirs-card";
import { fetchProductLite } from "@/utils/product";
import { ItemEditors } from "./client";
import { getEffectiveGoals } from "@/lib/data/goals";
import { todayDate } from "@/utils/date";

export default async function Page({
  params,
}: {
  params: Promise<{ barcode: string }>;
}) {
  const { barcode } = await params;

  const product = await fetchProductLite(Number(barcode));

  const goals = await getEffectiveGoals(todayDate());

  return (
    <PageWrap>
      <TopBar>
        <BackButton />
        <p className="text-sm text-muted-foreground">Food Listing: {barcode}</p>
      </TopBar>
      <SyrisCard></SyrisCard>
      <div className="flex flex-col items-start justify-start w-full gap-y-4">
        <p className="font-medium text-lg">{product.name}</p>
        {goals && (
          <ItemEditors
            product_lite={product}
            goals={goals}
          />
        )}
      </div>
    </PageWrap>
  );
}
