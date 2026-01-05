"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { useDashboardStore } from "@/state/dashboard-store";

import { HugeiconsIcon } from "@hugeicons/react";
import { PlugSocketIcon } from "@hugeicons/core-free-icons";

export function Panel({
  title = "base-panel",
  footer,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { title?: string; footer?: React.ReactNode }) {
  const wsStatus = useDashboardStore((s) => s.wsStatus)

  return (
    <Card
      className={cn(
        className,
        "bg-transparent py-0 pb-2 h-full max-h-full overflow-hidden min-h-0 gap-0"
      )}
      {...props}
    >
      <CardHeader className="pt-1 px-2 shrink-0">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 flex-1 min-h-0 overflow-hidden">
        {wsStatus === "connected" ? (
          children
        ) : (
          <Empty className="border border-dashed h-full rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon
                  icon={PlugSocketIcon}
                  strokeWidth={2}
                  className="aspect-square"
                />
              </EmptyMedia>
              <EmptyTitle>Websocket Not Connected</EmptyTitle>
              <EmptyDescription>go fix it.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent></EmptyContent>
          </Empty>
        )}
      </CardContent>
      {footer && <CardFooter className="px-2 shrink-0 mt-2">{footer}</CardFooter>}
    </Card>
  );
}

export function TerminalFeed({
  items,
  renderItem,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const pinnedRef = React.useRef(true); // avoid rerenders

  // Update pinnedRef when user scrolls
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      pinnedRef.current = distanceFromBottom <= 48;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Initial scroll to bottom, and keep pinned when new messages arrive
  React.useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Wait one frame so layout is finalized
    requestAnimationFrame(() => {
      if (pinnedRef.current) {
        // Option A: anchor scroll
        bottomRef.current?.scrollIntoView({ block: "end" });

        // Option B: direct scroll (also fine)
        // el.scrollTop = el.scrollHeight;
      }
    });
  }, [items.length]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-1 justify-end mt-auto">
        {items.map((it, idx) => renderItem(it, idx))}
        <div ref={bottomRef} className="bg-bordr h-px w-full" />
      </div>
    </div>
  );
}
