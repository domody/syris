import * as React from "react";
import { cn } from "@/lib/utils";

export function TopBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("h-20 w-full flex items-center justify-between", className)}
      {...props}
    />
  );
}
