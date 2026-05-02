import { Theme } from "@/theme";
import { useTheme } from "@shopify/restyle";
import { NativeTabs } from "expo-router/build/native-tabs";

export default function TabsLayout() {
  const { colors } = useTheme<Theme>();

  return (
    <NativeTabs
      backgroundColor={"#ff0000"}
      badgeBackgroundColor={colors.accent}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Overview</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
        <NativeTabs.Trigger.Icon sf="bell" md="notifications_none" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="command">
        <NativeTabs.Trigger.Label>Command</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="apple.terminal" md="terminal" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="audit">
        <NativeTabs.Trigger.Label>Audit</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="waveform.path.ecg" md="vital_signs" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
