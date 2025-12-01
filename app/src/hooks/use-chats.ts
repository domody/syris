import { useMutation, useQuery } from "@tanstack/react-query";
import { getChats, getChat } from "@/lib/api";

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
