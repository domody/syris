import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Theme } from "@/theme";

export default function AuditScreen() {
  const { colors } = useTheme<Theme>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "600" }}>
          Audit
        </Text>
      </View>
    </SafeAreaView>
  );
}
