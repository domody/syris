import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "../ui/card";
import { cn } from "@/lib/utils";

type SyrisCardVariant = "list" | "panel";

type SyrisCardProps = React.ComponentProps<typeof Card> & {
  //  surface behaviour for content area
  contentVariant?: SyrisCardVariant;
  //   title rendered above card
  title?: React.ReactNode;
  // optional action
  action?: React.ReactNode;
  // class applied tp card content
  contentClassName?: string;
};

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
        "w-full max-w-md overflow-hidden bg-transparent gap-0 ring-0 border-0 border-transparent ring-transparent p-0",
        className,
      )}
    >
      {(title || action) && (
        <CardHeader className="px-0">
          {title ? (
            <CardDescription className="mt-1.5">{title}</CardDescription>
          ) : null}

          {/* {action ? <CardAction>{action}</CardAction> : null} */}
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "flex flex-col items-start justify-start px-0",
          contentVariant === "list" && "gap-y-2 mt-2",
          contentVariant === "panel" && "gap-y-2 bg-muted/50 p-3 rounded-md mt-2",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
