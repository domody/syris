import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChats, getChat, renameChat } from "@/lib/api";

export const useChats = () => {
  return useQuery({
    queryKey: ["chats"],
    queryFn: getChats,
  });
};

export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await getChat(chatId);
      return response;
    },
    enabled: !!chatId && chatId !== "new",
    staleTime: 1500,
  });
};

export function useRenameChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, newTitle }: { chatId: number; newTitle: string }) =>
      renameChat(chatId, newTitle),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    },
    onError: (error) => {
      console.error("Failed to rename chat:", error);
    },
  });
}
