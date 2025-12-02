import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import {
  Settings,
  Cpu,
  Brain,
  FileText,
  Monitor,
  Keyboard,
  History,
  Shield,
  CloudUpload,
  PlugZap,
  Code,
  FlaskConical,
} from "lucide-react";

const data = {
  nav: [
    { name: "General", icon: Settings },
    { name: "Model Behavior", icon: Cpu },
    { name: "Memory & Context", icon: Brain },
    { name: "Prompts & Templates", icon: FileText },
    { name: "Interface", icon: Monitor },
    { name: "Shortcuts", icon: Keyboard },
    { name: "Sessions & History", icon: History },
    { name: "Security", icon: Shield },
    { name: "Sync & Backups", icon: CloudUpload },
    { name: "Integrations", icon: PlugZap },
    { name: "Developer Tools", icon: Code },
    { name: "Labs", icon: FlaskConical },
  ],
} as const;

// General - Basic preferences, startup behavior.

// Model Behavior - Response style, personality tuning, creativity level, system prompts.

// Memory & Context - Long-term memory controls, vector DB settings, context window tuning.

// Prompts & Templates - Saved prompts, reusable workflows, system presets.`

// Interface - Theme, layout density, message grouping, animations.

// Shortcuts - Keyboard shortcut customisation.

// Sessions & History - Chat history, pinning, archiving, automatic cleanup.

// Security - Authentication, encryption settings, data controls.

// Sync & Backups - Cloud sync, exporting/importing datasets or memory.

// Integrations - API keys, external apps, webhooks.

// Developer Tools - Logs, latency metrics, model debug mode.

// Labs - Experimental features, preview models.

export function SettingsDialog() {
  type TabName = (typeof data.nav)[number]["name"];
  const [activeTab, setActiveTab] = React.useState<TabName>("General");

  return (
    <Dialog>
      <DialogTrigger>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* <SidebarMenuItem>
                        <SidebarMenuButton className="size-8">
                            <X />
                        </SidebarMenuButton>
                    </SidebarMenuItem> */}
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={activeTab === item.name}
                          onClick={() => setActiveTab(item.name)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-y-auto"></main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
