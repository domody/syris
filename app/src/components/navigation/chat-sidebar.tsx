import { useChats } from "@/hooks/use-chats";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Ellipsis, Pen, Trash2 } from "lucide-react";

import { deleteChat } from "@/lib/api";

export function ChatSidebar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <Ellipsis />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      side="right"
                      align="start"
                    >
                      <DropdownMenuItem>
                        <Pen />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant={"destructive"}
                        onClick={async () => {
                          try {
                            await deleteChat(chat.id);
                            queryClient.invalidateQueries({
                              queryKey: ["chats"],
                            });
                            navigate({ to: "/c/new" });
                          } catch (err) {
                            console.error("Error deleting chat", err);
                          }
                        }}
                      >
                        <Trash2 />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
