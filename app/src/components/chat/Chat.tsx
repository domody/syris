import * as React from "react";
import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { streamSyrisMessage } from "@/lib/stream";
import { Lightbulb } from "lucide-react";
import { useChat } from "@/hooks/use-chats";

import { MessagesReponse } from "@/types";

export function Chat({ chatId }: { chatId: string }) {
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
    setStreamingMessages((prev) => [
      ...prev,
      { role: "user", content: message },
    ]);

    setStreamingMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", thinking: "" },
    ]);

    setIsLoading(true);

    let accumulated_content = "";
    let accumulated_thinking = "";

    streamSyrisMessage(
      message,
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
      () => {
        setIsLoading(false);
      }
    );
  }

  async function handleSend(message: string) {
    sendStreaming(message);
  }

  return chatId === "new" || chatQuery ? (
    <div className="flex flex-col w-full h-screen relative max-w-2xl mx-auto">
      <div className="w-full h-full px-2 pt-8 pb-8 overflow-y-auto space-y-8 no-scrollbar">
        {chatId == "new" && finalMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col">
            <h2 className="font-bold text-lg">S.Y.R.I.S</h2>
            <p className="text-muted-foreground">alpha version</p>
          </div>
        ) : (
          <React.Fragment key={chatId}>
            {finalMessages.map((m, i) => (
              <div key={i} className="w-full flex flex-col space-y-1">
                {m.thinking && m.thinking.length > 0 && (
                  <div className="flex gap-1.5 text-muted-foreground text-xs">
                    <Lightbulb className="size-3.5" />
                    <span>{m.thinking}</span>
                  </div>
                )}
                <MessageBubble role={m.role} content={m.content} />
              </div>
            ))}
          </React.Fragment>
        )}
      </div>

      <div className="w-full pb-2">
        <ChatInput isLoading={isLoading} onSend={handleSend} />
      </div>
    </div>
  ) : (
    <div className="">Loading...</div>
  );
}
