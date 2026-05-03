import { useTheme } from "@shopify/restyle";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    SectionList,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayDivider } from "@/components/audit-day-divider";
import { EventRow } from "@/components/audit-event-row";
import { FilterChip } from "@/components/audit-filter-chip";
import { FilterSheet } from "@/components/audit-filter-sheet";
import { SummaryStrip } from "@/components/audit-summary-strip";
import { TraceDetail } from "@/components/audit-trace-detail";
import { AUDIT_EVENTS } from "@/data/mock";
import { ALL_OUTCOMES, buildFeedItems, getToolNames } from "@/helpers/audit";
import { type Theme } from "@/theme";
import type { Density, Filters } from "@/types";

export default function AuditScreen() {
  const { colors } = useTheme<Theme>();

  const [query, setQuery] = useState("");
  const [density, setDensity] = useState<Density>("comfy");
  const [filters, setFilters] = useState<Filters>({
    outcomes: new Set(),
    stages: new Set(),
    tools: new Set(),
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);

  const toolNames = getToolNames(AUDIT_EVENTS);

  const filtered = AUDIT_EVENTS.filter((e) => {
    if (query.length > 0) {
      const q = query.toLowerCase();
      const match =
        e.summary.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.trace_id.toLowerCase().includes(q) ||
        (e.tool_name ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.outcomes.size > 0 && !filters.outcomes.has(e.outcome))
      return false;
    if (filters.stages.size > 0 && !filters.stages.has(e.stage)) return false;
    if (
      filters.tools.size > 0 &&
      !(e.tool_name && filters.tools.has(e.tool_name))
    )
      return false;
    return true;
  });

  const feedItems = buildFeedItems(filtered);
  const activeFilterCount =
    filters.outcomes.size + filters.stages.size + filters.tools.size;

  if (activeTraceId !== null) {
    return (
      <TraceDetail
        traceId={activeTraceId}
        events={AUDIT_EVENTS}
        onBack={() => setActiveTraceId(null)}
      />
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: 96 }}
    >
      {/* Summary strip */}
      <View style={{ marginTop: 12 }}>
        <SummaryStrip events={filtered} />
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 10,
        }}
      >
        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 10,
            gap: 8,
          }}
        >
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            size={14}
            tintColor={colors.muted}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search events, types, trace IDs…"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.foreground,
              paddingVertical: 8,
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Quick-filter rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center" }}
        >
          <Pressable
            onPress={() => setFilterSheetVisible(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor:
                activeFilterCount > 0 ? colors.accentSubtle : colors.elementBg,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <SymbolView
              name={{
                ios: "line.3.horizontal.decrease",
                android: "filter_list",
                web: "filter_list",
              }}
              size={12}
              tintColor={
                activeFilterCount > 0 ? colors.accentEmphasis : colors.muted
              }
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color:
                  activeFilterCount > 0 ? colors.accentEmphasis : colors.muted,
              }}
            >
              Filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </Text>
          </Pressable>

          {ALL_OUTCOMES.map((o) => (
            <FilterChip
              key={o}
              label={o}
              active={filters.outcomes.has(o)}
              onPress={() => {
                setFilters((prev) => {
                  const s = new Set(prev.outcomes);
                  s.has(o) ? s.delete(o) : s.add(o);
                  return { ...prev, outcomes: s };
                });
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      {/* Potentially convert into SectionList component
          so section headers stick to top with
          stickySectionHeadersEnabled - requires to group
          events by section though.
      */}
      <SectionList
        sections={feedItems}
        keyExtractor={(item) => item.audit_id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          paddingTop: 0,
          gap: density == "compact" ? 4 : 8,
        }}
        renderItem={({ item }) => (
          <EventRow
            event={item}
            density={density}
            onTracePress={(id) => setActiveTraceId(id)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <DayDivider iso={section.iso} count={section.data.length} />
        )}
        stickySectionHeadersEnabled
      />
      {/*<FlatList
        data={feedItems}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: density === "compact" ? 4 : 8,
        }}
        renderItem={({ item }) => {
          if (item.kind === "divider") {
            return <DayDivider iso={item.iso} />;
          }
          return (
            <EventRow
              event={item.event}
              density={density}
              onTracePress={(id) => setActiveTraceId(id)}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              No events match your filters.
            </Text>
          </View>
        }
      />*/}

      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        toolNames={toolNames}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(f) => setFilters(f)}
      />
    </SafeAreaView>
  );
}



{/* Density toggle */}
// <View
//   style={{
//     flexDirection: "row",
//     backgroundColor: colors.elementBg,
//     borderRadius: 8,
//     padding: 2,
//   }}
// >
//   {(["comfy", "compact"] as Density[]).map((d) => (
//     <Pressable
//       key={d}
//       onPress={() => setDensity(d)}
//       style={{
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 6,
//         backgroundColor: density === d ? colors.card : "transparent",
//       }}
//     >
//       <Text
//         style={{
//           fontSize: 11,
//           fontWeight: "500",
//           color: density === d ? colors.foreground : colors.muted,
//         }}
//       >
//         {d}
//       </Text>
//     </Pressable>
//   ))}
// </View>
