# ADR 0003 — Memory Architecture for Persistent Conversational Continuity

**Status:** Accepted  
**Date:** 2026-04-09  
**Supersedes:** Milestone 6 `thread_id` scoping model

---

## Context

SYRIS is not a chatbot. It is a persistent, always-on entity that a user addresses at any time, the way one might speak to a person who simply exists and is always available. There are no discrete sessions, no conversation threads with start and end points, no notion of logging in. Every time the user speaks, they are speaking to the same entity — which must carry a coherent, continuous model of who the user is, what has happened, and what matters.

The current Milestone 6 design scopes conversation history to a `thread_id` attached to each `MessageEvent`. This is a chatbot pattern and is architecturally wrong for SYRIS. A thread implies a conversation has a beginning and an end. SYRIS has neither. The `thread_id` concept is removed by this ADR and replaced with a layered memory system.

The naive alternative — storing every message ever sent and injecting the full history on each turn — is also wrong, for two reasons. The practical reason is token budget and latency. The deeper reason is that this treats SYRIS as a chatbot with a long memory, which it is not. A person who has known you for five years does not carry a transcript. They carry a _model of you_. That is what SYRIS must maintain.

---

## Decision

SYRIS will implement a **Layered Memory Architecture built as event log projections**, combining the structural model of three temporal memory tiers (Architecture 1) with the storage and derivation model of event-derived projections (Architecture 3), augmented by a significance scoring system and an anchor primitive (Architecture 4).

Memory is not a separate concern bolted onto the system. It is a set of materialized projections over SYRIS's existing event store, derived and maintained by background workers, consumed by the context builder at inference time. Every memory artifact is traceable to source events. Nothing is ever silently overwritten.

---

## Architecture

### Conceptual Model

Memory operates across three temporal tiers, each with different fidelity, storage, and lifecycle:

```
┌─────────────────────────────────────────────────────┐
│  SEMANTIC FACTS          [permanent, structured]     │
│  User preferences, explicit instructions,            │
│  durable known entities, recurring patterns          │
├─────────────────────────────────────────────────────┤
│  EPISODIC DIGESTS        [compressed, timestamped]   │
│  Distilled records of what happened in a given       │
│  window — decisions, outcomes, topics, tone          │
├─────────────────────────────────────────────────────┤
│  WORKING BUFFER          [raw, recency-gated]        │
│  Last N message_events verbatim — the live           │
│  thread of whatever is currently being discussed     │
└─────────────────────────────────────────────────────┘
```

A fourth cross-cutting concept — **anchors** — pins specific facts or exchanges as permanently present regardless of age or tier. Anchors are how explicit user instructions ("always notify me before sending emails"), strong stated preferences, and high-significance moments survive indefinitely without relying on compression fidelity.

---

### Data Model

The following tables are added to the SYRIS schema. All are append-only or insert-only where possible to preserve auditability.

#### Additions to `message_events`

```sql
ALTER TABLE message_events ADD COLUMN significance_score   FLOAT    DEFAULT 0.0;
ALTER TABLE message_events ADD COLUMN significance_tags    JSONB    DEFAULT '[]';
ALTER TABLE message_events ADD COLUMN is_anchor            BOOLEAN  DEFAULT FALSE;
ALTER TABLE message_events ADD COLUMN anchor_reason        TEXT;
ALTER TABLE message_events ADD COLUMN memory_processed_at  TIMESTAMPTZ;
```

`significance_score` is set at ingest time by a rules-based classifier (see below). `memory_processed_at` is set by the episodic worker once an event has been included in a digest, signalling it no longer needs to enter future digest windows.

#### `memory_episodes`

Compressed prose records of time-bounded exchange windows, produced by the episodic worker.

