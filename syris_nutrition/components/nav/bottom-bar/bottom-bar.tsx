"use client";

import { usePathname } from "next/navigation";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { navMap } from "../nav-map";
import { AddButtonMenu } from "./add-button";

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed shrink-0 bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around shadow-t text-xs bg-background border-t">
      {navMap.mobile.map((nav) => {
        console.log(nav.label);

        return (
          <Link
            key={nav.label}
            href={nav.link}
            className={`flex flex-col h-12 aspect-square rounded-full items-center justify-center gap-1 [&_svg:not([class*='size-'])]:size-5 ${nav.primary ? "-translate-y-1/2 bg-primary text-primary-foreground" : ""} ${pathname == nav.link ? "text-primary" : ""}`}
            prefetch={false}
          >
            <HugeiconsIcon icon={nav.icon} strokeWidth={2} />
            {!nav.primary && nav.label}
          </Link>
        );
      })}
      {/* <AddButtonMenu /> */}
    </nav>
  );
}
