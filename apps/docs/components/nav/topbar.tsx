"use client";

import { BrainCircuit } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export function Topbar() {
  return (
    <div className="h-(--header-height) w-screen border-b bg-background sticky top-0 left-0 z-99 text-sm text-muted-foreground gap-4 contain-content">
      <div className="container flex items-center justify-start h-full">
        <Link
          href={"/"}
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            "mr-4 text-foreground",
          )}
        >
          <BrainCircuit data-icon="inline-start" />
          syris-docs
          <Badge>v3.0.1</Badge>
        </Link>

        <Link
          href={"/docs"}
          className={buttonVariants({ variant: "ghost", size: "default" })}
        >
          Documentation
        </Link>
      </div>
    </div>
  );
}
