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
        headerTitleStyle: {
          fontFamily: "var(--font-mono)",
        },
        // headerTitle: "Today"
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="scan/barcode"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="product/[barcode]"
        options={{
          headerShown: true,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
