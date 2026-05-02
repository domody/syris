import { useTheme } from "@shopify/restyle";
import { Text, View } from "react-native";

import { OutcomePill } from "@/components/audit-outcome-pill";
import { StageChip } from "@/components/audit-stage-chip";
import { TracePill } from "@/components/audit-trace-pill";
import {
    eventTypeShort,
    formatTimestamp,
    outcomeStripeColor,
} from "@/helpers/audit";
import { monoFont, type Theme } from "@/theme";
import type { AuditEvent } from "@/types/api/audit";
import type { Density } from "@/types/ui/audit";

export function EventRow({
  event,
  density,
  onTracePress,
}: {
  event: AuditEvent;
  density: Density;
  onTracePress: (traceId: string) => void;
}) {
  const { colors } = useTheme<Theme>();
  const stripeColor = outcomeStripeColor(event.outcome, colors);
  const { ns, leaf } = eventTypeShort(event.type);
  const isCompact = density === "compact";

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Outcome stripe */}
      <View style={{ width: 3, backgroundColor: stripeColor }} />

      {/* Content */}
      <View
        style={{ flex: 1, padding: isCompact ? 8 : 10, gap: isCompact ? 4 : 6 }}
      >
        {/* Top row: stage chip + type + outcome pill */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <StageChip stage={event.stage} />
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
          >
            {ns.length > 0 ? (
              <>
                <Text style={{ color: colors.muted }}>{ns}.</Text>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  {leaf}
                </Text>
              </>
            ) : (
              leaf
            )}
          </Text>
          <OutcomePill outcome={event.outcome} />
        </View>

        {/* Summary */}
        <Text
          style={{
            fontSize: isCompact ? 12 : 12.5,
            color: colors.foreground,
            lineHeight: isCompact ? 16 : 18,
          }}
          numberOfLines={isCompact ? 1 : 3}
        >
          {event.summary}
        </Text>

        {/* Meta row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 9, color: colors.muted }}
          >
            {formatTimestamp(event.timestamp)}
          </Text>
          {event.latency_ms !== undefined && (
            <Text
              style={{ fontFamily: monoFont, fontSize: 9, color: colors.muted }}
            >
              {event.latency_ms >= 1000
                ? `${(event.latency_ms / 1000).toFixed(1)}s`
                : `${event.latency_ms}ms`}
            </Text>
          )}
          {event.tool_name && (
            <Text
              style={{ fontFamily: monoFont, fontSize: 9, color: colors.muted }}
            >
              {event.tool_name}
            </Text>
          )}
          <TracePill
            traceId={event.trace_id}
            onPress={() => onTracePress(event.trace_id)}
          />
        </View>
      </View>
    </View>
  );
}
