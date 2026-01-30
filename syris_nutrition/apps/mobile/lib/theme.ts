import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

export const THEME = {
  light: {
    background: "#ffffff",
    foreground: "#09090b",

    card: "#ffffff",
    cardForeground: "#09090b",

    popover: "#ffffff",
    popoverForeground: "#09090b",

    primary: "#1447e6",
    primaryForeground: "#eff6ff",

    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",

    muted: "#f4f4f5",
    mutedForeground: "#71717b",

    accent: "#f4f4f5",
    accentForeground: "#18181b",

    destructive: "#e7000b",

    border: "#e4e4e7",
    input: "#e4e4e7",
    ring: "#9f9fa9",

    chart1: "#8ec5ff",
    chart2: "#2b7fff",
    chart3: "#155dfc",
    chart4: "#1447e6",
    chart5: "#193cb8",

    sidebar: "#fafafa",
    sidebarForeground: "#09090b",
    sidebarPrimary: "#155dfc",
    sidebarPrimaryForeground: "#eff6ff",
    sidebarAccent: "#f4f4f5",
    sidebarAccentForeground: "#18181b",
    sidebarBorder: "#e4e4e7",
    sidebarRing: "#9f9fa9",

    radius: 8, // dp
  },
  dark: {
    background: "#09090b",
    foreground: "#fafafa",

    card: "#18181b",
    cardForeground: "#fafafa",

    popover: "#18181b",
    popoverForeground: "#fafafa",

    primary: "#1f3fad",
    primaryForeground: "#eff6ff",

    secondary: "#27272a",
    secondaryForeground: "#fafafa",

    muted: "#27272a",
    mutedForeground: "#9f9fa9",

    accent: "#27272a",
    accentForeground: "#fafafa",

    destructive: "#ff6467",

    border: "rgba(255,255,255,0.10)",
    input: "rgba(255,255,255,0.15)",
    ring: "#71717b",

    chart1: "#8ec5ff",
    chart2: "#2b7fff",
    chart3: "#155dfc",
    chart4: "#1447e6",
    chart5: "#193cb8",

    sidebar: "#18181b",
    sidebarForeground: "#fafafa",
    sidebarPrimary: "#2b7fff",
    sidebarPrimaryForeground: "#eff6ff",
    sidebarAccent: "#27272a",
    sidebarAccentForeground: "#fafafa",
    sidebarBorder: "rgba(255,255,255,0.10)",
    sidebarRing: "#71717b",

    radius: 8,
  },
} as const;

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
