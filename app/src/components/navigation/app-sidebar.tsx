import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { BrainCircuit, NotebookPen, Cog } from "lucide-react";

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
  {
    title: "Settings",
    icon: Cog,
    to: "/settings",
    params: {},
  },
];

export function AppSidebar({ subNav }: { subNav: React.ReactNode }) {
  return (
    <Sidebar
      collapsible="none"
      // className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{window.location.href}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appSidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={window.location.pathname.slice(0, 3) === item.to.slice(0, 3)}>
                    <Link to={item.to} params={item.params} title={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {subNav}
      </SidebarContent>
    </Sidebar>
  );
}
