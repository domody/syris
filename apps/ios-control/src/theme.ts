import { createBox, createText, createTheme } from "@shopify/restyle";
import { Platform } from "react-native";

export const monoFont =
  Platform.select({ ios: "ui-monospace", default: "monospace" }) ?? "monospace";

const darkTheme = createTheme({
  colors: {
    // ── Semantic base ─────────────────────────────────────────────────────────
    background: "#000000",
    surface: "#212225",
    card: "#212225",
    border: "#2E3135",
    foreground: "#FFFFFF",
    muted: "#B0B4BA",
    accent: "#60A5FA",
    success: "#4ADE80",
    warning: "#FCD34D",
    error: "#F87171",
    info: "#60A5FA",

    // ── Absolute ─────────────────────────────────────────────────────────────
    white: "#FFFFFF",
    black: "#000000",

    // ── Blue opacity variants (accent, blue-400 dark / blue-500 light) ────────
    accentSubtle: "rgba(96,165,250,0.15)",
    accentSubtle20: "rgba(96,165,250,0.20)",
    accentSubtle40: "rgba(96,165,250,0.40)",

    // ── Yellow opacity variants (yellow-400 dark / yellow-500 light) ──────────
    warningSubtle: "rgba(250,204,21,0.15)",
    warningSubtle10: "rgba(250,204,21,0.10)",
    warningSubtle20: "rgba(250,204,21,0.20)",

    // ── Green opacity variants (green-400 dark / green-500 light) ─────────────
    successSubtle: "rgba(74,222,128,0.15)",
    successSubtle10: "rgba(74,222,128,0.10)",

    // ── Red opacity variants (red-400 dark / red-500 light) ───────────────────
    errorSubtle: "rgba(248,113,113,0.15)",
    errorSubtle10: "rgba(248,113,113,0.10)",

    // ── Zinc-derived backgrounds ──────────────────────────────────────────────
    elementBg: "#27272A", // zinc-800 dark / zinc-200 light
    elementBgSubtle: "#27272A", // zinc-800 dark / zinc-100 light (inbox info icon)
    codeBg: "#18181B", // zinc-900 dark / zinc-100 light

    // ── Badge backgrounds ─────────────────────────────────────────────────────
    badgeSuccessBg: "rgba(20,83,45,0.30)", // green-900/30
    badgeWarningBg: "rgba(113,63,18,0.30)", // yellow-900/30
    badgeErrorBg: "rgba(127,29,29,0.30)", // red-900/30
    badgeInfoBg: "rgba(30,58,138,0.30)", // blue-900/30
    badgeNeutralBg: "#3F3F46", // zinc-700

    // ── Text emphasis (darker in light / palette shade in dark) ──────────────
    successEmphasis: "#4ADE80", // green-400 = dark success
    errorEmphasis: "#F87171", // red-400 = dark error
    warningEmphasis: "#FACC15", // yellow-400
    accentEmphasis: "#60A5FA", // blue-400 = dark accent
    accentMid: "#60A5FA", // blue-400 = dark accent (blue-600 in light)
    warningMid: "#FACC15", // yellow-400 (yellow-600 in light)
    successMid: "#4ADE80", // green-400 (green-600 in light)
    badgeNeutralText: "#D4D4D8", // zinc-300

    // ── Status dot special cases ──────────────────────────────────────────────
    dotWarning: "#FACC15", // yellow-400 dark / yellow-500 light (≠ theme warning)
    dotNeutral: "#71717A", // zinc-500 dark / zinc-400 light (inverted, preserved)

    // ── Zinc text tokens ──────────────────────────────────────────────────────
    llmLaneText: "#D4D4D8", // zinc-300 dark / zinc-600 light
    separatorMuted: "#3F3F46", // zinc-700 dark / zinc-300 light (inverted bug, preserved)
    chipInactiveLabel: "#A1A1AA", // zinc-400 dark / zinc-500 light
    chipInactiveCount: "#52525B", // zinc-600 dark / zinc-400 light (inverted, preserved)
    chipActiveText: "#000000", // on foreground (white) bg in dark
    chipActiveCount: "rgba(0,0,0,0.70)",

    // ── Stage chip colors (dark) ──────────────────────────────────────────────
    stageNormalize: "#67E8F9",
    stageRoute: "#A5B4FC",
    stageExecute: "#86EFAC",
    stageToolCall: "#93C5FD",
    stageGate: "#FCD34D",
    stageOperator: "#FDA4AF",
    stageScheduler: "#6EE7B7",
    stageWatcher: "#BEF264",
    stageRule: "#FDBA74",
    stageMcp: "#7DD3FC",
    stageTask: "#C4B5FD",

    // ── Task detail ───────────────────────────────────────────────────────────
    failCardBorder: "rgba(248,113,113,0.35)",
    blockCardBorder: "rgba(250,204,21,0.38)",
    stageOperatorSubtle: "rgba(253,164,175,0.14)",
    accentSubtle06: "rgba(96,165,250,0.06)",
  },

  spacing: {
    0: 0,
    1: 1,
    2: 2,
    4: 4,
    5: 5,
    6: 6,
    8: 8,
    9: 9,
    10: 10,
    12: 12,
    13: 13,
    14: 14,
    16: 16,
    20: 20,
    22: 22,
    24: 24,
    28: 28,
    32: 32,
    40: 40,
    48: 48,
    56: 56,
    64: 64,
    72: 72,
    96: 96,
  },

  borderRadii: {
    none: 0,
    xs: 2, // rounded-sm
    sm: 4, // rounded / rounded-[4px]
    md: 8, // rounded-lg
    lg: 10, // rounded-[10px]
    xl: 12, // rounded-xl
    "2xl": 16, // rounded-2xl
    pill: 22, // rounded-[22px] input bar
    full: 9999,
  },

  textVariants: {
    defaults: {
      fontSize: 14,
      color: "foreground",
    },
    mono: {
      fontSize: 12,
      fontFamily: monoFont,
      color: "foreground",
    },
  },

  breakpoints: {},
});