```sql
CREATE TABLE memory_episodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    covers_from     TIMESTAMPTZ NOT NULL,
    covers_to       TIMESTAMPTZ NOT NULL,
    content         TEXT NOT NULL,         -- LLM-distilled prose
    topics          JSONB DEFAULT '[]',    -- extracted topic tags
    tools_invoked   JSONB DEFAULT '[]',    -- tool names referenced in window
    outcome_summary TEXT,                  -- key decisions or outcomes
    source_event_ids JSONB NOT NULL,       -- array of message_event IDs covered
    event_count     INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `memory_facts`

Durable, structured facts extracted from episodic records by the semantic worker. These form the permanent model of the user.

```sql
CREATE TABLE memory_facts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        TEXT NOT NULL,  -- 'preference' | 'instruction' | 'entity' | 'pattern'
    key             TEXT NOT NULL,
    value           TEXT NOT NULL,
    confidence      FLOAT DEFAULT 1.0,
    is_anchor       BOOLEAN DEFAULT FALSE,
    source_episode_id UUID REFERENCES memory_episodes(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    superseded_by   UUID REFERENCES memory_facts(id)  -- for updates, not deletes
);
```

Facts are never deleted. When a fact becomes stale or is corrected, a new record is created and the old one's `superseded_by` is set. The current fact for any key is `WHERE superseded_by IS NULL`.

---

### Background Workers

Two background workers run on independent schedules, entirely decoupled from the request path. Neither affects response latency.

#### `memory/episodic_worker.py`

**Trigger:** Runs on a configurable interval (default: every 15 minutes) or when unprocessed `message_events` older than the working buffer window exceed a count threshold (default: 20 events).

**Logic:**

1. Query `message_events WHERE memory_processed_at IS NULL AND created_at < (now() - working_buffer_window)`, ordered by `created_at`.
2. Group into windows of configurable size (default: 10–20 events, or a time boundary).
3. For each window, call the LLM with a compression prompt (see Prompt Design below).
4. Write the result as a `memory_episodes` record, with `source_event_ids` set.
5. Mark all covered events `memory_processed_at = now()`.
6. Write a `memory.episode_created` audit event.

High-significance events (`significance_score >= threshold`) are included verbatim in the compression prompt regardless of age, to prevent important context from being compressed away.

#### `memory/semantic_worker.py`

**Trigger:** Runs on a slower cadence (default: every 4 hours) or when the count of unprocessed `memory_episodes` exceeds a threshold.

**Logic:**

1. Query `memory_episodes` not yet processed for semantic extraction.
2. For each episode, call the LLM with a fact extraction prompt (see Prompt Design below).
3. For each returned fact, check if a matching `memory_facts` record exists (by `category + key`). If yes, create a superseding record. If no, insert fresh.
4. Write a `memory.facts_updated` audit event with a diff summary.

---

### Significance Scoring

Applied at ingest time in `normaliser.py`, before the event is written. Rules-based only — no LLM call at this stage.

**Scoring rules (additive):**

| Condition                                                                                          | Score delta |
| -------------------------------------------------------------------------------------------------- | ----------- |
| Message contains explicit preference marker ("always", "never", "I prefer", "I hate", "make sure") | +0.4        |
| Message contains explicit instruction to the system                                                | +0.5        |
| Response involved a tool invocation                                                                | +0.2        |
| Response resulted in an approval gate                                                              | +0.3        |
| Message references a named entity (person, service, device)                                        | +0.1        |
| Message or response contains a decision outcome                                                    | +0.3        |
| Routine/short exchange (< 20 tokens, no tool, no preference)                                       | -0.1        |

Score is clamped to [0.0, 1.0]. Events scoring >= 0.7 are candidates for auto-anchoring (subject to a confirmation step or a configurable threshold). The scoring rules live in `memory/significance.py` as an explicit, auditable table — not embedded logic.

---

### Anchor Primitive

Any `message_event` or `memory_facts` record can be anchored. Anchored items are always included in the context bundle, regardless of age, tier, or token pressure.

Anchoring occurs in three ways:

1. **Auto-anchor at ingest** — significance score >= configurable threshold (default: 0.85).
2. **Semantic worker anchor** — when the semantic worker extracts a fact of category `instruction` or `preference` with high confidence, it sets `is_anchor = TRUE` on the fact.
3. **Explicit user anchor** — "SYRIS, remember this" or equivalent intent triggers an anchor write via a fastpath intent `memory.anchor` (registered in a later milestone once this layer is stable).

---

### Context Bundle

`llm/context.py` builds the following bundle on every LLM call, in order. Each section has an explicit token budget enforced before assembly.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SYSTEM CONTEXT                                           │
│    SYRIS identity, role, personality, constraints           │
│    Current autonomy level, active tool registry             │
├─────────────────────────────────────────────────────────────┤
│ 2. SEMANTIC FACTS                (all, categorised)         │
│    All non-superseded memory_facts records                  │
│    Framed as: "What you know about the user and the world"  │
├─────────────────────────────────────────────────────────────┤
│ 3. ANCHORED EVENTS               (all, regardless of age)   │
│    message_events WHERE is_anchor = TRUE                    │
│    Ordered by significance_score DESC                       │
├─────────────────────────────────────────────────────────────┤
│ 4. RECENT EPISODES               (last 3–5 digests)         │
│    memory_episodes ordered by covers_to DESC, LIMIT 5       │
│    Framed as: "What has happened recently"                  │
├─────────────────────────────────────────────────────────────┤
│ 5. WORKING BUFFER                (last N raw exchanges)     │
│    message_events WHERE memory_processed_at IS NULL         │
│    ORDER BY created_at DESC, LIMIT 10 (configurable)        │
│    Framed as: "The current exchange"                        │
├─────────────────────────────────────────────────────────────┤
│ 6. CURRENT SYSTEM STATE          (runtime context)          │
│    Active tasks, pending approvals, recent tool outcomes    │
├─────────────────────────────────────────────────────────────┤
│ 7. CURRENT MESSAGE                                          │
└─────────────────────────────────────────────────────────────┘
```

