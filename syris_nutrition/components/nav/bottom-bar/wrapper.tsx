import * as React from "react";
import { BottomBar } from "./bottom-bar";

export function BottomBarPageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-screen h-screen">
      <div className="h-[calc(100vh-4rem)] w-full overflow-x-hidden overflow-y-auto pb-2">
        {children}
      </div>
      <BottomBar />
    </div>
  );
}
