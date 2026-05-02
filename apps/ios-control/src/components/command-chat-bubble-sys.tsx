import { useTheme } from "@shopify/restyle";
import { View } from "react-native";

import { ApprovalContent } from "@/components/command-approval-content";
import { DryRunContent } from "@/components/command-dry-run-content";
import { GeneralChatContent } from "@/components/command-general-chat-content";
import { InformationalContent } from "@/components/command-informational-content";
import { LaneChip } from "@/components/command-lane-chip";
import { TaskCreatedContent } from "@/components/command-task-created-content";
import { TraceId } from "@/components/ui/trace-id";
import { laneForKind } from "@/helpers/command";
import type { Theme } from "@/theme";
import type { SyrisResponse } from "@/types";

export function ChatBubbleSys({ response }: { response: SyrisResponse }) {
  const { colors } = useTheme<Theme>();
  const lane = laneForKind(response.kind);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        maxWidth: "92%",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 16,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <LaneChip lane={lane} />
        <TraceId value={response.traceId} />
      </View>
      {response.kind === "task_created" && <TaskCreatedContent r={response} />}
      {response.kind === "approval_surfaced" && (
        <ApprovalContent r={response} />
      )}
      {response.kind === "dry_run" && <DryRunContent r={response} />}
      {response.kind === "informational" && (
        <InformationalContent r={response} />
      )}
      {response.kind === "general_chat" && <GeneralChatContent r={response} />}
    </View>
  );
}
