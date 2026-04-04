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
import { CardWrapper } from "./card-wrapper";

export function MilestoneCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <CardWrapper>
      <Item
        className={cn("rounded-2xl border-border/50", className)}
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
            <span className="font-medium text-foreground">2</span>
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button variant={"ghost"} size={"icon-sm"}>
            <ArrowUpRightIcon />
          </Button>
        </ItemActions>
      </Item>
    </CardWrapper>
  );
}
