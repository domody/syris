export function streamSyrisMessage(
  message: string,
  onThinking: (token: string) => void,
  onContent: (token: string) => void,
  onDone: () => void
) {
  const url = `http://127.0.0.1:4311/syris/stream?message=${encodeURIComponent(
    message
  )}`;

  const es = new EventSource(url);

  es.onmessage = (e) => {
    const parsed = JSON.parse(e.data);

    if (parsed.type === "end") {
      es.close();
      onDone();
      return;
    }

    if (parsed.type === "thinking") onThinking(parsed.token);
    if (parsed.type === "content") onContent(parsed.token);
  };

  es.onerror = (err) => {
    console.error("Stream error:", err);
    es.close();
    onDone();
  };

  return () => es.close();
}
