import { useTheme } from "@shopify/restyle";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { FilterChip } from "@/components/audit-filter-chip";
import { ALL_OUTCOMES, ALL_STAGES } from "@/helpers/audit";
import type { Theme } from "@/theme";
import type {
    AuditEventOutcome,
    AuditEventStage,
} from "@/types/api/audit";
import type { Filters } from "@/types/ui/audit";

export function FilterSheet({
  visible,
  filters,
  toolNames,
  onClose,
  onApply,
}: {
  visible: boolean;
  filters: Filters;
  toolNames: string[];
  onClose: () => void;
  onApply: (f: Filters) => void;
}) {
  const { colors } = useTheme<Theme>();
  const [local, setLocal] = useState<Filters>(() => ({
    outcomes: new Set(filters.outcomes),
    stages: new Set(filters.stages),
    tools: new Set(filters.tools),
  }));

  const toggleOutcome = (o: AuditEventOutcome) => {
    setLocal((prev) => {
      const s = new Set(prev.outcomes);
      s.has(o) ? s.delete(o) : s.add(o);
      return { ...prev, outcomes: s };
    });
  };

  const toggleStage = (s: AuditEventStage) => {
    setLocal((prev) => {
      const set = new Set(prev.stages);
      set.has(s) ? set.delete(s) : set.add(s);
      return { ...prev, stages: set };
    });
  };

  const toggleTool = (t: string) => {
    setLocal((prev) => {
      const s = new Set(prev.tools);
      s.has(t) ? s.delete(t) : s.add(t);
      return { ...prev, tools: s };
    });
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty: Filters = {
      outcomes: new Set(),
      stages: new Set(),
      tools: new Set(),
    };
    setLocal(empty);
    onApply(empty);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          padding: 20,
          gap: 16,
          maxHeight: "70%",
        }}
      >
        {/* Handle */}
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            alignSelf: "center",
            marginBottom: 4,
          }}
        />

        <ScrollView showsVerticalScrollIndicator={false} style={{ gap: 16 }}>
          {/* Outcome section */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.muted,
                letterSpacing: 0.8,
              }}
            >
              OUTCOME
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ALL_OUTCOMES.map((o) => (
                <FilterChip
                  key={o}
                  label={o}
                  active={local.outcomes.has(o)}
                  onPress={() => toggleOutcome(o)}
                />
              ))}
            </View>
          </View>

          {/* Stage section */}
          <View style={{ gap: 8, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.muted,
                letterSpacing: 0.8,
              }}
            >
              STAGE
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ALL_STAGES.map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={local.stages.has(s)}
                  onPress={() => toggleStage(s)}
                />
              ))}
            </View>
          </View>

          {/* Tool section */}
          {toolNames.length > 0 && (
            <View style={{ gap: 8, marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.muted,
                  letterSpacing: 0.8,
                }}
              >
                TOOL
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {toolNames.map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={local.tools.has(t)}
                    onPress={() => toggleTool(t)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.elementBg,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Reset
            </Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => ({
              flex: 2,
              alignItems: "center",
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.accent,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: colors.white }}
            >
              Apply filters
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
