import React from "react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon, MilestoneIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function MilestoneCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Item
      className={cn("rounded-2xl", className)}
      {...props}
      variant={"muted"}
      render={<Link href={"/docs/dev/milestones"} />}
    >
      <ItemMedia>
        <MilestoneIcon className="text-foreground size-4" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="font-mono text-xs text-foreground">
          Current Milestone:{" "}
          <span className="font-medium text-foreground">0</span>
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button variant={"ghost"} size={"icon-sm"}>
          <ArrowUpRightIcon />
        </Button>
      </ItemActions>
    </Item>
  );
}
