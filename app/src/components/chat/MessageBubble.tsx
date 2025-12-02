import { Streamdown } from "streamdown";

export function MessageBubble({
  role,
  content,
  isLoading,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  isLoading: boolean;
}) {
  // User's bubble
  if (role == "user") {
    return (
      <div className="text-left max-w-96 ml-auto flex items-start justify-end">
        <span className="inline-block rounded-lg px-3 py-2 bg-card">
          {content}
        </span>
      </div>
    );
  }

  //   Models bubble
  return (
    <div className="text-left w-full">
      <Streamdown
        className="inline-block w-full"
        isAnimating={role === "assistant" && isLoading === true}
      >
        {content}
      </Streamdown>
    </div>
  );
}
