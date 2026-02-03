import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "var(--background)",
        },
        headerShadowVisible: false,
        headerTintColor: "var(--foreground)",
        headerTitle: "Today",
        headerTitleStyle: {
          fontFamily: "var(--font-mono)"
        }
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
