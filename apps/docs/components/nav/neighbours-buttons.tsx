"use client";

import Link from "next/link";
import { buttonVariants } from "../ui/button";
import { ArrowLeft, ArrowRight } from "@solar-icons/react";

export function PreviousNeighbour({ url }: { url: string }) {
  return (
    <Link
      href={url}
      className={buttonVariants({
        variant: "secondary",
        size: "icon",
      })}
    >
      <ArrowLeft />
      <span className="sr-only">Previous</span>
    </Link>
  );
}

export function NextNeighbour({ url }: { url: string }) {
  return (
    <Link
      href={url}
      className={buttonVariants({
        variant: "secondary",
        size: "icon",
      })}
    >
      <span className="sr-only">Next</span>
      <ArrowRight />
    </Link>
  );
}
