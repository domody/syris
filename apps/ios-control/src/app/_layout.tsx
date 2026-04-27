import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { ThemeProvider as RestyleProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { darkTheme, lightTheme } from "@/theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const restyleTheme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <RestyleProvider theme={restyleTheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </RestyleProvider>
  );
}
