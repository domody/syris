"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { CheckCircle2, MinusCircle, ExternalLink } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { rules } from "@/src/mock/data"
import type { RuleCondition, RuleAction } from "@/src/mock/types"

// ── Condition tree renderer ───────────────────────────────────────────────────

const logicColor: Record<string, string> = {
  ALL: "text-primary border-primary/30 bg-primary/5",
  ANY: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
  NOT: "text-destructive border-destructive/30 bg-destructive/5",
}

function ConditionTree({ node, depth = 0 }: { node: RuleCondition; depth?: number }) {
  if (node.type === "leaf") {
    return (
      <div className={cn("flex items-center gap-2 text-xs", depth > 0 && "ml-4")}>
        <span className="text-muted-foreground">├──</span>
        <span className="font-mono text-primary">{node.field}</span>
        <span className="text-muted-foreground">{node.op}</span>
        <span className="font-mono">"{String(node.value)}"</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", depth > 0 && "ml-4")}>
      <span
        className={cn(
          "inline-block rounded border px-2 py-0.5 text-xs font-medium",
          logicColor[node.logic ?? "ALL"],
        )}
      >
        {node.logic} of:
      </span>
      <div className="space-y-1 pl-2">
        {node.children?.map((child, i) => (
          <ConditionTree key={i} node={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  )
}

// ── Action renderer ───────────────────────────────────────────────────────────

const actionTypeColor: Record<string, string> = {
  emit_event: "bg-blue-500/10 text-blue-500",
  notify: "bg-emerald-500/10 text-emerald-500",
  call_tool: "bg-purple-500/10 text-purple-500",
}

function ActionList({ actions }: { actions: RuleAction[] }) {
  return (
    <div className="space-y-1">
      {actions.map((action, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 shrink-0 text-muted-foreground tabular-nums">{i + 1}.</span>
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
              actionTypeColor[action.type],
            )}
          >
            {action.type}
          </span>
          <span>{action.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Cascade graph ─────────────────────────────────────────────────────────────

interface CascadeNodeData {
  label: string
  hits?: number
  isRoot?: boolean
  isEvent?: boolean
  [key: string]: unknown
}

function CascadeNode({ data }: { data: CascadeNodeData }) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div
        className={cn(
          "rounded-lg border-2 px-4 py-3 text-xs min-w-[140px]",
          data.isRoot
            ? "border-primary/50 bg-primary/5"
            : data.isEvent
              ? "border-dashed border-muted-foreground/50 bg-muted/30"
              : "border-emerald-500/40 bg-emerald-500/5",
        )}
      >
        <div className="font-medium">{data.label}</div>
        {data.hits !== undefined && (
          <div className="mt-0.5 text-muted-foreground">{data.hits} hits/24h</div>
        )}
        {data.isEvent && (
          <div className="mt-0.5 text-muted-foreground italic">emitted event</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </>
  )
}

const cascadeNodeTypes: NodeTypes = { cascadeNode: CascadeNode }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { addToast } = useDashboard()
  const rule = rules.find((r) => r.id === id)
  const [jsonView, setJsonView] = useState(false)
  const [activeTab, setActiveTab] = useState<"detail" | "chain">("detail")
  const [enabledLocal, setEnabledLocal] = useState<boolean | null>(null)

  const isEnabled = enabledLocal ?? rule?.enabled ?? false

  const cascadeRules = useMemo(() => {
    if (!rule) return []
    return rule.cascade_targets.map((tid) => rules.find((r) => r.id === tid)).filter(Boolean)
  }, [rule])

  const { cascadeNodes, cascadeEdges } = useMemo(() => {
    if (!rule) return { cascadeNodes: [], cascadeEdges: [] }

    const nodes: Node[] = [
      {
        id: "root",
        type: "cascadeNode",
        position: { x: 0, y: 100 },
        data: { label: rule.name, hits: rule.hits_24h, isRoot: true },
        draggable: false,
      },
    ]

    const edges: Edge[] = []

    if (rule.cascade_targets.length === 0) {
      return { cascadeNodes: nodes, cascadeEdges: [] }
    }

    // Emitted event node
    nodes.push({
      id: "evt",
      type: "cascadeNode",
      position: { x: 240, y: 100 },
      data: { label: "child event", isEvent: true },
      draggable: false,
    })
    edges.push({ id: "e-root-evt", source: "root", target: "evt", label: "emits", animated: true })

    rule.cascade_targets.forEach((tid, i) => {
      const target = rules.find((r) => r.id === tid)
      if (!target) return
      const nodeId = `target-${i}`
      nodes.push({
        id: nodeId,
        type: "cascadeNode",
        position: { x: 480, y: 60 + i * 120 },
        data: { label: target.name, hits: target.hits_24h },
        draggable: false,
      })
      edges.push({ id: `e-evt-${nodeId}`, source: "evt", target: nodeId, label: "matches", style: { strokeDasharray: "5,5" } })
    })

    return { cascadeNodes: nodes, cascadeEdges: edges }
  }, [rule])

  if (!rule) {
    return <div className="p-4 text-sm text-muted-foreground">Rule not found</div>
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/rules" className="hover:text-foreground transition-colors">Rules</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{rule.name}</span>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => addToast({ title: "Edit rule", description: "Rule editor coming soon", variant: "default" })}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant={isEnabled ? "outline" : "default"}
            onClick={() => {
              setEnabledLocal(!isEnabled)
              addToast({
                title: isEnabled ? "Rule disabled" : "Rule enabled",
                description: rule.name,
                variant: isEnabled ? "warning" : "success",
              })
            }}
          >
            {isEnabled ? "Disable" : "Enable"}
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div><span className="text-muted-foreground">Status:</span>{" "}<Badge variant={isEnabled ? "success" : "secondary"}>{isEnabled ? "enabled" : "disabled"}</Badge></div>
        <div><span className="text-muted-foreground">Hits (24h):</span> <span className="font-medium">{rule.hits_24h}</span></div>
        <div><span className="text-muted-foreground">Suppressed:</span> <span className="font-medium">{rule.suppressed_count}</span></div>
        <div><span className="text-muted-foreground">Last fired:</span> <span className="font-medium">{rule.last_fired ? new Date(rule.last_fired).toLocaleTimeString() : "never"}</span></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["detail", "chain"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "detail" ? "Rule Detail" : "Chain View"}
          </button>
        ))}
      </div>

      {activeTab === "detail" && (
        <>
          {/* Condition */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Condition</CardTitle>
              <Button size="xs" variant="outline" onClick={() => setJsonView(!jsonView)}>
                {jsonView ? "Tree view" : "JSON view"}
              </Button>
            </CardHeader>
            <CardContent>
              {jsonView ? (
                <pre className="rounded-md bg-muted p-3 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(rule.condition, null, 2)}
                </pre>
              ) : (
                <div className="space-y-1">
                  <ConditionTree node={rule.condition} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionList actions={rule.actions} />
            </CardContent>
          </Card>

          {/* Safety */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Safety</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Debounce:</span>{" "}
                <span className="font-medium">{rule.debounce_ms ? `${rule.debounce_ms}ms` : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dedupe window:</span>{" "}
                <span className="font-medium">{rule.dedupe_window_ms ? `${rule.dedupe_window_ms}ms` : "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quiet hours:</span>{" "}
                <span className="font-medium">
                  {rule.quiet_hours?.enabled
                    ? `${rule.quiet_hours.start} – ${rule.quiet_hours.end} (${rule.quiet_hours.timezone})`
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rule.recent_activity.length === 0 ? (
                <p className="px-4 py-4 text-xs text-muted-foreground">No activity yet</p>
              ) : (
                <div>
                  {rule.recent_activity.map((item, i) => (
                    <div
                      key={i}
                      className={cn("flex items-center gap-3 px-4 py-2 text-xs", i > 0 && "border-t")}
                    >
                      {item.outcome === "triggered" ? (
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      ) : (
                        <MinusCircle className="size-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-muted-foreground tabular-nums w-28 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant={item.outcome === "triggered" ? "success" : "secondary"}>
                        {item.outcome}
                      </Badge>
                      {item.suppression_reason && (
                        <span className="text-muted-foreground">({item.suppression_reason})</span>
                      )}
                      {item.trace_id && (
                        <Link
                          href={`/traces/${item.trace_id}`}
                          className="ml-auto font-mono text-primary hover:underline flex items-center gap-0.5"
                        >
                          {item.trace_id}
                          <ExternalLink className="size-2.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "chain" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rule Chain — Cascade Graph</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cascadeRules.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                This rule has no EmitEvent actions — no downstream cascade.
              </p>
            ) : (
              <div style={{ height: 300 }}>
                <ReactFlow
                  nodes={cascadeNodes}
                  edges={cascadeEdges}
                  nodeTypes={cascadeNodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.3 }}
                  panOnDrag
                  zoomOnScroll
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                >
                  <Background gap={16} size={1} />
                </ReactFlow>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
