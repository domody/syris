import { cn } from "@workspace/ui/lib/utils"

export function InsetCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex w-full gap-2 rounded-xl bg-accent/60 p-2", className)}
      {...props}
    />
  )
}
