import { useChats } from "@/hooks/use-chats";
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

export function ChatSidebar() {
  const { data, isLoading, error } = useChats();

  if (!data) return;
  if (error) return;
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarMenu>
          {isLoading ? (
            <SidebarMenuItem>
              <SidebarMenuButton>Loading...</SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <>
              {data.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={window.location.pathname === `/c/${chat.id}`}
                  >
                    <Link
                      to="/c/$chatId"
                      params={{ chatId: chat.id }}
                      title={chat.title}
                    >
                      {chat.title ?? `Chat ${chat.id}`}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
