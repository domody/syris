import * as React from "react";
import { useChats } from "@/hooks/use-chats";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
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
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Ellipsis, Pen, Trash2 } from "lucide-react";

import { useRenameChat } from "@/hooks/use-chats";
import { deleteChat } from "@/lib/api";
import { ChatResponse } from "@/types";

export function ChatSidebar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error } = useChats();
  const renameMutation = useRenameChat();
  const [editingChatId, setEditingChatId] = React.useState<number | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEditing = React.useCallback(
    (chatId: number, currentTitle: string) => {
      setEditingChatId(chatId);
      setEditValue(currentTitle);
    },
    []
  );

  const saveRename = React.useCallback(async () => {
    if (!editingChatId || !editValue.trim()) {
      setEditingChatId(null);
      return;
    }

    const newTitle = editValue.trim();
    const chatId = editingChatId;

    // Optimistically update chat value
    queryClient.setQueryData(
      ["chats"],
      (oldData: ChatResponse[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        );
      }
    );

    try {
      renameMutation.mutate({ chatId, newTitle });
    } catch (err) {
      // Revert optimistic update if we run into an error
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      console.error("Failed to rename chat:", err);
    }

    setEditingChatId(null);
    setEditValue("");
  }, [editingChatId, editValue]);

  React.useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingChatId]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        saveRename();
      }
    };

    if (editingChatId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [editingChatId, editValue, saveRename]);

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
                  {editingChatId === chat.id ? (
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key == "Enter") {
                          e.preventDefault();
                          saveRename();
                        } else if (e.key == "Escape") {
                          setEditingChatId(null);
                          setEditValue("");
                        }
                      }}
                      className="w-full h-8 border-0 px-2"
                    />
                  ) : (
                    <>
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
                          <DropdownMenuItem
                            onClick={() => {
                              startEditing(chat.id, chat.title);
                            }}
                          >
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
                    </>
                  )}
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
