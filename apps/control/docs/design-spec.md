# SYRIS Dashboard — Mission Control Design Specification

## System Understanding

SYRIS is a single-user, always-on automation and orchestration control plane. It ingests stimuli from multiple channels, normalises them into `MessageEvent`s, routes them deterministically through a three-lane pipeline (fast/task/gated), and executes actions through a capability-gated tool runtime — with every stage traceable end-to-end via `trace_id` and append-only audit events.

The dashboard is the operator's window into all of this. Its job is to answer "what is it doing and why?" at every level of zoom — from a glance at system health down to a single tool call's idempotency outcome. Every page below maps directly to an API surface or projection table that already exists in the SYRIS backend.

---

## Global Navigation & Shell

### Primary Sidebar (always visible, collapsible to icon-only)

The sidebar is the structural spine. It is always present on the left edge and collapses to a narrow icon rail on smaller viewports or by user toggle. The ordering follows the operator's mental model: status first, then the things that need attention, then the things you configure, then the deep inspection tools.

```
┌─────────────────────────────────────┐
│ ◆ SYRIS          [A2] [●  healthy] │  ← Logo, current autonomy badge, system status dot
│─────────────────────────────────────│
│                                     │
│  ◎  Overview                        │  ← Home / mission control
│  ⚡ Live Feed                       │  ← Real-time event stream
│                                     │
│  ── OPERATOR ──────────────────     │
│  ⏳ Approvals            (3)        │  ← Badge = pending count
│  🔔 Alarms               (1)        │  ← Badge = open count
│                                     │
│  ── WORKLOADS ─────────────────     │
│  📋 Tasks                           │
│  📅 Schedules                       │
│  👁 Watchers                        │
│  ⚙  Rules                           │
│                                     │
│  ── SYSTEM ────────────────────     │
│  🔌 Integrations                    │
│  📜 Audit Log                       │
│  🔍 Trace Inspector                 │
│                                     │
│  ── BOTTOM ────────────────────     │
│  ⚙  Settings                        │  ← Pinned to bottom
│                                     │
└─────────────────────────────────────┘
```

**Reasoning:** The sidebar groups by operator urgency. "Approvals" and "Alarms" sit directly below the home page because they represent things that need human action right now — they are the operator's inbox. Workloads are the things SYRIS is doing. System pages are for inspection and debugging. Settings is anchored to the bottom because it's infrequently used.

