import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BrainCircuit, NotebookPen } from "lucide-react";
import { SettingsDialog } from "../settings/settings-dialog";
const appSidebarItems = [
  {
    title: "SYRIS",
    icon: BrainCircuit,
    to: "/c/$chatId",
    params: { chatId: "new" },
  },
  {
    title: "Notes",
    icon: NotebookPen,
    to: "/n/$noteId",
    params: { noteId: "new" },
  },
];

export function AppSidebar({ subNav }: { subNav: React.ReactNode }) {
  return (
    <Sidebar
      collapsible="none"
      // className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarGroupLabel>{window.location.href}</SidebarGroupLabel>
        <SidebarMenu>
          {appSidebarItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  window.location.pathname.slice(0, 3) === item.to.slice(0, 3)
                }
              >
                <Link to={item.to} params={item.params} title={item.title}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SettingsDialog />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{subNav}</SidebarContent>
    </Sidebar>
  );
}
