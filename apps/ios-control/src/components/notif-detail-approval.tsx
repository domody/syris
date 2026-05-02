import { useTheme } from "@shopify/restyle";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
    cleanTitle,
    CloseButton,
    DetailCard,
    HairlineDivider,
    KVRow,
    MonoBadge,
    SectionLabel,
    TintedButton,
} from "@/components/notif-detail-helpers";
import { Badge } from "@/components/ui/badge";
import { RISK_VARIANT } from "@/helpers/inbox";
import { useBiometricGate } from "@/hooks/use-biometric-gate";
import { monoFont, type Theme } from "@/theme";
import type { ApprovalItem } from "@/types/ui/inbox";
import type { ApprovalState } from "@/types/ui/notif-detail-approval";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function parseTimeToSeconds(t: string): number {
  const parts = t.split(":");
  if (parts.length === 2)
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  return 240;
}

export function ApprovalDetail({ item }: { item: ApprovalItem }) {
  const router = useRouter();
  const { colors } = useTheme<Theme>();
  const { authenticate, authenticating } = useBiometricGate();

  const totalSeconds = parseTimeToSeconds(item.expiresIn);
  const [seconds, setSeconds] = useState(totalSeconds);
  const [state, setState] = useState<ApprovalState>("pending");
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const pct = Math.max(0, seconds / totalSeconds);
  const traceId = "01JH7A9P3M";

  const handleDeny = async () => {
    const ok = await authenticate();
    if (ok) {
      setState("denied");
    }
  };
  const handleApprove = async () => {
    const ok = await authenticate();
    if (ok) {
      setState("approved");
    }
  };

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
              name={{
                ios: "lock.shield.fill",
                android: "security",
                web: "security",
              }}
              size={12}
              tintColor={colors.warning}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.warning,
              }}
            >
              Approval request · gated {item.expiresIn ? "A3" : ""}
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
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
          >
            <Badge
              label={item.riskLevel}
              variant={RISK_VARIANT[item.riskLevel]}
            />
            <MonoBadge label={item.approvalId} />
            <MonoBadge label={`trace ${traceId.slice(0, 8)}`} />
          </View>
        </View>

        {/* Countdown */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: colors.warningSubtle,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.warningSubtle20,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.foreground }}>
            Expires in{" "}
            <Text
              style={{ fontFamily: monoFont, color: colors.warningEmphasis }}
            >
              {formatTime(seconds)}
            </Text>
          </Text>
          <View
            style={{
              width: 64,
              height: 4,
              backgroundColor: colors.warningSubtle20,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${pct * 100}%`,
                height: "100%",
                backgroundColor: colors.warning,
              }}
            />
          </View>
        </View>

        {/* Why gated */}
        <DetailCard>
          <SectionLabel>Why gated</SectionLabel>
          <Text
            style={{ fontSize: 13, lineHeight: 19.5, color: colors.foreground }}
          >
            Rule{" "}
            <Text style={{ fontFamily: monoFont, color: colors.accent }}>
              home.access.guest
            </Text>{" "}
            matched but requires confirmation at autonomy{" "}
            <Text style={{ fontFamily: monoFont }}>A3</Text>. Door unlock is
            classified <Text style={{ fontWeight: "600" }}>medium risk</Text>{" "}
            when initiated by non-resident identity.
          </Text>
        </DetailCard>

        {/* Payload */}
        <DetailCard>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                Payload
              </Text>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: colors.muted,
                  marginTop: 2,
                }}
              >
                tool.call · home.door.unlock
              </Text>
            </View>
            <Pressable
              onPress={() => setModified((m) => !m)}
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "500", color: colors.muted }}
              >
                {modified ? "Modified" : "Modify"}
              </Text>
            </Pressable>
          </View>
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
              {`{\n  "tool": "home.door.unlock",\n  "target": "front_door",\n  "identity": "dad.iphone",\n  "duration_s": ${modified ? 60 : 120},\n  "source": "proximity.ble"\n}`}
            </Text>
          </View>
          {modified && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                backgroundColor: colors.accentSubtle,
              }}
            >
              <SymbolView
                name={{ ios: "info.circle", android: "info", web: "info" }}
                size={12}
                tintColor={colors.accent}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: colors.accent,
                }}
              >
                Duration reduced to 60s
              </Text>
            </View>
          )}
        </DetailCard>

        {/* Context */}
        <DetailCard>
          <KVRow label="Initiated" value="2026-04-28 14:08:22" mono />
          <HairlineDivider />
          <KVRow label="Source" value="BLE proximity · dad.iphone @ 1.2m" />
          <HairlineDivider />
          <KVRow
            label="Matched rule"
            value="home.access.guest"
            mono
            highlight
          />
          <HairlineDivider />
          <KVRow label="Trace" value={traceId} mono />
          <HairlineDivider />
          <KVRow label="Last 7d" value="3 approvals · 0 denials" />
        </DetailCard>

        {/* Actions */}
        {state === "pending" ? (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TintedButton
                label="Deny"
                symbolName={{ ios: "xmark", android: "close", web: "close" }}
                bg={colors.errorSubtle as string}
                textColor={colors.errorEmphasis as string}
                onPress={handleDeny}
              />
              <TintedButton
                label={modified ? "Approve modified" : "Approve"}
                symbolName={{
                  ios: "checkmark",
                  android: "check",
                  web: "check",
                }}
                bg={colors.successSubtle as string}
                textColor={colors.successEmphasis as string}
                onPress={handleApprove}
              />
            </View>
            <Text
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Face ID required · action logged to{" "}
              <Text style={{ color: colors.accent }}>audit.approvals</Text>
            </Text>
          </>
        ) : (
          <DetailCard>
            <View style={{ alignItems: "center", gap: 8, paddingVertical: 6 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    state === "approved"
                      ? colors.successSubtle
                      : colors.errorSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SymbolView
                  name={
                    state === "approved"
                      ? { ios: "checkmark", android: "check", web: "check" }
                      : { ios: "xmark", android: "close", web: "close" }
                  }
                  size={20}
                  tintColor={
                    state === "approved"
                      ? (colors.successEmphasis as string)
                      : (colors.errorEmphasis as string)
                  }
                />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                {state === "approved"
                  ? "Approved · executing"
                  : "Denied · gate closed"}
              </Text>
              <Text
                style={{
                  fontFamily: monoFont,
                  fontSize: 11,
                  color: colors.muted,
                  textAlign: "center",
                }}
              >
                {state === "approved"
                  ? "door.unlock dispatched at 14:08:29"
                  : "event recorded, no action taken"}
              </Text>
            </View>
          </DetailCard>
        )}
      </ScrollView>
    </View>
  );
}

// StyleSheet.create not used in this file — all values come from theme tokens via useTheme
