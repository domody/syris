import * as React from "react";

import { cn } from "@/lib/utils";

export function PageWrap({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto px-4 flex flex-col min-h-screen w-full max-w-5xl min-w-0 justify-start items-start 2xl:max-w-6xl",
        className,
      )}
      {...props}
    />
  );
}
