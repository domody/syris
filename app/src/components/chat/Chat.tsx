import { ChatInput } from "./ChatInput";

export function Chat({ chatId }: { chatId: string }) {
  return (
    <div className="flex flex-col w-full h-screen relative max-w-3xl mx-auto">
      <div className="w-full h-full px-2">{chatId}</div>
      <div className="w-full pb-2">
        <ChatInput />
      </div>
    </div>
  );
}
