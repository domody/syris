import { Theme } from "@/theme";
import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomHeaderProps {
  title?: string;
  /** Show a back chevron on the left */
  showBack?: boolean;
  /** Override the default back action */
  onBackPress?: () => void;
  /** Slot for a custom left element (replaces back button) */
  leftElement?: React.ReactNode;
  /** Slot for a custom right element (e.g. icon buttons) */
  rightElement?: React.ReactNode;
  /** Transparent header — content will render beneath it */
  transparent?: boolean;
  /** Explicit background colour override */
  backgroundColor?: string;
  /** Title text colour override */
  titleColor?: string;
}

const HEADER_HEIGHT = 44;

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomHeader({
  title,
  showBack = false,
  onBackPress,
  leftElement,
  rightElement,
  transparent = false,
  backgroundColor,
  titleColor,
}: CustomHeaderProps) {
  const { colors, spacing, borderRadii } = useTheme<Theme>();

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.background,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 1,
        shadowRadius: 10,
      }}
    >
      <View
        style={{
          height: HEADER_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing[16],
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-start",
            flexDirection: "row",
            gap: spacing[10],
          }}
          pointerEvents="none"
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: borderRadii.md,
              backgroundColor: colors.accent,
            }}
          />
          {title ? (
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: -0.4,
              }}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {title}
            </Text>
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {rightElement ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#ffffff",
    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    // Elevation (Android fallback)
    elevation: 2,
    zIndex: 10,
  },
  container: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#ff0000",
  },
  side: {
    width: 80, // fixed width keeps title centred
    justifyContent: "center",
  },
  sideRight: {
    alignItems: "flex-end",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600", // matches iOS native header weight
    color: "#000000",
    letterSpacing: -0.4,
  },
  backButton: {
    paddingLeft: 4,
    justifyContent: "center",
  },
  backChevron: {
    fontSize: 34,
    lineHeight: 36,
    color: "#007AFF", // iOS system blue — swap for your brand colour
    fontWeight: "300",
    marginTop: -2, // optical alignment
  },
});
