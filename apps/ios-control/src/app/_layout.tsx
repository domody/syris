import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { ThemeProvider as RestyleProvider } from "@shopify/restyle";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { CustomHeader } from "@/components/page-header";
import { darkTheme, lightTheme } from "@/theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const restyleTheme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <RestyleProvider theme={restyleTheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            options={{
              headerTransparent: true,
              header: ({ route }) => <CustomHeader title={route.name} />,
            }}
            name="(tabs)"
          />
          <Stack.Screen
            name="notifications/[id]"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{ headerShown: false }}
          />
        </Stack>
      </ThemeProvider>
    </RestyleProvider>
  );
}
