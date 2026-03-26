// app/(design)/design-system/components/section-wrapper.tsx
import { cn } from "@workspace/ui/lib/utils"
import type { DemoConfig } from "../app/registry"

interface SectionWrapperProps {
  demoKey: string
  config: DemoConfig
  children: React.ReactNode
}

export function SectionWrapper({
  demoKey,
  config,
  children,
}: SectionWrapperProps) {
  return (
    <section
      id={demoKey}
      className={cn(
        "group bg-s-1 overflow-hidden rounded-xl border",
        config.fullWidth ? "col-span-full" : ""
      )}
    >
      {/* Header */}
      <div className="bg-s-2 flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {config.name}
            </h2>
            {/* Section anchor pill */}
            <a
              href={`#${demoKey}`}
              className="rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-primary uppercase opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            >
              #{demoKey}
            </a>
          </div>
          {config.description && (
            <p className="text-sm text-zinc-500">{config.description}</p>
          )}
        </div>
      </div>

      {/* Demo content */}
      <div className="bg-muted p-5 dark:bg-background">
        <div className="flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="flex size-full max-w-3xl items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

