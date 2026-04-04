"use client"

import { use, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Circle,
  Pause,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { tasks, taskStepDetails } from "@/src/mock/data"
import type { TaskStepSummary, StepStatus } from "@/lib/api/types"
import type { TaskStepDetail } from "@/src/mock/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(0)}s`
}

const stepStatusConfig: Record<
  StepStatus,
  {
    icon: typeof CheckCircle2
    color: string
    borderColor: string
    bgColor: string
    animate?: boolean
  }
> = {
  completed: {
    icon: CheckCircle2,
    color: "text-success",
    borderColor: "border-success/50",
    bgColor: "bg-success/5",
  },
  running: {
    icon: Loader2,
    color: "text-primary",
    borderColor: "border-primary/50",
    bgColor: "bg-primary/5",
    animate: true,
  },
  failed: {
    icon: XCircle,
    color: "text-destructive",
    borderColor: "border-destructive/50",
    bgColor: "bg-destructive/5",
  },
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    borderColor: "border-border",
    bgColor: "bg-muted/30",
  },
  skipped: {
    icon: Circle,
    color: "text-muted-foreground",
    borderColor: "border-border",
    bgColor: "bg-muted/30",
  },
}

// ── Step Flow Node ──────────────────────────────────────────────────────────

interface StepNodeData {
  step: TaskStepSummary
  detail: TaskStepDetail | undefined
  selected: boolean
  onSelect: (stepId: string) => void
  [key: string]: unknown
}

