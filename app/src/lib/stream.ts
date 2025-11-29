export function streamSyrisMessage(
  message: string,
  onToken: (token: string) => void,
  onDone: () => void
) {
  const url = `http://127.0.0.1:4311/syris/stream?message=${encodeURIComponent(
    message
  )}`;

  const es = new EventSource(url);

  es.onmessage = (e) => {
    const parsed = JSON.parse(e.data);

    if (parsed.token === "[END]") {
      es.close();
      onDone();
      return;
    }

    onToken(parsed.token);
  };

  es.onerror = (err) => {
    console.error("Stream error:", err);
    es.close();
    onDone();
  };

  return () => es.close();
}
