import * as React from "react";

import { Button } from "@/components/ui/button";
import { SyrisCard } from "@/components/ui/syirs-card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  FilterMailSquareIcon,
  MoreHorizontalCircle02Icon,
} from "@hugeicons/core-free-icons";

import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { PageWrap } from "@/components/ui/page-wrap";
import { addMap } from "../add-map";
import Link from "next/link";

export function AddPage() {
  const sortedAddMap = React.useMemo(
    () =>
      [...addMap].sort(
        (a, b) => Number(a.disabled || 0) - Number(b.disabled || 0),
      ),
    [addMap],
  );

  return (
    <PageWrap className="px-0">
      <TopBar className="px-4">
        <Button variant={"ghost"} size={"icon-lg"} asChild>
          <Link href={"/"}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Link>
        </Button>
        {/* <div className="flex items-center justify-center gap-0">
          <p>Select a Meal</p>
          <Button variant={"ghost"} size={"icon-lg"}>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
          </Button>
        </div> */}
        <MealTypeSelect />
        <Button variant={"ghost"} size={"icon-lg"}>
          <HugeiconsIcon icon={MoreHorizontalCircle02Icon} strokeWidth={2} />
        </Button>
      </TopBar>
      <div className="grid grid-cols-1 w-full border-t">
        {sortedAddMap.map((option) => {
          return (
            <Link
              key={option.link}
              href={option.link}
              className={`col-span-1 w-full rounded-md flex items-center justify-start gap-y-2 [&>svg]:size-4.5 gap-4 px-4 py-2 border-b ${option.disabled ? "text-muted-foreground" : "text-primary"}`}
            >
              <HugeiconsIcon icon={option.icon} strokeWidth={2} />
              <p className="text-base text-center">{option.label}</p>
            </Link>
          );
        })}
      </div>
      <SyrisCard
        className="px-4 mt-4"
        title="History"
        action={
          <Button variant="outline">
            <HugeiconsIcon icon={FilterMailSquareIcon} strokeWidth={2} />
            Filter
          </Button>
        }
        contentVariant="list"
      >
        <HistoryItem />
        <HistoryItem />
        {/* ... */}
      </SyrisCard>
    </PageWrap>
  );
}

function MealTypeSelect() {
  return (
    <Select defaultValue="">
      <SelectTrigger
        id="select-meal-type"
        className="bg-transparent border-0 text-base text-primary font-semibold focus-visible:ring-0"
      >
        <SelectValue placeholder="Select a Meal" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="breakfast">Breakfast</SelectItem>
          <SelectItem value="lunch">Lunch</SelectItem>
          <SelectItem value="dinner">Dinner</SelectItem>
          <SelectItem value="snack">Snack</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function HistoryItem() {
  return (
    <Item variant={"muted"}>
      <ItemContent>
        <ItemTitle>Greek Yogurt</ItemTitle>
        <ItemDescription>420 kcals | 250g</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant={"secondary"} className="text-primary">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      </ItemActions>
    </Item>
  );
}
