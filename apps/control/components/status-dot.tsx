import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export function StatusDot({
  pulse = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  pulse?: boolean;
  // status?: literal;
}) {
  return (
    <div className={cn("relative size-2", className)} {...props}>
      {pulse && (
        <Badge className="absolute top-0 left-0 bg-green-500 aspect-square size-full p-0 animate-ping" />
      )}
      <Badge className="absolute top-0 left-0 bg-green-500 aspect-square size-full p-0" />
    </div>
  );
}
