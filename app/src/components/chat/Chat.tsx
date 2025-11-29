import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendMessageToSyris } from "@/lib/api";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { streamSyrisMessage } from "@/lib/stream";

export function Chat({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant" | "system";
      content: string;
    }[]
  >([]);
  const [isThinking, setIsThinking] = useState(false);

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

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    setIsThinking(true);

    let accumulated = "";

    streamSyrisMessage(
      msg,
      (token) => {
        console.log("Token: ", token);
        accumulated += token;

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return copy;
        });
      },
      () => {
        setIsThinking(false);
        console.log(messages);
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
            <>
              <MessageBubble key={i} role={m.role} content={m.content} />
            </>
          ))
        )}
      </div>
      <div className="w-full pb-2">
        <ChatInput onSend={sendStreaming} />
      </div>
    </div>
  );
}
