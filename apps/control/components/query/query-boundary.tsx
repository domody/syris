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

type Props = {
  className?: string;

  isLoading: boolean;
  isError: boolean;
  error: unknown;
  hasData: boolean;

  // what to show while loading
  loading: React.ReactNode;

  // what to show when server is down / network failed
  offline?: React.ReactNode;

  // what to show for server-side errors (4xx/5xx)
  errorFallback?: (err: unknown) => React.ReactNode;

  // if true, render children but visually disabled when offline/error
  softDisable?: boolean;

  children: React.ReactNode;
};

export function QueryBoundary({
  className,
  isLoading,
  isError,
  error,
  hasData,
  loading,
  offline,
  errorFallback,
  softDisable = false,
  children,
}: Props) {
  if (isLoading && !hasData) return <>{loading}</>;

  if (isError && !hasData) {
    if (isNetworkError(error)) {
      return (
        <>
          {offline ?? (
            <Card size="sm">
              <CardHeader>
                <CardDescription className="text-foreground font-medium">
                  API unavailable (server down / blocked / offline). You can
                  still navigate the app.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <CardDescription>{getErrorSummary(error)}</CardDescription>
              </CardFooter>
            </Card>
          )}
        </>
      );
    }

    return (
      <>
        {errorFallback?.(error) ?? (
          <div className="p-3 rounded-md border text-sm">
            Failed to load.
            <div className="mt-1 opacity-70">{getErrorSummary(error)}</div>
          </div>
        )}
      </>
    );
  }

  // If we have data but a background refetch fails, we still want to show the stale data.
  // softDisable can indicate degraded state without bricking UI.
  const degraded = isError && hasData;

  if (softDisable && degraded)
    return (
      <div className={cn("opacity-60 pointer-events-none", className)}>
        {children}
      </div>
    );

  return <>{children}</>;
}
