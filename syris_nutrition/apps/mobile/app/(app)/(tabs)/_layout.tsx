import { Href, Tabs as JsTabs } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react-native";
import { HapticTab } from "@/components/navigation/tabs/haptic-tab";
import { Home04Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTabButton } from "@/components/navigation/tabs/haptic-tab-button";

type TabsFlag = "javascript" | "native" | "custom";

function getTabsFlag(): TabsFlag {
  return "custom";
}

function JavaScriptTabsLayout() {
  return (
    <JsTabs
      screenOptions={{
        tabBarActiveTintColor: "var(--primary)",
        tabBarStyle: {
          backgroundColor: "var(--background)",
          borderTopWidth: 0,
          elevation: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <JsTabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon size={28} icon={Home04Icon} color={color} />
          ),
        }}
      />
      <JsTabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => (
            <HugeiconsIcon size={28} icon={PlusSignIcon} color={color} />
          ),
        }}
      />
    </JsTabs>
  );
}

function NativeTabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <Label>Add</Label>
        <Icon sf="plus" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

type NavItem = {
  name: "index" | "add";
  label: string;
  href: Href;
  icon: IconSvgElement;
  primary?: boolean;
};
const NAV = [
  { name: "index", label: "Home", href: "/", icon: Home04Icon },
  {
    name: "add",
    label: "Add",
    href: "/add",
    icon: PlusSignIcon,
    primary: true,
  },
] as const satisfies readonly NavItem[];

function CustomTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      className="bg-background"
      style={{ flex: 1, paddingBottom: insets.bottom }}
    >
      <TabSlot />

      <TabList className="border-t border-border h-16">
        {NAV.map((tab) => (
          <TabTrigger
            key={tab.name}
            name={tab.name}
            href={tab.href}
            style={{
              flexDirection: "column",
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
            }}
            asChild
          >
            <HapticTabButton icon={tab.icon} label={tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

export default function TabLayout() {
  const flag = getTabsFlag();

  switch (flag) {
    case "javascript":
      return <JavaScriptTabsLayout />;
    case "native":
      return <NativeTabsLayout />;
    case "custom":
      return <CustomTabsLayout />;
  }
}
