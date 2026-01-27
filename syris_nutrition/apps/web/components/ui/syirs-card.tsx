import * as React from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SyrisCardVariant = "list" | "panel"

type SyrisCardProps = React.ComponentProps<typeof Card> & {
  /** Surface behavior for the content area */
  contentVariant?: SyrisCardVariant
  /** Optional convenience title rendered as CardDescription */
  title?: React.ReactNode
  /** Optional action rendered on the right */
  action?: React.ReactNode
  /** Class applied to CardContent */
  contentClassName?: string
}

/**
 * SyrisCard is a "container card":
 * - outer Card is essentially unstyled container
 * - title is a muted description above content
 * - content can be list (no surface) or panel (shared surface)
 */
export function SyrisCard({
  className,
  title,
  action,
  children,
  contentVariant = "list",
  contentClassName,
  ...props
}: SyrisCardProps) {
  return (
    <Card
      {...props}
      className={cn(
        "w-full max-w-md overflow-hidden bg-transparent gap-0 ring-0 p-0",
        className
      )}
    >
      {(title || action) && (
        <CardHeader className="px-0">
          {title ? (
            <CardDescription className="mt-1.5">{title}</CardDescription>
          ) : null}

          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "flex flex-col items-start justify-start px-0 flex-1",
          contentVariant === "list" && "gap-y-2 pt-2",
          contentVariant === "panel" && "gap-y-2 bg-muted/50 p-3 rounded-md",
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * Optional subcomponents
 */
SyrisCard.Header = function SyrisCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("px-0", className)} {...props} />
}

SyrisCard.Title = function SyrisCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>) {
  return <CardDescription className={cn("mt-1.5", className)} {...props} />
}

SyrisCard.Action = function SyrisCardAction({
  className,
  ...props
}: React.ComponentProps<typeof CardAction>) {
  return <CardAction className={cn(className)} {...props} />
}

SyrisCard.Content = function SyrisCardContent({
  className,
  variant = "list",
  ...props
}: React.ComponentProps<typeof CardContent> & { variant?: SyrisCardVariant }) {
  return (
    <CardContent
      className={cn(
        "flex flex-col items-start justify-start px-0 flex-1",
        variant === "list" && "gap-y-2 pt-2",
        variant === "panel" && "gap-y-2 bg-muted/50 p-3 rounded-md",
        className
      )}
      {...props}
    />
  )
}
