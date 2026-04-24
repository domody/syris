import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    surface: '#F0F0F3',
    border: '#E0E1E6',
    textPrimary: '#000000',
    accent: '#208AEF',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    surface: '#212225',
    border: '#2E3135',
    textPrimary: '#ffffff',
    accent: '#60A5FA',
    success: '#4ADE80',
    warning: '#FCD34D',
    error: '#F87171',
    info: '#60A5FA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// import { Platform } from 'react-native';

// export const Colors = {
//   light: {
//     text: '#ffffff',                        // --foreground (light)
//     background: 'oklch(1 0 0)',             // --background
//     backgroundElement: 'oklch(0.967 0.001 286.375)', // --muted / --secondary
//     backgroundSelected: 'oklch(0.92 0.004 286.32)',  // --border / --input
//     textSecondary: 'oklch(0.552 0.016 285.938)',     // --muted-foreground
//     surface: 'oklch(0.985 0 0)',            // --sidebar (light surface)
//     border: 'oklch(0.92 0.004 286.32)',     // --border
//     textPrimary: 'oklch(0.141 0.005 285.823)',       // --foreground
//     accent: 'oklch(0.6238 0.1499 251.76)', // --primary (SYRIS blue)
//     success: 'oklch(0.527 0.154 150.069)', // --success
//     warning: 'oklch(0.7618 0.163 72)',     // --warning
//     error: 'oklch(0.577 0.245 27.325)',    // --destructive
//     info: 'oklch(0.6238 0.1499 251.76)',   // --pending / --idle (same as primary)
//   },
//   dark: {
//     text: 'oklch(0.985 0 0)',              // --foreground
//     background: 'oklch(0.145 0 0)',        // --background
//     backgroundElement: 'oklch(0.205 0 0)', // --card
//     backgroundSelected: 'oklch(0.274 0.006 286.033)', // --secondary
//     textSecondary: 'oklch(0.708 0 0)',     // --muted-foreground
//     surface: 'oklch(0.269 0 0)',           // --muted / --accent
//     border: 'oklch(1 0 0 / 10%)',          // --border (translucent hairline)
//     textPrimary: 'oklch(0.985 0 0)',       // --foreground
//     accent: 'oklch(0.6238 0.1499 251.76)', // --primary
//     success: 'oklch(0.696 0.17 145.7)',   // --success
//     warning: 'oklch(0.773 0.168 72.2)',   // --warning
//     error: 'oklch(0.704 0.191 22.216)',   // --destructive
//     info: 'oklch(0.6238 0.1499 251.76)', // --pending / --idle
//   },
// } as const;

// export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// export const Fonts = Platform.select({
//   ios: {
//     sans: 'system-ui',
//     serif: 'ui-serif',
//     rounded: 'ui-rounded',
//     mono: 'ui-monospace',
//   },
//   default: {
//     sans: 'normal',
//     serif: 'serif',
//     rounded: 'normal',
//     mono: 'monospace',
//   },
//   web: {
//     sans: 'var(--font-display)',
//     serif: 'var(--font-serif)',
//     rounded: 'var(--font-rounded)',
//     mono: 'var(--font-mono)',
//   },
// });

// // Spacing mapped from SYRIS --space-* scale
// export const Spacing = {
//   half: 2,   // ~--space-1 (0.25rem)
//   one: 4,    // --space-1
//   two: 8,    // --space-2
//   three: 16, // --space-4
//   four: 24,  // --space-6
//   five: 32,  // --space-8
//   six: 64,   // --space-12 × 2
// } as const;

// export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// export const MaxContentWidth = 800;
