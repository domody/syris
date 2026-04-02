"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { useDashboard, type Toast } from "./dashboard-context"

const variantStyles: Record<Toast["variant"], string> = {
  default: "bg-card ring-foreground/10",
  success: "bg-card ring-success/30",
  warning: "bg-card ring-warning/30",
  destructive: "bg-card ring-destructive/30",
}

const variantDot: Record<Toast["variant"], string> = {
  default: "bg-foreground/50",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

export function ToastLayer() {
  const { toasts, dismissToast } = useDashboard()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex w-80 items-start gap-3 rounded-lg p-3 text-xs ring-1 shadow-lg animate-in slide-in-from-right-5 fade-in",
            variantStyles[toast.variant],
          )}
        >
          <span
            className={cn(
              "mt-1 size-2 shrink-0 rounded-full",
              variantDot[toast.variant],
            )}
          />
          <div className="flex-1 space-y-0.5">
            <p className="font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-muted-foreground">{toast.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => dismissToast(toast.id)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
