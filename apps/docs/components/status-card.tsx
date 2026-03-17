import React from "react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { cn } from "@/lib/utils";
import { CardWrapper } from "./card-wrapper";

export function StatusCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <CardWrapper>
      <Item
        className={cn("rounded-2xl border-border/50 h-full", className)}
        {...props}
        variant={"muted"}
      >
        <ItemMedia>
          <div className="size-2 bg-muted-foreground rounded-full" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="font-mono text-xs text-muted-foreground">
            System Offline
          </ItemTitle>
        </ItemContent>
      </Item>
    </CardWrapper>
  );
}
