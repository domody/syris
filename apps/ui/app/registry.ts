// app/(design)/design-system/registry.ts

export type DemoCategory = "foundation" | "components" | "patterns"

export type DemoConfig = {
  name: string
  description: string
  category: DemoCategory
  slug: string
  /** Widen the demo cell — useful for tables, code blocks */
  fullWidth?: boolean
}

export const demoRegistry: Record<string, DemoConfig> = {
  // ── FOUNDATION ────────────────────────────────────────
  palette: {
    name: "Color Palette",
    description: "Accent scale, neutral zinc surfaces, semantic status colors.",
    category: "foundation",
    slug: "palette",
    fullWidth: true,
  },
  surfaces: {
    name: "Surface Model",
    description: "Six zinc depth levels. Nested container pattern.",
    category: "foundation",
    slug: "surfaces",
    fullWidth: true,
  },
  //   typography: {
  //     name: "Typography Scale",
  //     description: "Barlow Semi Condensed · Figtree · JetBrains Mono.",
  //     category: "foundation",
  //     slug: "typography",
  //     fullWidth: true,
  //   },

  //   // ── COMPONENTS ────────────────────────────────────────
  shadcn: {
    name: "Shadcn Demo",
    description: "Showcasing shadcn/ui components",
    category: "components",
    slug: "shadcn_demo",
    fullWidth: true,
  },
  //   button: {
  //     name: "Button",
  //     description: "Primary, secondary, ghost, outline, destructive, accent-outline. Sizes and states.",
  //     category: "components",
  //     slug: "button",
  //   },
  //   badge: {
  //     name: "Badge & Status",
  //     description: "Semantic status badges, label badges, autonomy level indicators.",
  //     category: "components",
  //     slug: "badge",
  //   },
  //   card: {
  //     name: "Cards & Panels",
  //     description: "Flat, raised, accent variants. Nested panel depth demo.",
  //     category: "components",
  //     slug: "card",
  //     fullWidth: true,
  //   },
  //   form: {
  //     name: "Form Elements",
  //     description: "Input, select, checkbox, toggle. Error and hint states.",
  //     category: "components",
  //     slug: "form",
  //     fullWidth: true,
  //   },

  //   // ── PATTERNS ──────────────────────────────────────────
  //   table: {
  //     name: "Data Table",
  //     description: "Audit event log. Sortable headers, status cells, action column.",
  //     category: "patterns",
  //     slug: "table",
  //     fullWidth: true,
  //   },
  //   alert: {
  //     name: "Alerts & Notifications",
  //     description: "Inline alerts and toast variants for all status states.",
  //     category: "patterns",
  //     slug: "alert",
  //   },
  //   code: {
  //     name: "Code Block",
  //     description: "Syntax-highlighted monospace surface for docs and CLI output.",
  //     category: "patterns",
  //     slug: "code",
  //     fullWidth: true,
  //   },
  //   status: {
  //     name: "Status Page",
  //     description: "Service health indicators, uptime bars, incident history.",
  //     category: "patterns",
  //     slug: "status",
  //   },
} satisfies Record<string, DemoConfig>

// Typed key union
export type DemoKey = keyof typeof demoRegistry

// Grouped for rendering
export const CATEGORY_META: Record<
  DemoCategory,
  { label: string; index: number }
> = {
  foundation: { label: "Foundation", index: 0 },
  components: { label: "Components", index: 1 },
  patterns: { label: "Patterns", index: 2 },
}

export function groupedDemos() {
  const groups = {} as Record<DemoCategory, Array<[string, DemoConfig]>>

  for (const [key, config] of Object.entries(demoRegistry)) {
    if (!groups[config.category]) groups[config.category] = []
    groups[config.category].push([key, config])
  }

  // Return in category order
  return Object.entries(CATEGORY_META)
    .sort(([, a], [, b]) => a.index - b.index)
    .map(([cat]) => ({
      category: cat as DemoCategory,
      label: CATEGORY_META[cat as DemoCategory].label,
      demos: groups[cat as DemoCategory] ?? [],
    }))
}
