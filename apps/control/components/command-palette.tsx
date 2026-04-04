"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  Bell,
  ListTodo,
  CalendarClock,
  Eye,
  GitBranch,
  Plug,
  ScrollText,
  Search,
  Settings,
  Pause,
  Play,
  ShieldAlert,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command"
import { Dialog, DialogContent } from "@workspace/ui/components/dialog"
import { useDashboard } from "./dashboard-context"
import { tasks, traceGraphs } from "@/src/mock/data"
import type { AutonomyLevelCode } from "@/lib/api/types"

const autonomyLabels: Record<AutonomyLevelCode, string> = {
  A0: "Full manual",
  A1: "Supervised",
  A2: "Scoped autonomy",
  A3: "High autonomy",
  A4: "Full autonomy",
}

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Live Feed", href: "/feed", icon: Zap },
  { label: "Approvals", href: "/approvals", icon: CheckSquare },
  { label: "Alarms", href: "/alarms", icon: Bell },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Schedules", href: "/schedules", icon: CalendarClock },
  { label: "Watchers", href: "/watchers", icon: Eye },
  { label: "Rules", href: "/rules", icon: GitBranch },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Audit Log", href: "/audit", icon: ScrollText },
  { label: "Trace Inspector", href: "/traces", icon: Search },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function CommandPalette() {
  const router = useRouter()
  const {
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    autonomyLevel,
    setAutonomyLevel,
    pipelinePaused,
    togglePipeline,
    addToast,
  } = useDashboard()

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        openCommandPalette()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openCommandPalette])

  function run(action: () => void) {
    closeCommandPalette()
    action()
  }

  function navigate(href: string) {
    run(() => router.push(href))
  }

  function changeAutonomy(level: AutonomyLevelCode) {
    run(() => {
      const prev = autonomyLevel
      setAutonomyLevel(level)
      addToast({
        title: "Autonomy level changed",
        description: `${prev} → ${level} (${autonomyLabels[level]})`,
        variant: "success",
      })
    })
  }

  function handlePipelineToggle() {
    run(() => {
      togglePipeline()
      addToast({
        title: pipelinePaused ? "Pipeline resumed" : "Pipeline paused",
        variant: pipelinePaused ? "success" : "warning",
      })
    })
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={(open) => !open && closeCommandPalette()}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden max-w-lg">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search pages, tasks, traces, actions..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Navigation */}
            <CommandGroup heading="Navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => navigate(item.href)}
                  >
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* Tasks */}
            {tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {tasks.map((task) => (
                  <CommandItem
                    key={task.task_id}
                    value={`task ${task.task_id} ${task.handler}`}
                    onSelect={() => navigate(`/tasks/${task.task_id}`)}
                  >
                    <ListTodo className="size-3.5 text-muted-foreground" />
                    <span className="font-mono text-primary">{task.task_id}</span>
                    <span className="text-muted-foreground">{task.handler}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* Traces */}
            <CommandGroup heading="Traces">
              {traceGraphs.map((trace) => (
                <CommandItem
                  key={trace.trace_id}
                  value={`trace ${trace.trace_id}`}
                  onSelect={() => navigate(`/traces/${trace.trace_id}`)}
                >
                  <Search className="size-3.5 text-muted-foreground" />
                  <span className="font-mono text-primary">{trace.trace_id}</span>
                  <span className="text-muted-foreground">
                    {new Date(trace.started_at).toLocaleString()}
                  </span>
                </CommandItem>
              ))}
              <CommandItem
                value="go to trace open trace inspector"
                onSelect={() => navigate("/traces")}
              >
                <Search className="size-3.5 text-muted-foreground" />
                <span>Open trace inspector…</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Quick actions */}
            <CommandGroup heading="Actions">
              <CommandItem
                value={`${pipelinePaused ? "resume" : "pause"} pipeline`}
                onSelect={handlePipelineToggle}
              >
                {pipelinePaused ? (
                  <Play className="size-3.5 text-emerald-500" />
                ) : (
                  <Pause className="size-3.5 text-warning" />
                )}
                <span>{pipelinePaused ? "Resume pipeline" : "Pause pipeline"}</span>
              </CommandItem>

              {(["A0", "A1", "A2", "A3", "A4"] as AutonomyLevelCode[]).map((level) => (
                <CommandItem
                  key={level}
                  value={`change autonomy ${level} ${autonomyLabels[level]}`}
                  onSelect={() => changeAutonomy(level)}
                  disabled={level === autonomyLevel}
                >
                  <ShieldAlert className="size-3.5 text-muted-foreground" />
                  <span>
                    Change autonomy to{" "}
                    <span className="font-mono">{level}</span>
                    {" — "}
                    <span className="text-muted-foreground">{autonomyLabels[level]}</span>
                  </span>
                  {level === autonomyLevel && (
                    <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
