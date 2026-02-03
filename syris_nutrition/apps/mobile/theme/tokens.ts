export type ThemeMode = "light" | "dark";

export type ThemeTokens = {
  mode: ThemeMode;

  colors: {
    background: string;
    foreground: string;

    card: string;
    cardForeground: string;

    popover: string;
    popoverForeground: string;

    primary: string;
    primaryForeground: string;

    secondary: string;
    secondaryForeground: string;

    muted: string;
    mutedForeground: string;

    accent: string;
    accentForeground: string;

    destructive: string;

    border: string;
    input: string;
    ring: string;

    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;

    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
  };

  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
  };

  fonts?: {
    sans?: string;
    mono?: string;
  };
};
