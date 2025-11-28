import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {appSidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to} params={item.params} title={item.title}>
                      <item.icon />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
