import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "var(--background)",
        },
        headerShadowVisible: false,
        headerTintColor: "var(--foreground)",
        headerTitleStyle: {
          fontFamily: "var(--font-mono)",
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="scan/barcode.tsx"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="product/[barcode].tsx"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}
