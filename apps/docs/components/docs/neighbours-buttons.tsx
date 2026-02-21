"use client";

import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ArrowLeft, ArrowRight } from "@solar-icons/react";
import React from "react";
import { cn } from "@/lib/utils";

export function PreviousNeighbour({
  url,
  label,
  className,
  ...props
}: {
  url: string;
  label?: string;
} & React.ComponentProps<"a">) {
  return (
    <Link
      href={url}
      className={cn(
        buttonVariants({
          variant: "secondary",
          size: label ? "sm" : "icon-sm",
        }),
        className,
      )}
      {...props}
    >
      <ArrowLeft />
      {label ? <span>{label}</span> : <span className="sr-only">Previous</span>}
    </Link>
  );
}

export function NextNeighbour({
  url,
  label,
  className,
  ...props
}: {
  url: string;
  label?: string;
} & React.ComponentProps<"a">) {
  return (
    <Link
      href={url}
      className={cn(
        buttonVariants({
          variant: "secondary",
          size: label ? "sm" : "icon-sm",
        }),
        className,
      )}
      {...props}
    >
      {label ? <span>{label}</span> : <span className="sr-only">Next</span>}
      <ArrowRight />
    </Link>
  );
}
