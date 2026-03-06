import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { SystemStateKey } from "@/features/health/system-state";

export const statusColor: Record<SystemStateKey, string> = {
  unknown: "bg-neutral-300 dark:bg-neutral-700",
  healthy: "bg-green-500",
  degraded: "bg-amber-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-red-500",
};

export function StatusDot({
  pulse = false,
  className,
  status = "unknown",
  ...props
}: React.ComponentProps<"div"> & {
  pulse?: boolean;
  status?: SystemStateKey;
}) {
  const color = statusColor[status];

  return (
    <div className={cn("relative size-2", className)} {...props}>
      {pulse && status !== "unknown" && (
        <Badge
          className={cn(
            "absolute top-0 left-0 aspect-square size-full p-0 animate-ping",
            color,
          )}
        />
      )}
      <Badge
        className={cn(
          "absolute top-0 left-0 aspect-square size-full p-0",
          color,
        )}
      />
    </div>
  );
}
