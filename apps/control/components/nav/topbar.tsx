"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Eclipse } from "lucide-react";
import { useTheme } from "next-themes";
import { GitHubLink } from "./github-link";

export function Topbar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div
      className={cn(
        "h-(--header-height) border-b w-full flex items-center p-4",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2">{children}</div>
      <div className="flex items-center">
        <GitHubLink />
        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={() => {
            resolvedTheme === "light" ? setTheme("dark") : setTheme("light");
          }}
        >
          <Eclipse />
        </Button>
      </div>
    </div>
  );
}
