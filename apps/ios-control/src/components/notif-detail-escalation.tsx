import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import {
    cleanTitle,
    CloseButton,
    DetailCard,
    MonoBadge,
    OutlineButton,
    SectionLabel,
    TintedButton,
} from "@/components/notif-detail-helpers";
import { Badge } from "@/components/ui/badge";
import { monoFont, type Theme } from "@/theme";
import type { EscalationItem } from "@/types/api/inbox";

const INTERPRETATIONS = [
  {
    id: "i1",
    title: "Close garage door when I leave home",
    sub: "watch.proximity â†’ home.garage.close",
    conf: 72,
  },
  {
    id: "i2",
    title: "Close the garage door now",
    sub: "home.garage.close Â· immediate",
    conf: 18,
  },
  {
    id: "i3",
    title: "Close all exterior doors when I leave",
    sub: "watch.proximity â†’ home.exterior.close",
    conf: 10,
  },
] as const;

export function EscalationDetail({ item }: { item: EscalationItem }) {
  const router = useRouter();
  const { colors } = useTheme<Theme>();
  const [selected, setSelected] = useState<string>("i1");
  const [override, setOverride] = useState("");

  const traceId = "01JH7A9P3M";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <CloseButton onPress={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 48,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ gap: 8, marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <SymbolView
              name={{ ios: "brain", android: "memory", web: "memory" }}
              size={12}
              tintColor={colors.accent}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.accent,
              }}
            >
              Ambiguous event Â· operator input needed
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: colors.foreground,
              lineHeight: 28,
            }}
          >
            {cleanTitle(item.title)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <MonoBadge label={item.escalationId} />
            <MonoBadge label={`trace ${traceId.slice(0, 8)}`} />
          </View>
        </View>

        {/* Raw event */}
        <DetailCard>
          <SectionLabel>Raw event</SectionLabel>
          <View
            style={{
              backgroundColor: colors.codeBg,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 12,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              {"// sms from dad Â· 14:02\n"}
              <Text style={{ color: colors.foreground }}>
                {'"yo can you close up when you leave"'}
              </Text>
            </Text>
          </View>
        </DetailCard>

        {/* Routing failure */}
        <DetailCard>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                SYRIS could not route deterministically
              </Text>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: colors.muted,
                  marginTop: 2,
                }}
              >
                rules missed Â· LLM confidence 0.62 (below 0.85 threshold)
              </Text>
            </View>
            <Badge label="no match" variant="warning" />
          </View>
          <Text style={{ fontSize: 13, lineHeight: 19.5, color: colors.muted }}>
            Likely scope:{" "}
            <Text style={{ color: colors.foreground }}>home.garage</Text>,{" "}
            <Text style={{ color: colors.foreground }}>home.exterior</Text>. The
            verb "close up" has 3 plausible interpretations given recent
            context.
          </Text>
        </DetailCard>

        {/* Interpretations */}
        <SectionLabel>Suggested interpretations</SectionLabel>
        {INTERPRETATIONS.map((it) => {
          const isSelected = selected === it.id;
          return (
            <Pressable
              key={it.id}
              onPress={() => setSelected(it.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accentSubtle : colors.card,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.accent : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.accent,
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: colors.foreground,
                  }}
                >
                  {it.title}
                </Text>
                <Text
                  style={{
                    fontFamily: monoFont,
                    fontSize: 11,
                    color: colors.muted,
                  }}
                >
                  {it.sub}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 13,
                  fontWeight: "600",
                  color: isSelected ? colors.accent : colors.muted,
                }}
              >
                {it.conf}%
              </Text>
            </Pressable>
          );
        })}

        {/* Override */}
        <DetailCard>
          <SectionLabel>Or override with instruction</SectionLabel>
          <TextInput
            value={override}
            onChangeText={setOverride}
            placeholder="e.g. close garage AND arm security when car leaves driveway"
            placeholderTextColor={colors.muted as string}
            multiline
            style={{
              fontFamily: monoFont,
              fontSize: 12,
              lineHeight: 18,
              color: colors.foreground as string,
              backgroundColor: colors.codeBg as string,
              borderWidth: 1,
              borderColor: colors.border as string,
              borderRadius: 8,
              padding: 10,
              minHeight: 64,
              textAlignVertical: "top",
            }}
          />
        </DetailCard>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <OutlineButton label="Dismiss" onPress={() => router.back()} />
          <TintedButton
            label="Execute"
            symbolName={{
              ios: "arrow.right",
              android: "arrow_forward",
              web: "arrow_forward",
            }}
            bg={colors.accentSubtle as string}
            textColor={colors.accent as string}
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
