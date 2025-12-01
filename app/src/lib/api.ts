import { ChatResponse, MessagesReponse } from "@/types";

export async function getChats(): Promise<ChatResponse[]> {
  const response = await fetch(`http://127.0.0.1:4311/data/chats`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to retreive chats");
  }

  const data = await response.json();
  return data;
}


export async function getChat(chatId: string): Promise<MessagesReponse[]> {
  const response = await fetch(
    `http://127.0.0.1:4311/data/chats/${chatId}/messages`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to retrieve chat messages");
  }

  const data = await response.json();
  return data;
}

export async function sendMessageToSyris(message: string) {
  const response = await fetch("http://127.0.0.1:4311/syris/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message to SYRIS");
  }

  return response.json() as Promise<{ response: string }>;
}