### Top Bar (contextual, per-page)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [← breadcrumb]   Page Title                          [⏸ Pause] [⌘K]│
└──────────────────────────────────────────────────────────────────────┘
```

The top bar shows breadcrumbs for drill-down pages (e.g., `Tasks > task-abc123`), the page title, and two persistent controls: the pipeline pause/resume toggle (always visible — the most critical operator control) and a command palette trigger (`⌘K`). The command palette provides keyboard-driven access to any page, any task by ID, any trace by ID, and quick actions like changing autonomy level.

### Notification Toast Layer

System-pushed notifications (new alarm, approval expiring, task failed) appear as toasts in the bottom-right. Clicking a toast navigates to the relevant entity. Toasts are driven by the SSE `/stream/events` endpoint.

---

## Page 1: Overview (Mission Control)

**Route:** `/`  
**Reachable from:** Sidebar (always), logo click  
**Reasoning:** This is the page the operator sees when they wake up and open the dashboard. It must answer, in under 5 seconds: "Is everything OK? What needs my attention? What is SYRIS doing right now?"

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SYSTEM STATUS STRIP                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Status   │ │ Autonomy │ │ Uptime   │ │ Pipeline │ │ Last     │     │
│  │ ● healthy│ │ A2       │ │ 14d 6h   │ │ ▶ active │ │ heartbeat│     │
│  │          │ │ [change] │ │          │ │ [pause]  │ │ 4s ago   │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                                         │
│  ┌─── NEEDS ATTENTION ─────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Pending Approvals (3)              Open Alarms (1)             │   │
│  │  ┌────────────────────────┐         ┌────────────────────────┐  │   │
│  │  │ 🟡 Send weekly digest  │         │ 🔴 Integration auth    │  │   │
│  │  │    expires in 12m      │         │    ha_mqtt: 3 consec.  │  │   │
│  │  │    [Approve] [Deny]    │         │    errors              │  │   │
│  │  ├────────────────────────┤         │    [Ack] [View]        │  │   │
│  │  │ 🟡 Delete old backups  │         └────────────────────────┘  │   │
│  │  │    expires in 1h 4m    │                                     │   │
│  │  │    [Approve] [Deny]    │         Failed Tasks (2)            │   │
│  │  ├────────────────────────┤         ┌────────────────────────┐  │   │
│  │  │ 🟡 Post to Slack #gen  │         │ ✖ deploy-preview       │  │   │
│  │  │    expires in 45m      │         │   step 3/5 · retries 0 │  │   │
│  │  │    [Approve] [Deny]    │         │   [Retry] [View]       │  │   │
│  │  └────────────────────────┘         ├────────────────────────┤  │   │
│  │                                     │ ✖ sync-calendar        │  │   │
│  │                                     │   step 1/2 · retries 3 │  │   │
│  │                                     │   [View]               │  │   │
│  │                                     └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── ACTIVITY ─────────────┐  ┌─── WORKLOAD SUMMARY ──────────────┐   │
│  │                          │  │                                    │   │
│  │  Event throughput        │  │  Running tasks .......... 4       │   │
│  │  (sparkline, last 1h)    │  │  Paused tasks ........... 1       │   │
│  │  ▁▂▃▅▇█▇▅▃▂▃▅▇▅▃▁▁▂▃   │  │  Pending approvals ...... 3       │   │
│  │                          │  │  Active schedules ....... 12      │   │
│  │  Events today: 1,247     │  │  Active watchers ........ 5       │   │
│  │  Tool calls today: 89    │  │  Active rules ........... 18      │   │
│  │  Fast/Task/Gated: 82/5/2 │  │  Healthy integrations ... 6/7    │   │
│  │                          │  │                                    │   │
│  └──────────────────────────┘  └────────────────────────────────────┘   │
│                                                                         │
│  ┌─── RECENT AUDIT (last 10) ──────────────────────────────────────┐   │
│  │  12:04:31  tool_call.succeeded   ha_light · turn_on · bedroom   │   │
│  │  12:04:30  routing.decided       fast · trace:abc123            │   │
│  │  12:04:30  event.ingested        ha_event · sensor_1            │   │
│  │  12:04:12  schedule.fired        daily-digest                   │   │
│  │  12:03:58  rule.triggered        motion-lights                  │   │
│  │  ...                                          [View full log →] │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Autonomy badge** → click opens a dropdown to change level (A0–A4) with a confirmation dialog explaining what changes at the new level. Emits `operator.action.autonomy_changed`.
- **Pipeline pause/resume** → toggle button; pausing shows a pulsing amber bar across the top of the entire shell ("Pipeline paused — all processing halted") until resumed.
- **Approval cards** → `[Approve]` / `[Deny]` are inline actions. Clicking `[Approve]` shows a confirmation popover with the serialised payload (`what` field from the Approval record) so the operator knows exactly what will execute. Clicking the card title navigates to the full Approval detail.
- **Alarm cards** → `[Ack]` is inline. `[View]` navigates to the Alarm detail within the Alarms page.
- **Failed task cards** → `[Retry]` triggers `POST /tasks/{id}/retry`. `[View]` navigates to the Task detail page.
- **Recent audit rows** → clicking any row opens the Trace Inspector for that `trace_id`.
- **Workload summary counts** → each count is a link to the corresponding filtered list page (e.g., clicking "Running tasks: 4" navigates to `/tasks?status=running`).

### Data Sources

Reads from: `GET /health`, `GET /state`, `GET /approvals?status=pending`, `GET /alarms?status=open`, `GET /tasks?status=failed`, `GET /audit?limit=10`, plus the SSE stream for live updates.

---

## Page 2: Live Feed

**Route:** `/feed`  
**Reachable from:** Sidebar  
**Reasoning:** The overview tells you the summary; the live feed shows you the raw pulse. This is the "tail -f" equivalent — a real-time chronological stream of everything happening in the system. It exists because SYRIS's core design principle is "APIs for everything > check logs", and this is the visual equivalent.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Live Feed                                              [⏸ Auto-scroll]│
│                                                                         │
│  ┌─── FILTERS ──────────────────────────────────────────────────────┐  │
│  │ Channel: [All ▾]  Type: [All ▾]  Lane: [All ▾]  Search: [____] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── STREAM ───────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  TIME        TYPE                 SUMMARY                  LANE  │  │
│  │  ─────────── ──────────────────── ──────────────────────── ───── │  │
│  │  12:04:31.4  tool_call.succeeded  ha_light·turn_on·bedroom fast  │  │
│  │  12:04:30.9  routing.decided      fast lane · intent:light  fast  │  │
│  │  12:04:30.1  event.ingested       ha_event · sensor_1       —    │  │
│  │  12:04:12.0  schedule.fired       daily-digest              task  │  │
│  │  12:04:11.8  task.step_started    digest-task · step 1/3    task  │  │
│  │  12:03:58.2  rule.triggered       motion-lights             fast  │  │
│  │  12:03:58.0  event.ingested       ha_event · motion_1       —    │  │
│  │  12:03:45.1  gate.required        delete-old-backups        gated │  │
│  │  12:03:12.0  watcher.tick         heartbeat · ok            —    │  │
│  │  12:02:55.7  tool_call.deduped    ha_light·turn_on (cached) fast  │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Row click** → opens the Trace Inspector as a **right-side drawer** (slide-in panel, ~40% width). The drawer shows the full trace graph for that event's `trace_id` without leaving the feed. Clicking "Open full trace" in the drawer navigates to the dedicated Trace Inspector page.
- **Type badges** → colour-coded by category: green for success, amber for gates/warnings, red for failures, grey for informational.
- **Lane column** → colour-coded: blue=fast, purple=task, amber=gated.
- **Filter bar** → all filters are combinable. Channel filter lists all active inbound adapters. Type filter groups by audit event category. Lane filter is fast/task/gated.
- **Auto-scroll toggle** → when enabled, new events push into the top and the view follows. Scrolling manually pauses auto-scroll (shows a "↓ Jump to latest" floating button).

### Data Source

SSE stream from `/stream/events` for real-time, backfilled from `GET /audit` on page load.

---

## Page 3: Approvals

**Route:** `/approvals`  
**Reachable from:** Sidebar (with pending count badge), Overview action cards  
**Reasoning:** Approvals are the operator's primary interaction point with SYRIS's safety model. Every gated action creates an Approval with a full serialised payload, expiry, and trace link. This page must make reviewing and actioning approvals as fast as possible — it's the "inbox" pattern.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Approvals                                                              │
│                                                                         │
│  ┌─── TABS ─────────────────────────────────────────────────────────┐  │
│  │  [Pending (3)]  [Approved]  [Denied]  [Expired]                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── PENDING LIST ─────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ Send weekly digest to #general                              │ │  │
│  │  │ Risk: MEDIUM  │  Gate: A2 + medium → CONFIRM                │ │  │
│  │  │ Requested: 12:04:12  │  Expires: 12:16:12 (11m remaining)  │ │  │
│  │  │ Trace: abc-123  │  Task: digest-task                        │ │  │
│  │  │                                                             │ │  │
│  │  │ ┌─── PAYLOAD PREVIEW ────────────────────────────────────┐ │ │  │
│  │  │ │ tool: slack_post                                        │ │ │  │
│  │  │ │ action: send_message                                    │ │ │  │
│  │  │ │ channel: #general                                       │ │ │  │
│  │  │ │ message: "Weekly digest: 847 events processed..."       │ │ │  │
│  │  │ └────────────────────────────────────────────────────────┘ │ │  │
│  │  │                                                             │ │  │
│  │  │               [✓ Approve]  [✗ Deny]  [🔍 Full Trace]       │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ Delete old backup snapshots                                 │ │  │
│  │  │ Risk: HIGH  │  Gate: A2 + high → CONFIRM                   │ │  │
│  │  │ ...                                                         │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Approve** → confirmation dialog showing the exact `what` payload. "You are approving execution of this action. This cannot be undone." Confirm triggers `POST /approvals/{id}/approve`.
- **Deny** → opens a small modal with an optional reason text field. Triggers `POST /approvals/{id}/deny`.
- **Full Trace** → navigates to the Trace Inspector page for the approval's `trace_id`.
- **Payload preview** → collapsed by default, expandable inline. Shows the serialised tool call that will execute on approval. This is critical for the operator to verify "no surprises".
- **Expiry countdown** → live countdown timer. Turns red when < 5 minutes remaining. When expired, the card moves to the Expired tab and shows whether it was auto-retried or auto-failed per configuration.
- **Tabs** → standard tab navigation. Approved/Denied/Expired tabs show historical approvals for audit purposes.

---

## Page 4: Alarms

**Route:** `/alarms`  
**Reachable from:** Sidebar (with open count badge), Overview alarm cards  
**Reasoning:** Alarms are persisted entities with a lifecycle (open → acked → resolved). They represent conditions that need human awareness. This page tracks them through their lifecycle, distinct from the ephemeral toast notifications.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Alarms                                                                 │
│                                                                         │
│  ┌─── TABS ─────────────────────────────────────────────────────────┐  │
│  │  [Open (1)]  [Acknowledged]  [Resolved]                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── ALARM LIST ───────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  SEVERITY  TRIGGER              DETAIL                 SINCE     │  │
│  │  ───────── ──────────────────── ──────────────────── ────────── │  │
│  │  🔴 error  integration_auth     ha_mqtt: 3 consec.    42m ago   │  │
│  │            failed               errors; last: conn                │  │
│  │                                 refused                           │  │
│  │                                 [Ack]  [Resolve]  [→ Integration]│  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Ack** → inline, single click. Changes state to `acked`. Emits audit event.
- **Resolve** → opens a small modal with optional resolution note. Emits audit event.
- **→ Integration** → deep-links to the relevant entity. For a "stuck task" alarm, links to the task. For "integration auth failed", links to the integration detail. This cross-linking is context-dependent based on the alarm's `trigger_type`.
- **Alarm detail** → clicking the alarm row expands an inline detail panel showing the full alarm record: `dedupe_key`, creation time, all state transitions with timestamps, and related audit events.

---

## Page 5: Tasks

**Route:** `/tasks`  
**Reachable from:** Sidebar, Overview workload counts  
**Reasoning:** Tasks are multi-step checkpointed workflows — the most complex execution unit in SYRIS. The operator needs to see what's running, what's stuck, and drill into any task to understand its step-by-step progression, including approval waits.

### Layout — List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Tasks                                                                  │
│                                                                         │
│  ┌─── FILTER BAR ───────────────────────────────────────────────────┐  │
│  │ Status: [All ▾]  Since: [Last 24h ▾]  Search: [_______________] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── TASK LIST ────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  STATUS    TASK NAME           PROGRESS   STARTED      ACTIONS   │  │
│  │  ───────── ─────────────────── ────────── ──────────── ───────── │  │
│  │  ▶ running deploy-preview      ██░░░ 3/5  12m ago      [⏸][✗]   │  │
│  │  ▶ running daily-digest        █░░░░ 1/3  2m ago       [⏸][✗]   │  │
│  │  ▶ running sync-contacts       ████░ 4/5  1h ago       [⏸][✗]   │  │
│  │  ▶ running backup-db           ██░░░ 2/4  45m ago      [⏸][✗]   │  │
│  │  ⏸ paused  cleanup-stale       █░░░░ 1/3  2h ago       [▶][✗]   │  │
│  │  ✖ failed  sync-calendar       █░░░░ 1/2  3h ago       [↻]      │  │
│  │  ✖ failed  deploy-preview      ███░░ 3/5  5h ago       [↻]      │  │
│  │  ✓ success weekly-report       █████ 5/5  6h ago       —        │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layout — Task Detail (drill-down)

**Route:** `/tasks/:id`  
**Reachable from:** Clicking any task row

This is a **graph/node view** — the first place where a visual flow layout is naturally justified. Each step is a node. Edges show progression. Approval waits are visually distinct gate nodes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Tasks  /  deploy-preview                     [⏸ Pause] [✗ Cancel]  │
│                                                                         │
│  Status: running  │  Step: 3/5  │  Trace: abc-123  │  Started: 12m ago │
│                                                                         │
│  ┌─── STEP FLOW (graph/node view) ─────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ┌───────────┐     ┌───────────┐     ┌───────────────────┐      │   │
│  │  │ 1. Clone  │────▶│ 2. Build  │────▶│ 3. Run tests      │      │   │
│  │  │ ✓ 4s      │     │ ✓ 32s     │     │ ▶ running (14s)   │      │   │
│  │  │           │     │           │     │ attempt 1/3       │      │   │
│  │  └───────────┘     └───────────┘     └─────────┬─────────┘      │   │
│  │                                                 │                │   │
│  │                                                 ▼                │   │
│  │                                       ┌─────────────────┐       │   │
│  │                                       │ 🔒 4. Gate:     │       │   │
│  │                                       │ Deploy to prod  │       │   │
│  │                                       │ ○ pending       │       │   │
│  │                                       │ risk: HIGH      │       │   │
│  │                                       └────────┬────────┘       │   │
│  │                                                │                │   │
│  │                                                ▼                │   │
│  │                                       ┌───────────────┐         │   │
│  │                                       │ 5. Deploy     │         │   │
│  │                                       │ ○ pending     │         │   │
│  │                                       └───────────────┘         │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─── SELECTED STEP DETAIL ─────────────────────────────────────────┐  │
│  │  (click any node above to see detail here)                        │  │
│  │                                                                   │  │
│  │  Step 3: Run tests                                                │  │
│  │  Status: running  │  Attempt: 1/3  │  Started: 14s ago           │  │
│  │  Idempotency key: sha256(task-abc+step-3+1+run_tests+...)       │  │
│  │                                                                   │  │
│  │  Tool call: test_runner · run_suite                               │  │
│  │  Request: { "suite": "integration", "timeout": 300 }            │  │
│  │                                                                   │  │
│  │  Audit trail for this step:                                       │  │
│  │    12:04:18  task.step_started   attempt 1                        │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why a graph/node view here

Tasks are inherently sequential-with-branching workflows. The graph makes the mental model physical: you see exactly where execution is, what has passed, what's gated, and what's pending. Gate nodes (approval-wait steps) are visually distinct — a locked icon, a different border colour — so the operator immediately sees "this task is blocked waiting for me". Retry loops show as self-referencing edges on a step node (attempt count visible). Failed steps show as red-bordered nodes with the error summary.

### Interactions

- **Click a step node** → populates the "Selected Step Detail" panel below the graph with that step's full data: status, attempt count, idempotency key, tool call request/response, and audit trail scoped to that step.
- **Gate nodes** → if the gate is pending, the node shows `[Approve]` / `[Deny]` buttons directly on it. This avoids forcing the operator to navigate to the Approvals page to unblock a task.
- **Pause/Cancel** → top-right actions. Pause marks the current step as paused. Cancel abandons the task. Both require confirmation.
- **Retry** → shown only for failed tasks. Triggers `POST /tasks/{id}/retry` from the last checkpoint.
- **Trace link** → navigates to the Trace Inspector for the task's originating `trace_id`.

---

## Page 6: Trace Inspector

**Route:** `/traces/:trace_id`  
**Reachable from:** Clicking any `trace_id` link anywhere in the dashboard, the Live Feed drawer, the `⌘K` command palette ("Go to trace...")  
**Reasoning:** This is the debugging power tool. SYRIS's core promise is that every stimulus is traceable end-to-end via `trace_id`. The Trace Inspector visualises the complete lifecycle of a single event as a **directed acyclic graph** — from ingest through routing, execution, tool calls, task steps, and child events.

### Layout — Full Graph View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Trace Inspector  │  trace: abc-123                                     │
│                                                                         │
│  ┌─── TRACE GRAPH ──────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │   ┌──────────────┐                                                │  │
│  │   │ INGEST       │                                                │  │
│  │   │ ha_event     │                                                │  │
│  │   │ sensor_1     │                                                │  │
│  │   │ 12:04:30.1   │                                                │  │
│  │   └──────┬───────┘                                                │  │
│  │          │                                                        │  │
│  │          ▼                                                        │  │
│  │   ┌──────────────┐                                                │  │
│  │   │ NORMALIZE    │                                                │  │
│  │   │ dedupe: pass │                                                │  │
│  │   │ 0.8ms        │                                                │  │
│  │   └──────┬───────┘                                                │  │
│  │          │                                                        │  │
│  │          ▼                                                        │  │
│  │   ┌──────────────┐                                                │  │
│  │   │ ROUTE        │                                                │  │
│  │   │ method: rule │──────────────────┐                             │  │
│  │   │ rule: motion │                  │                             │  │
│  │   │ lane: fast   │                  │ rule also triggered         │  │
│  │   └──────┬───────┘                  │ child event                 │  │
│  │          │                          ▼                             │  │
│  │          │                   ┌──────────────┐                     │  │
│  │          │                   │ CHILD EVENT  │                     │  │
│  │          │                   │ notify: push │                     │  │
│  │          │                   │ "Motion in   │                     │  │
│  │          │                   │  bedroom"    │                     │  │
│  │          │                   └──────┬───────┘                     │  │
│  │          │                          │                             │  │
│  │          ▼                          ▼                             │  │
│  │   ┌──────────────┐          ┌──────────────┐                     │  │
│  │   │ TOOL CALL    │          │ TOOL CALL    │                     │  │
│  │   │ ha_light     │          │ push_notify  │                     │  │
│  │   │ turn_on      │          │ send         │                     │  │
│  │   │ ✓ 120ms      │          │ ✓ 340ms      │                     │  │
│  │   └──────────────┘          └──────────────┘                     │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── SELECTED NODE DETAIL ─────────────────────────────────────────┐  │
│  │  (click any node to inspect)                                      │  │
│  │                                                                   │  │
│  │  TOOL CALL: ha_light · turn_on                                    │  │
│  │  Status: succeeded  │  Duration: 120ms  │  Idempotency: new      │  │
│  │  Risk: LOW  │  Gate: ALLOW (A2 + low)                            │  │
│  │                                                                   │  │
│  │  Request:  { "device": "bedroom_light", "state": "on" }         │  │
│  │  Response: { "previous": "off", "current": "on" }               │  │
│  │                                                                   │  │
│  │  Audit events:                                                    │  │
│  │    12:04:31.2  tool_call.attempted                                │  │
│  │    12:04:31.4  tool_call.succeeded                                │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why a graph/node view here

This is the single most justified use of a graph layout in the entire dashboard. A trace represents a causal chain: one event caused a routing decision, which caused tool execution, which may have spawned child events, which went through their own pipeline. This is a DAG by definition. Rendering it as a flat list would destroy the branching structure — you'd lose the fact that one routing decision spawned two parallel paths. The graph makes causal relationships visible at a glance.

Nodes are coloured by stage: blue for ingest/normalize, purple for routing, green for successful execution, red for failures, amber for gates. Edges are directional and labelled with the relationship type (e.g., "routed to fast lane", "rule emitted child event", "approval granted → resumed").

### Interactions

- **Click any node** → populates the detail panel below with the full record for that stage. For a tool call node, this shows request/response, idempotency outcome, risk/gate decision. For a routing node, this shows which method resolved (fast-path DSL, rule match, or LLM fallback) and why.
- **Hover on an edge** → tooltip shows the transition: latency between stages, any data transformation.
- **Zoom/Pan** → the graph is pannable and zoomable for complex traces with many branches (e.g., a task with 10 steps that each made tool calls).
- **Timeline toggle** → button to switch from graph view to a flat chronological timeline view of all audit events for the trace, for cases where linear ordering is more useful than causal structure.

---

## Page 7: Schedules

**Route:** `/schedules`  
**Reachable from:** Sidebar  
**Reasoning:** Schedules are persistent, durable timers. The operator needs to see what's due, what fired, what was missed during downtime, and be able to enable/disable them. This is a management table, not a monitoring view.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Schedules                                                [+ Create]    │
│                                                                         │
│  ┌─── SCHEDULE LIST ────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ENABLED  NAME              TYPE      SPEC          NEXT RUN     │  │
│  │  ──────── ───────────────── ───────── ──────────── ──────────── │  │
│  │  [✓]      daily-digest     cron      0 9 * * 1-5  tomorrow 09:00│  │
│  │  [✓]      backup-db        interval  3600s        in 42m        │  │
│  │  [✓]      weekly-report    cron      0 17 * * 5   Fri 17:00    │  │
│  │  [✓]      sensor-poll      interval  30s          in 18s        │  │
│  │  [ ]      cleanup-stale    cron      0 3 * * *    (disabled)    │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Enable/disable toggle** → inline checkbox. Triggers `PATCH /schedules/{id}`. Disabling shows a brief "disabled" toast.
- **Click a schedule row** → opens an **inline expandable panel** below the row (not a new page) showing: full spec, catch-up policy, quiet hours policy, last 5 firing audit events, missed-run count, and the `MessageEvent` template payload that gets emitted.
- **Create** → opens a dialog/modal for schedule creation with fields for name, type (cron/interval/one_shot), spec, catch-up policy, quiet hours, and payload template.
- **"Next run" column** → shows relative time ("in 42m"), with absolute time on hover tooltip. For one-shot schedules that have fired, shows "completed" with the fire time.

---

## Page 8: Watchers

**Route:** `/watchers`  
**Reachable from:** Sidebar  
**Reasoning:** Watchers are proactive polling components. The operator needs to see their health (consecutive errors), tick cadence, last outcome, and suppression state. Similar management pattern to schedules.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Watchers                                                               │
│                                                                         │
│  ┌─── WATCHER LIST ─────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ENABLED  NAME            INTERVAL  LAST TICK    OUTCOME  ERRORS │  │
│  │  ──────── ─────────────── ───────── ──────────── ──────── ────── │  │
│  │  [✓]      heartbeat      30s       4s ago       ok       0      │  │
│  │  [✓]      inbox-poll     60s       22s ago      ok       0      │  │
│  │  [✓]      ha-state       10s       3s ago       ok       0      │  │
│  │  [✓]      github-pr      300s      2m ago       ok       0      │  │
│  │  [ ]      stale-checker  600s      (disabled)   —        0      │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Enable/disable** → inline toggle. Triggers `PATCH /watchers/{id}`.
- **Row click** → expands an inline detail panel showing: `WatcherState` (dedupe window contents, suppression count, consecutive errors), the last 10 tick audit events, and the watcher's configuration (tick interval, throttle settings).
- **Errors column** → turns red if `consecutive_errors > 0`. Shows the count as a badge. Clicking the badge jumps to the related alarm if one was raised.

---

## Page 9: Rules

**Route:** `/rules`  
**Reachable from:** Sidebar  
**Reasoning:** Rules are IFTTT-style condition → action mappings that run on every event. The operator needs to see what's active, how often rules fire, why they get suppressed, and inspect/edit their conditions. The condition DSL is JSON-based, so a structured viewer is more useful than raw JSON.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Rules                                                     [+ Create]   │
│                                                                         │
│  ┌─── RULE LIST ────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ENABLED  NAME              HITS (24h)  LAST FIRED   SUPPRESSED  │  │
│  │  ──────── ───────────────── ────────── ──────────── ──────────  │  │
│  │  [✓]      motion-lights    47          2m ago       3 (debounce)│  │
│  │  [✓]      door-notify      12          1h ago       0           │  │
│  │  [✓]      temp-alert       2           6h ago       1 (quiet)   │  │
│  │  [ ]      test-rule        0           never        0           │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Rule Detail (drill-down)

**Route:** `/rules/:id`  
**Reachable from:** Clicking a rule row

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Rules  /  motion-lights                           [Edit] [Disable]  │
│                                                                         │
│  ┌─── CONDITION TREE (structured view) ─────────────────────────────┐  │
│  │                                                                   │  │
│  │  ALL of:                                                          │  │
│  │   ├── source.channel  =  "ha_event"                              │  │
│  │   ├── content.structured.device_id  =  "motion_sensor_1"        │  │
│  │   └── content.structured.state  =  "on"                         │  │
│  │                                                                   │  │
│  │  [Toggle: JSON view]                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── ACTIONS ──────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  1. EmitEvent → ha_light · turn_on · bedroom_light               │  │
│  │  2. Notify → push · "Motion detected in bedroom"                 │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── SAFETY ───────────────────────────────────────────────────────┐  │
│  │  Debounce: 5000ms  │  Dedupe window: 30000ms  │  Quiet hours: — │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── RECENT ACTIVITY (last 20 firings) ────────────────────────────┐  │
│  │  12:03:58  triggered  → trace abc-123                             │  │
│  │  12:03:42  suppressed (debounce)                                  │  │
│  │  12:03:40  triggered  → trace def-456                             │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why a graph/node view here — Rule Chain Visualization

When a rule's action is `EmitEvent`, that child event re-enters the pipeline and may match other rules. This creates rule chains. On the Rule Detail page, there is a **"Chain View" tab** that shows this as a graph:

```
  ┌───────────────┐     emits event     ┌───────────────┐
  │ motion-lights │────────────────────▶│ (child event) │
  │ rule          │                     │ ha_light·on   │
  └───────────────┘                     └───────┬───────┘
                                                │ matches
                                                ▼
                                        ┌───────────────┐     emits event
                                        │ light-notify  │────────────────▶ ...
                                        │ rule          │
                                        └───────────────┘
