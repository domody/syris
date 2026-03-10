"use client";

import * as React from "react";
import { isNetworkError, getErrorSummary } from "@/lib/http/is-network-error";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { TriangleAlertIcon } from "lucide-react";

type QueryBoundaryProps<TError = unknown> = {
  query: {
    data: unknown;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
  };
  loading?: React.ReactNode;
  offline?: React.ReactNode;
  errorFallback?: (error: TError) => React.ReactNode;
  softDisable?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function QueryBoundary<TError = unknown>({
  query,
  loading,
  offline,
  errorFallback,
  softDisable = false,
  className,
  children,
}: QueryBoundaryProps<TError>) {
  const hasData = query.data != null;
  const loadingOnly = query.isLoading && !hasData;
  const failedWithoutData = query.isError && !hasData;
  const degraded = query.isError && hasData;

  if (loadingOnly) {
    return <>{loading ?? null}</>;
  }

  if (failedWithoutData) {
    if (isNetworkError(query.error)) {
      return (
        <>
          {offline ?? (
            <div className="rounded-md border p-3 text-sm">
              API unavailable.
              <div className="mt-1 opacity-70">
                {getErrorSummary(query.error)}
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        {errorFallback?.(query.error!) ?? (
          <Alert variant={"destructive"}>
            <TriangleAlertIcon />
            <AlertTitle>Failed to load</AlertTitle>
            <AlertDescription>{getErrorSummary(query.error)}</AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  if (softDisable && degraded) {
    return (
      <div className={cn("pointer-events-none opacity-60", className)}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