function StepNode({ data }: { data: StepNodeData }) {
  const { step, detail, selected, onSelect } = data
  const config = stepStatusConfig[step.status]
  const Icon = detail?.is_gate ? Lock : config.icon
  const isGate = detail?.is_gate

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div
        onClick={() => {
          onSelect(step.step_id)
          // console.log("Clicked!!!")
        }}
        className={cn(
          "cursor-pointer rounded-lg border-2 px-4 py-3 transition-all min-w-[160px]",
          config.borderColor,
          config.bgColor,
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isGate && "border-dashed border-warning/60 bg-warning/5",
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <Icon
            className={cn(
              "size-3.5",
              isGate ? "text-warning" : config.color,
              config.animate && "animate-spin",
            )}
          />
          <span className="text-xs font-medium">
            {step.step_index + 1}. {detail?.label ?? step.tool_name}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          {isGate ? (
            <>
              <span className="text-warning">
                {step.status === "pending" ? "pending" : step.status}
              </span>
              {detail?.gate_risk && (
                <span className="ml-1.5">risk: {detail.gate_risk.toUpperCase()}</span>
              )}
            </>
          ) : (
            <>
              {step.status === "completed" && detail?.duration_ms && (
                <span className="text-success">{formatDuration(detail.duration_ms)}</span>
              )}
              {step.status === "running" && (
                <span className="text-primary">running</span>
              )}
              {step.status === "failed" && (
                <span className="text-destructive">failed</span>
              )}
              {step.status === "pending" && (
                <span>pending</span>
              )}
              {step.attempt_count > 0 && (
                <span className="ml-1.5">
                  attempt {step.attempt_count}/{3}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  )
}

const nodeTypes: NodeTypes = {
  stepNode: StepNode,
}

// ── Step Detail Panel ───────────────────────────────────────────────────────

function StepDetailPanel({
  step,
  detail,
}: {
  step: TaskStepSummary
  detail: TaskStepDetail | undefined
}) {
  if (!detail) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Step {step.step_index + 1}: {detail.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status row */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge
              variant={
                step.status === "completed"
                  ? "success"
                  : step.status === "failed"
                    ? "destructive"
                    : step.status === "running"
                      ? "default"
                      : "secondary"
              }
            >
              {step.status}
            </Badge>
          </div>
          {step.attempt_count > 0 && (
            <div>
              <span className="text-muted-foreground">Attempt:</span>{" "}
              <span className="font-medium">{step.attempt_count}/3</span>
            </div>
          )}
          {detail.duration_ms && (
            <div>
              <span className="text-muted-foreground">Duration:</span>{" "}
              <span className="font-medium">{formatDuration(detail.duration_ms)}</span>
            </div>
          )}
        </div>

        {/* Idempotency key */}
        <div className="text-xs">
          <span className="text-muted-foreground">Idempotency key:</span>
          <p className="mt-0.5 font-mono text-muted-foreground/70 break-all">
            {detail.idempotency_key}
          </p>
        </div>

        {/* Tool call */}
        {detail.tool_call && (
          <div className="text-xs">
            <span className="text-muted-foreground">
              Tool call: {detail.tool_call.tool} · {detail.tool_call.action}
            </span>
            <div className="mt-1 space-y-1">
              <div>
                <span className="text-muted-foreground">Request:</span>
                <pre className="mt-0.5 rounded-md bg-muted/50 p-2 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(detail.tool_call.request, null, 2)}
                </pre>
              </div>
              {detail.tool_call.response && (
                <div>
                  <span className="text-muted-foreground">Response:</span>
                  <pre className="mt-0.5 rounded-md bg-muted/50 p-2 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(detail.tool_call.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gate info */}
        {detail.is_gate && (
          <div className="text-xs">
            <span className="text-muted-foreground">Gate type:</span>{" "}
            <Badge variant="warning">Approval required</Badge>
            {detail.gate_risk && (
              <>
                {" · "}
                <span className="text-muted-foreground">Risk:</span>{" "}
                <span className="font-medium uppercase">{detail.gate_risk}</span>
              </>
            )}
          </div>
        )}

        {/* Audit trail */}
        {detail.audit_events.length > 0 && (
          <div className="text-xs">
            <p className="mb-1 font-medium text-muted-foreground">
              Audit trail for this step:
            </p>
            <div className="space-y-0.5">
              {detail.audit_events.map((evt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-mono text-muted-foreground tabular-nums">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <Badge
                    variant={
                      evt.type.includes("completed")
                        ? "success"
                        : evt.type.includes("failed")
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {evt.type}
                  </Badge>
                  <span className="text-muted-foreground">{evt.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step.error && (
          <div className="text-xs">
            <span className="text-destructive font-medium">Error:</span>
            <p className="mt-0.5 text-destructive/80">{step.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addToast } = useDashboard()
  const task = tasks.find((t) => t.task_id === id)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<"pause" | "cancel" | null>(null)

  const selectedStep = task?.steps.find((s) => s.step_id === selectedStepId)
  const selectedDetail = selectedStepId
    ? taskStepDetails[selectedStepId]
    : undefined

  // Build React Flow nodes & edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!task) return { initialNodes: [], initialEdges: [] }

    const NODE_WIDTH = 180
    const NODE_HEIGHT = 80
    const NODE_GAP_Y = 40

    const nodes: Node[] = task.steps.map((step, i) => ({
      id: step.step_id,
      type: "stepNode",
      position: { x: 0, y: i * (NODE_HEIGHT + NODE_GAP_Y) },
      data: {
        step,
        detail: taskStepDetails[step.step_id],
        selected: step.step_id === selectedStepId,
        onSelect: setSelectedStepId,
      },
      draggable: false,
    }))

    const edges: Edge[] = task.steps.slice(1).map((step, i) => ({
      id: `e-${task.steps[i].step_id}-${step.step_id}`,
      source: task.steps[i].step_id,
      target: step.step_id,
      animated: task.steps[i].status === "running",
      style: {
        stroke:
          task.steps[i].status === "completed"
            ? "var(--color-success)"
            : task.steps[i].status === "running"
              ? "var(--color-primary)"
              : "var(--color-border)",
      },
    }))

    return { initialNodes: nodes, initialEdges: edges }
  }, [task, selectedStepId])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Keep nodes in sync when selection changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  if (!task) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Task not found</p>
      </div>
    )
  }

  const completedSteps = task.steps.filter(
    (s) => s.status === "completed",
  ).length

  const graphHeight = task.steps.length * 120 + 60

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/tasks" className="hover:text-foreground transition-colors">
            Tasks
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{task.handler}</span>
        </div>
        <div className="flex gap-1.5">
          {task.status === "running" && (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setConfirmAction("pause")}
              >
                <Pause className="size-3 mr-1" />
                Pause
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setConfirmAction("cancel")}
              >
                <X className="size-3 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {task.status === "paused" && (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  addToast({
                    title: "Task resumed",
                    description: task.handler,
                    variant: "success",
                  })
                }
              >
                <Loader2 className="size-3 mr-1" />
                Resume
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setConfirmAction("cancel")}
              >
                <X className="size-3 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {task.status === "failed" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                addToast({
                  title: "Task retry triggered",
                  description: task.handler,
                  variant: "default",
                })
              }
            >
              <RefreshCw className="size-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Status:</span>{" "}
          <Badge
            variant={
              task.status === "running"
                ? "default"
                : task.status === "completed"
                  ? "success"
                  : task.status === "failed"
                    ? "destructive"
                    : task.status === "paused"
                      ? "warning"
                      : "secondary"
            }
          >
            {task.status}
          </Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Step:</span>{" "}
          <span className="font-medium">
            {completedSteps}/{task.steps.length}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Trace:</span>{" "}
          <Link
            href={`/traces/${task.trace_id}`}
            className="font-mono text-primary hover:underline"
          >
            {task.trace_id}
            <ExternalLink className="ml-0.5 inline size-3" />
          </Link>
        </div>
        {task.started_at && (
          <div>
            <span className="text-muted-foreground">Started:</span>{" "}
            <span className="font-medium">{timeAgo(task.started_at)}</span>
          </div>
        )}
        {task.error && (
          <div>
            <span className="text-destructive font-medium">Error:</span>{" "}
            <span className="text-destructive/80">{task.error}</span>
          </div>
        )}
      </div>

      {/* Step Flow Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Step Flow</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            style={{ height: Math.max(graphHeight, 300) }}
            className="w-full"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              panOnDrag
              zoomOnScroll
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              // elementsSelectable={false}
            >
              <Background gap={16} size={1} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Selected step detail */}
      {selectedStep ? (
        <StepDetailPanel step={selectedStep} detail={selectedDetail} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            Click any node above to see detail here
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialogs */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "pause" ? "Pause Task" : "Cancel Task"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "pause"
                ? "This will pause the current step. You can resume later."
                : "This will permanently cancel this task. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "cancel" ? "destructive" : "default"}
              onClick={() => {
                addToast({
                  title:
                    confirmAction === "pause" ? "Task paused" : "Task cancelled",
                  description: task.handler,
                  variant: confirmAction === "pause" ? "warning" : "destructive",
                })
                setConfirmAction(null)
              }}
            >
              {confirmAction === "pause" ? "Pause" : "Cancel task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
