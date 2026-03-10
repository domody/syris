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
import { GlobeOffIcon, TriangleAlertIcon } from "lucide-react";

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
            // <Alert variant={"destructive"}>
            <div className="flex items-center justify-start *:[svg:not([class*='size-'])]:size-4 gap-2 text-destructive">
              <GlobeOffIcon />
              <AlertTitle>API not reachable</AlertTitle>
            </div>
            // <AlertDescription>
            // {getErrorSummary(query.error)}
            // </AlertDescription>
            // </Alert>
          )}
        </>
      );
    }

    return (
      <>
        {errorFallback?.(query.error!) ?? (
          <div className="flex items-center justify-start *:[svg:not([class*='size-'])]:size-4 gap-2 text-destructive">
            <TriangleAlertIcon />
            <AlertTitle>Failed to load</AlertTitle>
          </div>
          // <Alert variant={"destructive"}>
          //   <TriangleAlertIcon />
          //   <AlertTitle>Failed to load</AlertTitle>
          //   <AlertDescription>{getErrorSummary(query.error)}</AlertDescription>
          // </Alert>
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
