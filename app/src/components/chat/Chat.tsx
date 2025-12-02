import * as React from "react";
import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { streamSyrisMessage } from "@/lib/stream";
import { Lightbulb } from "lucide-react";
import { useChat } from "@/hooks/use-chats";
import { createChat, postMessage } from "@/lib/api";
import { MessagesReponse } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function Chat({ chatId }: { chatId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const chatQuery = useChat(chatId === "new" ? "" : chatId);
  const allMessages = chatQuery?.data ?? [];
  const [streamingMessages, setStreamingMessages] = useState<MessagesReponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setStreamingMessages([]);
  }, [chatId]);

  const finalMessages = [...allMessages, ...streamingMessages];

  async function sendStreaming(message: string) {
    let activeChatId = chatId;

    // If in a new chat, create new chat in db and route to it
    if (chatId === "new") {
      try {
        const result = await createChat("New Chat");
        activeChatId = result.id;

        navigate({ to: "/c/$chatId", params: { chatId: result.id } });

        // Invalidate chat list to refresh sidebar
        queryClient.invalidateQueries({ queryKey: ["chats"] });

        // Clear streaming messages because new chat starts fresh
        setStreamingMessages([]);
      } catch (err) {
        console.error("Failed to create chat:", err);
        return;
      }
    }
    
    // Optimistically show user message
    setStreamingMessages((prev) => [
      ...prev,
      { role: "user", content: message },
    ]);

    // Send user message to python backend
    try {
      await postMessage(activeChatId, "user", message);
    } catch (err) {
      console.error("Failed to save user message", err);
    }

    // Create optimistic placeholder for assistant
    setStreamingMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", thinking: "" },
    ]);

    setIsLoading(true);

    let accumulated_content = "";
    let accumulated_thinking = "";

    // Stream response
    streamSyrisMessage(
      message,
      // Thinking tokens
      (token) => {
        accumulated_thinking += token;

        setStreamingMessages((prev) => {
          const copy = [...prev];
          const last = copy.length - 1;

          copy[last] = {
            ...copy[last],
            thinking: accumulated_thinking,
          };

          return copy;
        });
      },
      // Content tokens
      (token) => {
        accumulated_content += token;

        setStreamingMessages((prev) => {
          const copy = [...prev];
          const lastIndex = copy.length - 1;

          copy[lastIndex] = {
            ...copy[lastIndex],
            content: accumulated_content,
            thinking: accumulated_thinking,
          };

          return copy;
        });
      },
      // On done
      async () => {
        setIsLoading(false);

        // Save assistant message
        try {
          await postMessage(
            activeChatId,
            "assistant",
            accumulated_content,
            accumulated_thinking
          );
        } catch (err) {
          console.error("Failed to save assistant message", err);
        }

        // Refetch messages
        setStreamingMessages([]);
        chatQuery.refetch();
      }
    );
  }

  async function handleSend(message: string) {
    sendStreaming(message);
  }

  return chatId === "new" || chatQuery ? (
    <div className="flex flex-col w-full h-screen relative max-w-2xl mx-auto">
      {chatId == "new" && finalMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center flex-col">
          <h2 className="font-bold text-lg">S.Y.R.I.S</h2>
          <p className="text-muted-foreground">{import.meta.env.VITE_SYRIS_VERSION_DESC}</p>
          <div className="w-full pt-8">
            <ChatInput isLoading={isLoading} onSend={handleSend} />
          </div>
        </div>
      ) : (
        <>
          <div
            key={chatId}
            className="w-full h-full px-2 pt-8 pb-8 overflow-y-auto space-y-8 no-scrollbar"
          >
            {finalMessages.map((m, i) => (
              <div key={i} className="w-full flex flex-col space-y-1">
                {m.thinking && m.thinking.length > 0 && (
                  <div className="flex gap-1.5 text-muted-foreground text-xs">
                    <Lightbulb className="size-3.5" />
                    <span>{m.thinking}</span>
                  </div>
                )}
                <MessageBubble role={m.role} content={m.content} isLoading={isLoading} />
              </div>
            ))}
          </div>
          <div className="w-full pb-2 mt-auto">
            <ChatInput isLoading={isLoading} onSend={handleSend} />
          </div>
        </>
      )}
    </div>
  ) : (
    <div className="">Loading...</div>
  );
}
