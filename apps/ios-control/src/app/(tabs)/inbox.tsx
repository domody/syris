import { useTheme } from "@shopify/restyle";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InboxRow } from "@/components/inbox-row";
import { INITIAL_INBOX } from "@/data/mock";
import { FILTER_DEFS, filterItems } from "@/helpers/inbox";
import { monoFont, type Theme } from "@/theme";
import type { InboxItem } from "@/types";
import type { FilterId } from "@/types";

export default function InboxScreen() {
  const { colors, borderRadii, spacing } = useTheme<Theme>();

  const [filter, setFilter] = useState<FilterId>("all");
  const [items, setItems] = useState<InboxItem[]>(INITIAL_INBOX);

  const visible = filterItems(items, filter);
  const unreadCount = items.filter((it) => it.unread).length;
  const hasInfo = items.some((it) => it.kind === "info");

  const countFor = (id: FilterId) => {
    switch (id) {
      case "action":
        return items.filter(
          (it) => it.kind === "approval" || it.kind === "escalation",
        ).length;
      case "agent":
        return items.filter((it) => it.kind === "agent").length;
      case "info":
        return items.filter((it) => it.kind === "info").length;
      case "alarm":
        return items.filter((it) => it.kind === "alarm").length;
      default:
        return items.length;
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: spacing[96],
          paddingBottom: spacing[32],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* â”€â”€ Header â”€â”€ */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            display: "none",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              letterSpacing: -0.6,
              color: colors.foreground,
            }}
          >
            Inbox
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: borderRadii.full,
                backgroundColor: colors.accentSubtle,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.accentMid,
                }}
              >
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        {/* â”€â”€ Filter chips â”€â”€ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            gap: 6,
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          {FILTER_DEFS.map((f) => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: borderRadii.md,
                  paddingHorizontal: 12,
                  flexShrink: 0,
                  height: 30,
                  backgroundColor: active
                    ? colors.foreground
                    : colors.elementBg,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: active
                      ? colors.chipActiveText
                      : colors.chipInactiveLabel,
                  }}
                >
                  {f.label}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: monoFont,
                    color: (active
                      ? colors.chipActiveCount
                      : colors.chipInactiveCount) as string,
                  }}
                >
                  {countFor(f.id)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* â”€â”€ Inbox list â”€â”€ */}
        {visible.length > 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadii.xl,
              overflow: "hidden",
              marginHorizontal: 16,
            }}
          >
            {visible.map((item, i) => (
              <InboxRow
                key={item.id}
                item={item}
                colors={colors}
                isLast={i === visible.length - 1}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 64,
              marginHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Nothing here
            </Text>
          </View>
        )}

        {/* â”€â”€ Clear informational â”€â”€ */}
        {hasInfo && (
          <Pressable
            onPress={() =>
              setItems((prev) => prev.filter((it) => it.kind !== "info"))
            }
            style={({ pressed }) => ({
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: borderRadii.full,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <SymbolView
              name={{
                ios: "trash",
                android: "delete_outline",
                web: "delete_outline",
              }}
              size={12}
              tintColor={colors.muted}
            />
            <Text style={{ fontSize: 12, color: colors.muted }}>
              Clear all informational
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
