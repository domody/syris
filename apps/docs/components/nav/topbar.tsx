"use client";

import { BrainCircuit, MenuIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { GitHubLink } from "./github-link";
import { Separator } from "../ui/separator";
import { VERSION } from "../../../version";
import { SidebarTrigger } from "../ui/sidebar";
import React from "react";
import { MobileNav } from "./mobile-nav";
import { source } from "@/lib/source";
import { SearchCommand } from "./search-command";

export function Topbar({ children }: { children?: React.ReactNode }) {
  const pageTree = source.pageTree;
  return (
    <header className="h-(--header-height) w-screen sticky top-2 left-0 z-99 max-[1432px]:px-4">
      <div className="container h-(--header-height) bg-muted/50 rounded-[calc(var(--radius-2xl)+6px)] backdrop-blur-sm border text-sm text-muted-foreground gap-4 contain-content px-3">
        <div className="container flex items-center justify-between h-full gap-2">
          <div className="w-min flex items-center justify-start">
            <Link
              href={"/"}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "text-foreground rounded-xl",
              )}
            >
              <BrainCircuit data-icon="inline-start" />
              <span className="max-md:hidden">syris-docs</span>
              <Badge>v{VERSION}</Badge>
            </Link>
          </div>
          <div className="w-full flex items-center justify-start">
            <Link
              href={"/docs"}
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "max-lg:hidden rounded-xl",
              )}
            >
              Documentation
            </Link>
          </div>
          <div className="w-full flex items-center justify-end gap-4">
            <MobileNav tree={pageTree} className="flex lg:hidden" />
            <SearchCommand tree={pageTree} className="hidden lg:flex" />
            <GitHubLink className="rounded-xl" />
          </div>
        </div>
      </div>
    </header>
  );
}
