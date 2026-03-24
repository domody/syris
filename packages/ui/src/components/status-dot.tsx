import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "./badge";
import {
  type SystemStateKey,
  statusColor,
} from "@workspace/ui/types/system-state";

export function StatusDot({
  pulse = false,
  className,
  dotClassName,
  status = undefined,
  ...props
}: React.ComponentProps<"div"> & {
  pulse?: boolean;
  dotClassName?: string;
  status?: SystemStateKey | undefined;
}) {
  const color = status ? statusColor[status] : undefined;

  return (
    <div className={cn("relative size-2", className)} {...props}>
      {pulse && status !== "unknown" && (
        <Badge
          className={cn(
            "absolute top-0 left-0 aspect-square size-full p-0 animate-ping",
            color,
            dotClassName,
          )}
        />
      )}
      <Badge
        className={cn(
          "absolute top-0 left-0 aspect-square size-full p-0",
          color,
          dotClassName,
        )}
      />
    </div>
  );
}
