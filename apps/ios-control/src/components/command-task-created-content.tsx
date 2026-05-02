import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { UnderstoodRow } from "@/components/command-understood-row";
import { monoFont, type Theme } from "@/theme";
import type { TaskCreatedResponse } from "@/types/ui/command";

export function TaskCreatedContent({ r }: { r: TaskCreatedResponse }) {
  const { colors } = useTheme<Theme>();
  return (
    <>
      <UnderstoodRow label={`Task · ${r.steps} steps`} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 6,
          gap: 6,
        }}
      >
        <Text
          style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }}
        >
          {r.summary}
        </Text>
        <Text
          style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
        >
          {r.taskId}
        </Text>
      </View>
    </>
  );
}
