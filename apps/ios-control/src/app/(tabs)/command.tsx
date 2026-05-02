import { useTheme } from "@shopify/restyle";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExchangeEntry } from "@/components/command-exchange-entry";
import { FloatingInputBar } from "@/components/command-floating-input-bar";
import { DEMO_RESPONSES, INITIAL_EXCHANGES } from "@/data/mock";
import { nowTimestamp } from "@/helpers/command";
import { useSystemStore } from "@/stores/use-system-store";
import type { Theme } from "@/theme";
import type { Exchange } from "@/types";

let demoIdx = 0;

export default function CommandScreen() {
  const { autonomyLevel } = useSystemStore();
  const { colors } = useTheme<Theme>();
  const autonomy = autonomyLevel ?? "A3";

  const [exchanges, setExchanges] = useState<Exchange[]>(INITIAL_EXCHANGES);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const id = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: false }),
      80,
    );
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [exchanges.length]);

  const handleSend = (command: string) => {
    const id = `ex-${Date.now()}`;
    const now = nowTimestamp();

    setExchanges((prev) => [
      ...prev,
      { id, timestamp: now, autonomy, command, response: null },
    ]);

    setTimeout(
      () => {
        const template = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length]!;
        demoIdx += 1;
        setExchanges((prev) =>
          prev.map((ex) =>
            ex.id === id
              ? { ...ex, response: { ...template, timestamp: nowTimestamp() } }
              : ex,
          ),
        );
      },
      2100 + Math.random() * 600,
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, position: "relative" }}>
          {/* <ScrollView
          ref={flatListRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 32,
            gap: 10,
            // position: "relative",
            backgroundColor: "#ff0000",
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          >
          {exchanges.map((ex) => (
            <ExchangeEntry key={ex.id} exchange={ex} />
          ))} */}
          <FlatList
            ref={flatListRef}
            data={exchanges}
            keyExtractor={(exhange) => exhange.id}
            contentContainerStyle={{
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 256,
            }}
            renderItem={({ item }) => <ExchangeEntry item={item} />}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <FloatingInputBar onSend={handleSend} />
          </View>
          {/* </ScrollView> */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// <View
//   style={{
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: borderRadii.xl,
//     backgroundColor: colors.codeBg,
//     borderWidth: 1,
//     borderColor: colors.border,
//   }}
// >
//   <Text
//     style={{
//       fontSize: 11,
//       fontFamily: monoFont,
//       textAlign: "center",
//       color: colors.muted,
//     }}
//   >
//     <Text style={{ color: colors.foreground }}>
//       Command interface
//     </Text>
//     {
//       " Â· not a chatbot. Messages are ingested as events through the normal pipeline."
//     }
//   </Text>
// </View>