export type Theme = typeof darkTheme;

export const lightTheme: Theme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,

    // ── Semantic base (light overrides) ───────────────────────────────────────
    background: "#FFFFFF",
    surface: "#F0F0F3",
    card: "#FFFFFF",
    border: "#E0E1E6",
    foreground: "#000000",
    muted: "#60646C",
    accent: "#208AEF",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",

    // ── Blue opacity variants (blue-500 light) ────────────────────────────────
    accentSubtle: "rgba(59,130,246,0.15)",
    accentSubtle20: "rgba(59,130,246,0.20)",
    accentSubtle40: "rgba(59,130,246,0.40)",

    // ── Yellow opacity variants (yellow-500 light) ────────────────────────────
    warningSubtle: "rgba(234,179,8,0.15)",
    warningSubtle10: "rgba(234,179,8,0.10)",
    warningSubtle20: "rgba(234,179,8,0.20)",

    // ── Green opacity variants (green-500 light) ──────────────────────────────
    successSubtle: "rgba(34,197,94,0.15)",
    successSubtle10: "rgba(34,197,94,0.10)",

    // ── Red opacity variants (red-500 light) ──────────────────────────────────
    errorSubtle: "rgba(239,68,68,0.15)",
    errorSubtle10: "rgba(239,68,68,0.10)",

    // ── Zinc-derived backgrounds (light) ─────────────────────────────────────
    elementBg: "#E4E4E7", // zinc-200
    elementBgSubtle: "#F4F4F5", // zinc-100
    codeBg: "#F4F4F5", // zinc-100

    // ── Badge backgrounds (light) ─────────────────────────────────────────────
    badgeSuccessBg: "#DCFCE7", // green-100
    badgeWarningBg: "#FEF9C3", // yellow-100
    badgeErrorBg: "#FEE2E2", // red-100
    badgeInfoBg: "#DBEAFE", // blue-100
    badgeNeutralBg: "#E4E4E7", // zinc-200

    // ── Text emphasis (light) ─────────────────────────────────────────────────
    successEmphasis: "#15803D", // green-700
    errorEmphasis: "#B91C1C", // red-700
    warningEmphasis: "#A16207", // yellow-700
    accentEmphasis: "#1D4ED8", // blue-700
    accentMid: "#2563EB", // blue-600
    warningMid: "#CA8A04", // yellow-600
    successMid: "#16A34A", // green-600
    badgeNeutralText: "#3F3F46", // zinc-700

    // ── Status dot special cases (light) ─────────────────────────────────────
    dotWarning: "#EAB308", // yellow-500
    dotNeutral: "#A1A1AA", // zinc-400 (inverted, preserved)

    // ── Zinc text tokens (light) ──────────────────────────────────────────────
    llmLaneText: "#52525B", // zinc-600
    separatorMuted: "#D4D4D8", // zinc-300 (inverted bug, preserved)
    chipInactiveLabel: "#71717A", // zinc-500
    chipInactiveCount: "#A1A1AA", // zinc-400 (inverted, preserved)
    chipActiveText: "#FFFFFF", // on foreground (black) bg in light
    chipActiveCount: "rgba(255,255,255,0.70)",

    // ── Stage chip colors (light) ─────────────────────────────────────────────
    stageNormalize: "#0891B2",
    stageRoute: "#4F46E5",
    stageExecute: "#16A34A",
    stageToolCall: "#2563EB",
    stageGate: "#D97706",
    stageOperator: "#E11D48",
    stageScheduler: "#059669",
    stageWatcher: "#65A30D",
    stageRule: "#EA580C",
    stageMcp: "#0284C7",
    stageTask: "#7C3AED",

    // ── Task detail (light) ───────────────────────────────────────────────────
    failCardBorder: "rgba(239,68,68,0.35)",
    blockCardBorder: "rgba(234,179,8,0.38)",
    stageOperatorSubtle: "rgba(225,29,72,0.14)",
    accentSubtle06: "rgba(59,130,246,0.06)",
  },
};

export { darkTheme };

export const Box = createBox<Theme>();
export const RestyleText = createText<Theme>();
