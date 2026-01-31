import React from "react";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";

export default function Home() {
  const { user, loading } = useAuth();
  const t = useTheme();


  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ThemedText>Logged In!</ThemedText>
      <ThemedText>{user?.id ?? "No user..."}</ThemedText>
      <Link href={"/testing"} asChild>
        <Button className="mt-4">
          <Text>Go to Testing</Text>
        </Button>
      </Link>
    </ThemedView>
  );
}