```

This helps the operator understand cascading automation and spot unintended loops (which the debounce/dedupe safety mechanisms prevent, but the visual makes the chain legible).

### Interactions

- **Condition tree** → toggleable between structured tree view and raw JSON. In tree view, each condition node is colour-coded by operator type.
- **Edit** → opens a form-based editor for conditions and actions. Conditions use a builder UI (field selector + operator dropdown + value input). Actions use a typed form per action type.
- **Recent activity rows** → clicking a triggered row navigates to the Trace Inspector.

---

## Page 10: Integrations

**Route:** `/integrations`  
**Reachable from:** Sidebar  
**Reasoning:** Integrations are the system's connection points to the outside world — inbound adapters, outbound tools, MCP providers. The operator needs to see health, auth status, error rates, and rate limit state at a glance.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Integrations                                                           │
│                                                                         │
│  ┌─── INTEGRATION CARDS (grid) ─────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │  │
│  │  │ ● Home Asst.    │  │ ● Slack         │  │ ● GitHub        │  │  │
│  │  │ ha_mqtt         │  │ slack_api       │  │ github_api      │  │  │
│  │  │ healthy         │  │ healthy         │  │ healthy         │  │  │
│  │  │ Last ok: 3s ago │  │ Last ok: 1m ago │  │ Last ok: 5m ago │  │  │
│  │  │ Errors: 0       │  │ Errors: 0       │  │ Errors: 0       │  │  │
│  │  │ [Disable]       │  │ [Disable]       │  │ [Disable]       │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │  │
│  │  │ ● Push Notify   │  │ ● Calendar      │  │ ● MCP: n8n      │  │  │
│  │  │ push_api        │  │ gcal_api        │  │ mcp_n8n         │  │  │
│  │  │ healthy         │  │ degraded        │  │ healthy         │  │  │
│  │  │ Last ok: 12s    │  │ Auth exp: 2d    │  │ Last ok: 30s    │  │  │
│  │  │ Errors: 0       │  │ Errors: 1       │  │ Errors: 0       │  │  │
│  │  │ [Disable]       │  │ [Disable]       │  │ [Disable]       │  │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration Detail (drill-down)

**Route:** `/integrations/:id`  
**Reachable from:** Clicking an integration card

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Integrations  /  Home Assistant (ha_mqtt)             [Disable]      │
│                                                                         │
│  ┌─── HEALTH ───────────────────────────────────────────────────────┐  │
│  │  Status: healthy  │  Consecutive errors: 0  │  Last ok: 3s ago  │  │
│  │  Rate limit: 45/100 (resets in 15m)                              │  │
│  │  Auth: valid  │  Expires: never (API key)                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── CAPABILITIES ─────────────────────────────────────────────────┐  │
│  │  Tools: ha_light, ha_switch, ha_climate, ha_sensor_read          │  │
│  │  Scopes: device.read, device.write, scene.activate               │  │
│  │  Provider type: native                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── TOOL CALL HISTORY (last 50) ──────────────────────────────────┐  │
│  │  12:04:31  ha_light·turn_on     ✓ 120ms    trace: abc-123       │  │
│  │  12:02:55  ha_light·turn_on     ↩ deduped  trace: ghi-789       │  │
│  │  12:01:12  ha_sensor·read       ✓ 45ms     trace: jkl-012       │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Status dot** → colour-coded: green=healthy, amber=degraded, red=unavailable. Degraded cards have an amber border. Unavailable cards are greyed out.
- **Disable** → triggers `PATCH /integrations/{id}` with `enabled: false`. Shows confirmation.
- **Auth expiry warning** → if auth is within the warning window, the card shows a yellow "Auth expires in 2d" notice. Clicking it navigates to the related alarm.
- **Tool call history rows** → clicking navigates to the Trace Inspector.

---

## Page 11: Audit Log

**Route:** `/audit`  
**Reachable from:** Sidebar, "View full log" link on Overview  
**Reasoning:** The audit log is the append-only ground truth. This page provides the full searchable, filterable table of every `AuditEvent` ever emitted. It's the fallback when the specialised views don't answer the question.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Audit Log                                                              │
│                                                                         │
│  ┌─── FILTER BAR ───────────────────────────────────────────────────┐  │
│  │ Type: [All ▾]  Tool: [All ▾]  Outcome: [All ▾]                  │  │
│  │ Trace ID: [___________]  Since: [24h ▾]  Search: [____________] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── EVENT TABLE ──────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  TIME          TYPE                  OUTCOME  TRACE     DETAIL   │  │
│  │  ───────────── ───────────────────── ──────── ───────── ──────── │  │
│  │  12:04:31.412  tool_call.succeeded   ok       abc-123   ha_light │  │
│  │  12:04:30.932  routing.decided       ok       abc-123   fast     │  │
│  │  12:04:30.124  event.ingested        ok       abc-123   ha_event │  │
│  │  12:04:12.001  schedule.fired        ok       mno-345   digest   │  │
│  │  12:03:58.210  rule.triggered        ok       abc-123   motion   │  │
│  │  12:03:58.009  event.ingested        ok       abc-123   ha_event │  │
│  │  12:03:45.102  gate.required         pending  pqr-678   delete   │  │
│  │  12:03:12.000  watcher.tick          ok       —         hbeat    │  │
│  │  ...                                                              │  │
│  │                                   [← Previous]  Page 1  [Next →] │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Trace ID column** → clickable, navigates to Trace Inspector.
- **Row click** → opens a right-side drawer with the full `AuditEvent` record: all fields, associated `ref_task_id`, `ref_tool_call_id`, and a link to the redacted payload artifact if one exists (`GET /artifacts/{payload_ref}`).
- **Filter combination** → all filters are AND-combined and reflected in the URL query string for shareability.
- **Trace ID filter** → typing a partial trace ID into the filter narrows results. This is the manual equivalent of the Trace Inspector but in table form.

---

## Page 12: Settings

**Route:** `/settings`  
**Reachable from:** Sidebar (pinned to bottom)  
**Reasoning:** Configuration that changes infrequently: autonomy level (also changeable from the Overview), quiet hours windows, notification thresholds, anti-flap cooldowns, and pipeline operational parameters.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Settings                                                               │
│                                                                         │
│  ┌─── AUTONOMY ─────────────────────────────────────────────────────┐  │
│  │  Current level: A2 (Scoped autonomy)                    [Change] │  │
│  │                                                                   │  │
│  │  Level history:                                                   │  │
│  │    Apr 01 09:00  A2  ←  A1  (operator: manual)                   │  │
│  │    Mar 28 22:00  A1  ←  A2  (operator: manual)                   │  │
│  │    Mar 28 14:00  A2  ←  A0  (operator: initial setup)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── SAFETY POLICIES ──────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Quiet hours:  22:00 – 07:00 Europe/London         [Edit]        │  │
│  │  Anti-flap cooldown:  30s                          [Edit]        │  │
│  │  Max notifications/hour:  20                       [Edit]        │  │
│  │  Approval default expiry:  15m                     [Edit]        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── PIPELINE ─────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Task engine poll interval:  1s                    [Edit]        │  │
│  │  Scheduler poll interval:  5s                      [Edit]        │  │
│  │  Dedup window:  60s                                [Edit]        │  │
│  │  Rule eval timeout:  10ms                          [Edit]        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactions

- **Change autonomy** → same dialog as the Overview badge: select level, confirmation with explanation of what changes.
- **Edit policy values** → inline edit fields. Each change requires confirmation and emits an `operator.action.*` audit event.
- **Autonomy history** → read from `proj_autonomy_history`. Shows every change with timestamp, before/after, and actor.

---

## Graph/Node View Summary

Three places use graph/node layouts, each for a different structural reason:

### 1. Task Detail — Step Flow Graph

**What it shows:** The sequential/branching progression of steps within a single task.  
**Why a graph:** Steps are a state machine with branches (retry loops, approval waits, conditional paths). A linear list loses the gate-blocking and retry-loop structure. The graph makes "this task is stuck at step 4 waiting for approval" immediately legible.  
**Node types:** Step (with status colouring), Gate (lock icon, distinct border), Terminal (success/fail).  
**Edge types:** Progression (solid arrow), Retry (curved self-loop with attempt count), Approval wait (dashed arrow to gate node).

### 2. Trace Inspector — Pipeline DAG

**What it shows:** The full causal chain of a single `trace_id` across all pipeline stages.  
**Why a graph:** A trace is literally a directed acyclic graph. One event can spawn child events via rules, each child enters its own pipeline path, and tool calls branch out in parallel. A flat chronological list cannot represent the branching causality. This is the most natural graph in the system.  
**Node types:** Ingest, Normalize, Route, Tool Call, Task, Gate, Child Event.  
**Edge types:** Pipeline flow (solid), Child event emission (dashed), Approval link (dotted).

### 3. Rule Chain View — Cascade Graph

**What it shows:** How a rule's `EmitEvent` action creates child events that may trigger further rules.  
**Why a graph:** Rule chains are a potential source of unintended cascades. Making the chain visible as a graph helps the operator understand "if rule A fires, what happens downstream?" without mentally simulating the pipeline. It surfaces emergent behaviour that isn't obvious from looking at individual rules.  
**Node types:** Rule (with hit count), Emitted Event, Downstream Rule.  
**Edge types:** "Emits event" (solid), "Matches" (dashed).

---

## Navigation Summary Table

| Page               | Route               | Sidebar         | Badge         | Also reachable from                                                   |
| ------------------ | ------------------- | --------------- | ------------- | --------------------------------------------------------------------- |
| Overview           | `/`                 | ✓               | —             | Logo click                                                            |
| Live Feed          | `/feed`             | ✓               | —             | —                                                                     |
| Approvals          | `/approvals`        | ✓               | Pending count | Overview approval cards                                               |
| Alarms             | `/alarms`           | ✓               | Open count    | Overview alarm cards, watcher error badges, integration auth warnings |
| Tasks              | `/tasks`            | ✓               | —             | Overview workload counts, approval trace links                        |
| Task Detail        | `/tasks/:id`        | —               | —             | Task list row click, gate nodes, alarm "stuck task" links             |
| Schedules          | `/schedules`        | ✓               | —             | —                                                                     |
| Watchers           | `/watchers`         | ✓               | —             | —                                                                     |
| Rules              | `/rules`            | ✓               | —             | —                                                                     |
| Rule Detail        | `/rules/:id`        | —               | —             | Rule list row click                                                   |
| Integrations       | `/integrations`     | ✓               | —             | Alarm cross-links                                                     |
| Integration Detail | `/integrations/:id` | —               | —             | Integration card click                                                |
| Audit Log          | `/audit`            | ✓               | —             | Overview "View full log" link                                         |
| Trace Inspector    | `/traces/:id`       | ✓ (empty state) | —             | Any `trace_id` link, Live Feed drawer, `⌘K` palette                   |
| Settings           | `/settings`         | ✓               | —             | —                                                                     |

**Detail pages** (Task Detail, Rule Detail, Integration Detail) are not in the sidebar — they are drill-downs from their parent list. This keeps the sidebar focused on top-level navigation. The Trace Inspector has a sidebar entry but shows an empty state with a search box when no trace is selected; it's primarily entered via trace links elsewhere.

---

## Interaction Pattern Summary

| Pattern                 | Used on                                                    | Behaviour                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline expandable panel | Schedules, Watchers                                        | Clicking a row expands a detail section below it. No page navigation. Good for entities with moderate detail.                                         |
| Drill-down page         | Tasks, Rules, Integrations                                 | Clicking navigates to `/entity/:id`. Used for complex entities that need their own layout (graph views, history tables).                              |
| Right-side drawer       | Live Feed (trace preview), Audit Log (event detail)        | A slide-in panel occupying ~40% of the viewport. Lets you inspect without losing context of the list. Dismissable.                                    |
| Inline actions          | Approvals, Alarms, Tasks                                   | Buttons directly on list rows or cards for common actions (Approve, Deny, Ack, Pause, Cancel). Reduces clicks for the most frequent operator actions. |
| Confirmation dialog     | Approve, Cancel task, Change autonomy, Disable integration | Modal dialog requiring explicit confirmation for destructive or consequential actions. Shows what will happen.                                        |
| Command palette (`⌘K`)  | Global                                                     | Keyboard-driven search across all entities. "Go to trace abc-123", "Change autonomy to A1", "View task deploy-preview". Power-user shortcut.          |
| Toast notifications     | Global                                                     | SSE-driven alerts for new alarms, expiring approvals, failed tasks. Bottom-right. Clickable to navigate.                                              |
| Graph/node canvas       | Task Detail, Trace Inspector, Rule Chain View              | Interactive node graph with click-to-inspect, zoom/pan, and status colouring. Used only where the data is structurally a graph.                       |

---

## Design Rationale Summary

Every page maps to a real API surface or projection table. There are no decorative pages. The hierarchy follows operator urgency: the things that need human action (approvals, alarms) are prominent and badged; the things the operator configures (rules, schedules, watchers) are accessible but don't compete for attention; the deep inspection tools (audit log, trace inspector) are available but don't clutter the primary view.

Graph views are used in exactly three places where the underlying data is structurally a graph — not as decoration, but because flattening the data into a table would destroy information that the operator needs (causal branching, step progression with gates, rule cascades). Everywhere else, tables and cards are the right primitive.

The dashboard is a single-user control plane UI. There is no collaboration, no multi-tenant concerns, no user management. Every action emits an audit event with `actor = operator`, so the audit trail is complete even though there's only one user.

#