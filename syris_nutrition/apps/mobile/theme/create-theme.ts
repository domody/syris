import type { ThemeTokens, ThemeMode } from "./tokens";
import { makeRadius } from "./radius";

type ThemeColors = ThemeTokens["colors"];
type ThemeFonts = ThemeTokens["fonts"];

type CreateThemeInput = {
  mode: ThemeMode;
  colors: ThemeColors;
  radiusBase: number;
  fonts?: ThemeFonts;
};

export function createTheme(input: CreateThemeInput): ThemeTokens {
  return {
    mode: input.mode,
    colors: input.colors,
    radius: makeRadius(input.radiusBase),
    fonts: input.fonts,
  };
}
