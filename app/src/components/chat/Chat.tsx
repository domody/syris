import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendMessageToSyris } from "@/lib/api";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { streamSyrisMessage } from "@/lib/stream";
import { Lightbulb } from "lucide-react";

export function Chat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant" | "system";
      content: string;
      thinking?: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: sendMessageToSyris,
    onMutate: (userMessage: string) => {
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (err, userMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Failed to send: ${userMessage} \n\n Error: ${err}`,
        },
      ]);
    },
  });

  async function handleSend(message: string) {
    mutation.mutate(message);
  }

  async function sendStreaming(msg: string) {
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", thinking: "" },
    ]);

    setIsLoading(true);

    let accumulated_content = "";
    let accumulated_thinking = "";

    streamSyrisMessage(
      msg,
      (token) => {
        accumulated_thinking += token;

        setMessages((prev) => {
          const copy = [...prev];
          const lastIndex = copy.length - 1;

          copy[lastIndex] = {
            ...copy[lastIndex],
            thinking: accumulated_thinking,
          };

          return copy;
        });
      },
      (token) => {
        accumulated_content += token;

        setMessages((prev) => {
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

  return (
    <div className="flex flex-col w-full h-screen relative max-w-2xl mx-auto">
      <div className="w-full h-full px-2 pt-8 pb-8 overflow-y-auto space-y-8 no-scrollbar">
        {chatId == "new" && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col">
            <h2 className="font-bold text-lg">S.Y.R.I.S</h2>
            <p className="text-muted-foreground">alpha version</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="w-full flex flex-col space-y-1">
              {m.thinking && m.thinking.length > 0 && (
                <div className="flex gap-1.5 text-muted-foreground text-xs">
                  <Lightbulb className="size-3.5" />
                  <span>{m.thinking}</span>
                </div>
              )}
              <MessageBubble role={m.role} content={m.content} />
            </div>
          ))
        )}
      </div>

      <div className="w-full pb-2">
        <ChatInput isLoading={isLoading} onSend={sendStreaming} />
      </div>
    </div>
  );
}
