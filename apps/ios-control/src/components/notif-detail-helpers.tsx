import { SymbolView } from "expo-symbols";
import type { SymbolViewProps } from "expo-symbols";
import { useTheme } from "@shopify/restyle";
import { Pressable, Text, View } from "react-native";

import { monoFont, type Theme } from "@/theme";

export function DetailCard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme<Theme>();
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: colors.muted,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

export function HairlineDivider() {
  const { colors } = useTheme<Theme>();
  return (
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
  );
}

export function KVRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.muted, flexShrink: 0 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: mono ? monoFont : undefined,
          color: highlight ? colors.accent : colors.foreground,
          textAlign: "right",
          flex: 1,
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function TintedButton({
  label,
  symbolName,
  bg,
  textColor,
  onPress,
}: {
  label: string;
  symbolName: SymbolViewProps["name"];
  bg: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: bg,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <SymbolView name={symbolName} size={14} tintColor={textColor} />
      <Text style={{ fontSize: 15, fontWeight: "600", color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme<Theme>();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MonoBadge({ label }: { label: string }) {
  const { colors } = useTheme<Theme>();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontFamily: monoFont, fontSize: 11, color: colors.muted }}>
        {label}
      </Text>
    </View>
  );
}

export function CloseButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme<Theme>();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.elementBg,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <SymbolView
        name={{ ios: "xmark", android: "close", web: "close" }}
        size={14}
        tintColor={colors.muted}
      />
    </Pressable>
  );
}

export function cleanTitle(title: string): string {
  return title.replace(/ <Middot \/> /g, " · ");
}
