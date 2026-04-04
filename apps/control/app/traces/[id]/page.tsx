"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Download,
  Zap,
  Route,
  Wrench,
  Lock,
  GitBranch,
  Clock,
  CalendarClock,
  Circle,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@/lib/utils"
import { traceGraphs } from "@/src/mock/data"
import type { TraceNodeType, TraceNodeStatus } from "@/src/mock/types"

// ── Node config ───────────────────────────────────────────────────────────────

const nodeTypeConfig: Record<
  TraceNodeType,
  { icon: typeof Zap; label: string; border: string; bg: string; iconColor: string }
> = {
  ingest:      { icon: Download,    label: "Ingest",     border: "border-blue-500/50",    bg: "bg-blue-500/5",    iconColor: "text-blue-400" },
  normalize:   { icon: Circle,      label: "Normalize",  border: "border-cyan-500/40",    bg: "bg-cyan-500/5",    iconColor: "text-cyan-400" },
  route:       { icon: Route,       label: "Route",      border: "border-purple-500/50",  bg: "bg-purple-500/5",  iconColor: "text-purple-400" },
  rule:        { icon: GitBranch,   label: "Rule",       border: "border-pink-500/40",    bg: "bg-pink-500/5",    iconColor: "text-pink-400" },
  tool_call:   { icon: Wrench,      label: "Tool Call",  border: "border-emerald-500/50", bg: "bg-emerald-500/5", iconColor: "text-emerald-400" },
  task:        { icon: Clock,       label: "Task",       border: "border-violet-500/50",  bg: "bg-violet-500/5",  iconColor: "text-violet-400" },
  gate:        { icon: Lock,        label: "Gate",       border: "border-warning/50",     bg: "bg-warning/5",     iconColor: "text-warning" },
  child_event: { icon: Zap,         label: "Child Event",border: "border-dashed border-muted-foreground/40", bg: "bg-muted/20", iconColor: "text-muted-foreground" },
  schedule:    { icon: CalendarClock, label: "Schedule", border: "border-teal-500/40",   bg: "bg-teal-500/5",    iconColor: "text-teal-400" },
}

const statusBadge: Record<TraceNodeStatus, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  success: "success",
  failure: "destructive",
  pending: "warning",
  deduped: "secondary",
  info: "secondary",
}

// ── Trace node component ──────────────────────────────────────────────────────

interface TraceNodeData {
  label: string
  nodeType: TraceNodeType
  status: TraceNodeStatus
  detail: string | null
  latency_ms: number | null
  timestamp: string
  [key: string]: unknown
}

