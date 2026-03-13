import React from "react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { cn } from "@/lib/utils";

export function StatusCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Item className={cn("rounded-2xl", className)} {...props} variant={"muted"}>
      <ItemMedia>
        <div className="size-2 bg-muted-foreground rounded-full" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="font-mono text-xs text-muted-foreground">System Offline</ItemTitle>
      </ItemContent>
    </Item>
  );
}
