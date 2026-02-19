import type { ThemeTokens } from "./tokens";
import { makeRadius } from "./radius";

const baseRadius = 7;

export const lightTheme: ThemeTokens = {
  mode: "light",
  colors: {
    background: "#FFFFFF",
    foreground: "#111827",

    card: "#FFFFFF",
    cardForeground: "#111827",

    popover: "#FFFFFF",
    popoverForeground: "#111827",

    primary: "#4F46E5",
    primaryForeground: "#F8FAFC",

    secondary: "#F3F4F6",
    secondaryForeground: "#111827",

    muted: "#F3F4F6",
    mutedForeground: "#6B7280",

    accent: "#F3F4F6",
    accentForeground: "#111827",

    destructive: "#EF4444",

    border: "#E5E7EB",
    input: "#E5E7EB",
    ring: "#9CA3AF",

    sidebar: "#FAFAFA",
    sidebarForeground: "#111827",
    sidebarPrimary: "#4338CA",
    sidebarPrimaryForeground: "#F8FAFC",
    sidebarAccent: "#F3F4F6",
    sidebarAccentForeground: "#111827",
    sidebarBorder: "#E5E7EB",
    sidebarRing: "#9CA3AF",

    chart1: "#93C5FD",
    chart2: "#3B82F6",
    chart3: "#2563EB",
    chart4: "#1D4ED8",
    chart5: "#1E40AF",
  },
  radius: makeRadius(baseRadius),
};

export const darkTheme: ThemeTokens = {
  mode: "dark",
  colors: {
    background: "#0B1220",
    foreground: "#FAFAFA",

    card: "#111827",
    cardForeground: "#FAFAFA",

    popover: "#111827",
    popoverForeground: "#FAFAFA",

    primary: "#4F46E5",
    primaryForeground: "#F8FAFC",

    secondary: "#1F2937",
    secondaryForeground: "#FAFAFA",

    muted: "#1F2937",
    mutedForeground: "#9CA3AF",

    accent: "#1F2937",
    accentForeground: "#FAFAFA",

    destructive: "#F87171",

    border: "rgba(255,255,255,0.10)",
    input: "rgba(255,255,255,0.15)",
    ring: "#6B7280",

    sidebar: "#111827",
    sidebarForeground: "#FAFAFA",
    sidebarPrimary: "#3B82F6",
    sidebarPrimaryForeground: "#F8FAFC",
    sidebarAccent: "#1F2937",
    sidebarAccentForeground: "#FAFAFA",
    sidebarBorder: "rgba(255,255,255,0.10)",
    sidebarRing: "#6B7280",

    chart1: "#93C5FD",
    chart2: "#3B82F6",
    chart3: "#2563EB",
    chart4: "#1D4ED8",
    chart5: "#1E40AF",
  },
  radius: makeRadius(baseRadius),
};
