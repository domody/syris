"use client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <Button size={"icon-lg"} variant={"ghost"} onClick={handleBack}>
      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
    </Button>
  );
}
