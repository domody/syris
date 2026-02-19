import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useAuth, AuthProvider } from "@/providers/auth-provider";
import "@/globals.css";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";
import { PortalHost } from "@rn-primitives/portal";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { SplashScreen } from "expo-router";
import { useFonts } from "@expo-google-fonts/jetbrains-mono";
import { QueryProvider } from "@/providers/query-provider";
import { AuthQuerySync } from "@/providers/auth-query-sync";

function RootStack() {
  const { user, loading: userLoading } = useAuth();
  const t = useTheme();

  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync?.();
  }, [fontsLoaded]);

  if (userLoading) return null;

  const isLoggedIn = !!user;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

// function ThemedRoot() {
//   const t = useTheme();
//   console.log(t.colors.background)
//   return (
//     <View style={{ flex: 1, backgroundColor: t.colors.background }}>

//         <RootStack />
//       </AuthProvider>
//     </View>
//   );
// }

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <AuthQuerySync />
          <RootStack />
          <PortalHost />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
