import React from "react";
import { useColorScheme } from "react-native";
import type { ThemeTokens } from "@/theme/tokens";
import { light, dark } from "@/theme/presets";

const ThemeContext = React.createContext<ThemeTokens | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = React.useMemo(
    () => (scheme === "dark" ? dark : light),
    [scheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeTokens {
  const t = React.useContext(ThemeContext);
  if (!t) throw new Error("useTheme must be used within a ThemeProvider");
  return t;
}
