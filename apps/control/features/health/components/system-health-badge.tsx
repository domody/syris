"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useHealth } from "../use-health";
import { getSystemState } from "../system-state";

export function SystemHealthBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const q = useHealth();
  const systemState = getSystemState(q);

  return (
    <Badge className={cn(systemState.color, className)} {...props}>
      {systemState.title}
    </Badge>
  );
}
