import { cn } from "@/lib/utils";
import React from "react";

export function CardWrapper({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full p-1.5 border rounded-[calc(var(--radius-2xl)+6px)] container bg-muted/50",
        className,
      )}
      {...props}
    />
  );
}