If the assembled bundle exceeds the token budget, sections are trimmed in reverse order: system state first, then episodic digests (reduce from 5 to 3 to 1), then working buffer (reduce from 10 to 6). Semantic facts and anchored events are never trimmed.

The bundle is constructed as a structured object in `llm/context.py`, not as a raw string. The LLM call in `llm/provider.py` serialises it into the prompt. This separation means the context shape is inspectable before serialisation, which is what powers the debug endpoint.

---

### Prompt Design

The prompts that drive the memory workers must be carefully framed. They must not produce summaries of conversations — they must produce distillations of _experience_.

**Episodic compression prompt (guiding intent):**

> You are maintaining the experiential memory of a persistent AI system. You are not summarising a conversation. You are distilling what happened — what was discussed, what was decided, what was learned, what mattered, and what the texture of this exchange revealed about the user. Write in the third person, past tense, from the perspective of the system reflecting on what occurred. Be concrete and specific. Preserve decisions, preferences, instructions, and outcomes. Discard conversational noise.

**Semantic fact extraction prompt (guiding intent):**

> From this episodic record, extract any durable facts about the user — their preferences, instructions they have given, entities that matter to them, and patterns in how they communicate or what they care about. Return a JSON array of facts. Each fact has: category (preference | instruction | entity | pattern), key (short identifier), value (the fact itself, in plain language), confidence (0.0–1.0). Do not infer things that were not stated or strongly implied. If nothing durable was revealed, return an empty array.

Both prompts are version-controlled in `llm/prompts.py` with named versions so changes are traceable.

---

### Module Layout

