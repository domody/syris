import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { QueryBoundary } from "./query-boundary";

type QueryCardProps<TData, TError = unknown> = {
  query: {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
  };

  //   card props
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "default" | "sm";
  className?: string;
  contentClassName?: string;

  //   states
  loading?: React.ReactNode;
  offline?: React.ReactNode;
  errorFallback?: (error: unknown) => React.ReactNode;

  //   others
  softDisable?: boolean;
  children: React.ReactNode;
};

export function QueryCard<TData, TError = unknown>({
  query,
  title,
  description,
  actions,
  size = "sm",
  className,
  contentClassName,
  loading,
  offline,
  errorFallback,
  softDisable = false,
  children,
}: QueryCardProps<TData, TError>) {
  const hasData = query.data != null;

  return (
    <Card size={size} className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </div>
      </CardHeader>

      <CardContent className={contentClassName}>
        <QueryBoundary
          query={query}
          loading={loading}
          offline={offline}
          errorFallback={errorFallback}
          softDisable={softDisable}
        >
          {children}
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}
