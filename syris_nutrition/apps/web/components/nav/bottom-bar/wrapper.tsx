import * as React from "react";
import { BottomBar } from "./bottom-bar";
import { cn } from "@/lib/utils";

export function BottomBarPageWrapper({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-screen h-screen">
      <div
        className={cn(
          "h-[calc(100vh-4rem)] w-full overflow-x-hidden overflow-y-auto pb-2 no-scrollbar",
          className,
        )}
      >
        {children}
      </div>
      <BottomBar />
    </div>
  );
}