function TraceNodeCard({ data }: { data: TraceNodeData }) {
  const conf = nodeTypeConfig[data.nodeType]
  const Icon = conf.icon

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div
        className={cn(
          "rounded-lg border-2 px-3 py-2.5 min-w-[180px] max-w-[220px]",
          conf.border,
          conf.bg,
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn("size-3.5 shrink-0", conf.iconColor)} />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {conf.label}
          </span>
        </div>
        <div className="text-xs font-medium truncate">{data.label}</div>
        {data.detail && (
          <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{data.detail}</div>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant={statusBadge[data.status]}>{data.status}</Badge>
          {data.latency_ms !== null && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {data.latency_ms >= 1000 ? `${(data.latency_ms / 1000).toFixed(1)}s` : `${data.latency_ms}ms`}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </>
  )
}

const traceNodeTypes: NodeTypes = { traceNode: TraceNodeCard }

// ── Layout helper (tree layout) ───────────────────────────────────────────────

function buildLayout(graphNodes: TraceNodeData[], rawEdges: { source: string; target: string; type: string }[]) {
  const NODE_W = 220
  const NODE_H = 90
  const GAP_Y = 50
  const GAP_X = 60

  // Build adjacency
  const children: Record<string, string[]> = {}
  const parents: Record<string, string[]> = {}
  graphNodes.forEach((n) => { children[n.label] = []; parents[n.label] = [] })

  // Use node id from the raw data, which we'll pass separately
  return null // handled inline below
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TraceInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const trace = traceGraphs.find((t) => t.trace_id === id)

  const { nodes, edges } = useMemo(() => {
    if (!trace) return { nodes: [], edges: [] }

    const NODE_W = 220
    const NODE_H = 100
    const GAP_Y = 50
    const GAP_X = 80

    // Build parent map to determine x offset for branches
    const parentMap: Record<string, string[]> = {}
    const childMap: Record<string, string[]> = {}
    trace.nodes.forEach((n) => { parentMap[n.id] = []; childMap[n.id] = [] })
    trace.edges.forEach((e) => {
      childMap[e.source]?.push(e.target)
      parentMap[e.target]?.push(e.source)
    })

    // Topological sort via DFS
    const visited = new Set<string>()
    const order: string[] = []
    const nodeIndex: Record<string, number> = {}

    function visit(id: string) {
      if (visited.has(id)) return
      visited.add(id)
      ;(parentMap[id] ?? []).forEach(visit)
      order.push(id)
    }
    trace.nodes.forEach((n) => visit(n.id))
    order.forEach((id, i) => { nodeIndex[id] = i })

    // Assign positions — give branching nodes x offsets
    const xOffset: Record<string, number> = {}
    trace.nodes.forEach((n) => { xOffset[n.id] = 0 })

    // Track depth by counting longest path from root
    const depth: Record<string, number> = {}
    trace.nodes.forEach((n) => { depth[n.id] = 0 })
    // BFS from roots (no parents)
    const roots = trace.nodes.filter((n) => parentMap[n.id]?.length === 0)
    const queue = [...roots.map((n) => n.id)]
    while (queue.length) {
      const nid = queue.shift()!
      const children = childMap[nid] ?? []
      children.forEach((cid, i) => {
        depth[cid] = Math.max(depth[cid] ?? 0, (depth[nid] ?? 0) + 1)
        xOffset[cid] = i * (NODE_W + GAP_X)
        queue.push(cid)
      })
    }

    const rfNodes: Node[] = trace.nodes.map((n) => ({
      id: n.id,
      type: "traceNode",
      position: {
        x: xOffset[n.id] ?? 0,
        y: (depth[n.id] ?? 0) * (NODE_H + GAP_Y),
      },
      data: {
        label: n.label,
        nodeType: n.type,
        status: n.status,
        detail: n.detail,
        latency_ms: n.latency_ms,
        timestamp: n.timestamp,
      },
      draggable: false,
    }))

    const rfEdges: Edge[] = trace.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      style:
        e.type === "child"
          ? { strokeDasharray: "6,4", stroke: "var(--color-primary)" }
          : e.type === "approval"
            ? { strokeDasharray: "3,3", stroke: "var(--color-warning)" }
            : undefined,
      animated: e.type === "flow",
    }))

    return { nodes: rfNodes, edges: rfEdges }
  }, [trace])

  if (!trace) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Trace</span>
          <span>/</span>
          <span className="font-mono text-foreground">{id}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          No trace data found for{" "}
          <span className="font-mono">{id}</span>. This trace may have occurred before the retention window.
        </p>
        <Link href="/audit" className="text-xs text-primary hover:underline">
          ← Search in Audit Log
        </Link>
      </div>
    )
  }

  const graphHeight = Math.max(400, trace.nodes.length * 80 + 100)

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/audit" className="hover:text-foreground transition-colors">Audit Log</Link>
        <span>/</span>
        <span className="font-mono text-foreground">{trace.trace_id}</span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Trace ID:</span>{" "}
          <span className="font-mono font-medium">{trace.trace_id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Started:</span>{" "}
          <span className="font-medium">{new Date(trace.started_at).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Nodes:</span>{" "}
          <span className="font-medium">{trace.nodes.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Edges:</span>{" "}
          <span className="font-medium">{trace.edges.length}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span>Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 border-t border-foreground/60" />
          pipeline flow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 border-t border-dashed border-primary" />
          child event
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 border-t border-dashed border-warning" />
          approval
        </span>
      </div>

      {/* Pipeline DAG */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pipeline DAG</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div style={{ height: graphHeight }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={traceNodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              panOnDrag
              zoomOnScroll
              minZoom={0.3}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
            >
              <Background gap={16} size={1} />
              <MiniMap nodeStrokeWidth={3} zoomable pannable className="!bg-muted/30" />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Node timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trace.nodes.map((node, i) => {
            const conf = nodeTypeConfig[node.type]
            const Icon = conf.icon
            return (
              <div key={node.id} className={cn("flex items-start gap-3 px-4 py-2.5 text-xs", i > 0 && "border-t")}>
                <Icon className={cn("mt-0.5 size-3.5 shrink-0", conf.iconColor)} />
                <span className="w-28 shrink-0 font-mono text-muted-foreground tabular-nums">
                  {new Date(node.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 1,
                  })}
                </span>
                <span className="w-28 shrink-0 text-muted-foreground">{conf.label}</span>
                <span className="flex-1 font-medium">{node.label}</span>
                {node.detail && (
                  <span className="text-muted-foreground truncate max-w-[180px]">{node.detail}</span>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusBadge[node.status]}>{node.status}</Badge>
                  {node.latency_ms !== null && (
                    <span className="text-muted-foreground tabular-nums">
                      {node.latency_ms >= 1000 ? `${(node.latency_ms / 1000).toFixed(1)}s` : `${node.latency_ms}ms`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
