import { useTheme } from "@shopify/restyle";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { RISK_BADGE, nowTimestamp } from "@/helpers/command";
import { monoFont, type Theme } from "@/theme";
import type { ApprovalSurfacedResponse } from "@/types/ui/command";

export function ApprovalContent({ r }: { r: ApprovalSurfacedResponse }) {
  const { colors } = useTheme<Theme>();
  const [decision, setDecision] = useState<"approved" | "denied" | null>(null);

  return (
    <>
      <View
        style={{
          padding: 10,
          borderRadius: 8,
          backgroundColor: colors.warningSubtle10,
          gap: 8,
          borderWidth: 1,
          borderColor: "rgba(234,179,8,0.25)", // yellow-500/25 one-off border
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.warningEmphasis,
            }}
          >
            Approval required
          </Text>
          <Text
            style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
          >
            {r.approvalId}
          </Text>
          <Badge label={r.riskLevel} variant={RISK_BADGE[r.riskLevel]} />
          <Text
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              color: colors.warningMid,
            }}
          >
            exp {r.expiresIn}
          </Text>
        </View>
        <Text
          style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }}
        >
          {r.why}
        </Text>
        <View
          style={{
            backgroundColor: colors.codeBg,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{ fontFamily: monoFont, fontSize: 10, color: colors.muted }}
            numberOfLines={2}
          >
            {r.what}
          </Text>
        </View>
      </View>
      {decision === null ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setDecision("approved")}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: colors.successSubtle,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.successEmphasis,
              }}
            >
              Approve
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDecision("denied")}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: colors.errorSubtle10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.errorEmphasis,
              }}
            >
              Deny
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor:
              decision === "approved"
                ? colors.successSubtle10
                : colors.errorSubtle10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color:
                decision === "approved"
                  ? colors.successEmphasis
                  : colors.errorEmphasis,
            }}
          >
            {decision === "approved" ? "Approved" : "Denied"}
          </Text>
          <Text
            style={{ fontSize: 10, fontFamily: monoFont, color: colors.muted }}
          >
            {nowTimestamp()}
          </Text>
        </View>
      )}
    </>
  );
}