```
syris/
├── memory/
│   ├── __init__.py
│   ├── significance.py       # Ingest-time significance scoring rules
│   ├── episodic_worker.py    # Compresses aged events into memory_episodes
│   ├── semantic_worker.py    # Extracts memory_facts from memory_episodes
│   ├── anchor.py             # Anchor write logic (used by worker + fastpath)
│   └── context_builder.py   # Assembles context bundle (called by llm/context.py)
├── llm/
│   ├── context.py            # Entry point: calls context_builder, returns bundle
│   ├── prompts.py            # All prompt templates including memory worker prompts
│   └── provider.py           # CompletionProvider interface (unchanged)
```

`llm/context.py` remains the single entry point for callers. The memory internals are opaque to the pipeline.

---

### Debug Endpoint

`GET /llm/context?trace_id=X` returns the fully decomposed context bundle that was (or would be) passed to the LLM for the given trace:

```json
{
  "trace_id": "...",
  "bundle": {
    "semantic_facts": [...],
    "anchored_events": [...],
    "recent_episodes": [...],
    "working_buffer": [...],
    "system_state": {...},
    "token_estimate": 1842,
    "budget_used_pct": 61.4
  }
}
```

This endpoint is the primary tool for debugging memory quality and verifying that the system is surfacing the right context for any given exchange.

---

## What Changes in Milestone 6

1. **Remove `thread_id` from `MessageEvent`.** The field is dropped. There are no threads. Every message is an event in a single, continuous stream.
2. **Add significance scoring to `normaliser.py`.** Every inbound `MessageEvent` is scored before write.
3. **Add `significance_score`, `significance_tags`, `is_anchor`, `anchor_reason`, `memory_processed_at` columns** to `message_events` via a new Alembic migration.
4. **Create `memory_episodes` and `memory_facts` tables** via the same migration.
5. **Implement `memory/` module** as described above. Workers can be run as background asyncio tasks within the monolith for now (consistent with existing scheduler/watcher pattern).
6. **Implement `memory/context_builder.py`** and wire it into the existing `llm/context.py`.
7. **Update `GET /llm/context?trace_id=X`** to return the full decomposed bundle.

The Milestone 6 done-when criterion becomes: send two related messages with a gap between them sufficient for episodic compression to run. Verify via `/llm/context` that the second call's bundle contains an episodic digest referencing the first exchange. Semantic facts table is populated after a preference is stated. Anchored event appears in bundle regardless of age.

---

## What is Deferred

- **Living State Document (Architecture 2)** — philosophically compelling but operationally fragile and incompatible with traceability requirements at this stage. Revisit once the layered system is stable and the semantic facts store has been proven reliable. A living state document could eventually be _generated from_ the semantic facts layer, rather than being the primary store.
- **Multi-device / concurrent session isolation** — when this becomes necessary, `device_id` can be added to `message_events` and the working buffer query scoped accordingly, without changing anything else in the memory architecture.
- **User-facing anchor management** — `memory.anchor` fastpath intent, ability to query and remove anchors. Deferred until post-Milestone 6.
- **LLM-assisted significance scoring** — current rules-based scorer is sufficient. LLM-assisted scoring adds cost and latency at ingest. Revisit if the rules-based approach proves inadequate.

---

## Tradeoffs Accepted

| Tradeoff                                             | Rationale                                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Episodic compression is lossy                        | Accepted. Mitigated by significance scoring (high-value events survive compression), the anchor primitive, and the working buffer (recent exchanges are always raw).                             |
| Background workers add operational complexity        | Accepted. Both workers are low-risk background jobs with no impact on response latency. They follow the same task/worker pattern already established in the system.                              |
| Semantic fact extraction can produce incorrect facts | Accepted. Mitigated by the `confidence` field, the `superseded_by` chain (facts are never destroyed), and the auditability of source episodes. Incorrect facts can be identified and superseded. |
| Context bundle shape has multiple moving parts       | Accepted. Mitigated by the strict assembly order, explicit token budget enforcement, and the debug endpoint. The context is always inspectable.                                                  |

---

## Related

- [Milestone 6: LLM conversation quality](https://docs.syris.uk/docs/dev/milestones#milestone-6-llm-conversation-quality)