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
