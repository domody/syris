import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUp } from "lucide-react";

export function ChatInput({
  isLoading,
  onSend,
}: {
  isLoading: boolean;
  onSend: (msg: string) => void;
}) {
  const [value, setValue] = useState<string>("");

  function submit() {
    const msg = value.trim();
    if (!msg) return;

    onSend(msg);
    setValue("");
  }

  return (
    <InputGroup>
      <InputGroupTextarea
        placeholder="Ask, Send or Chat..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />

      <InputGroupAddon align={"block-end"}>
        <InputGroupButton
          variant={"default"}
          className="rounded-full ml-auto"
          size="icon-xs"
          disabled={isLoading}
          onClick={submit}
        >
          <ArrowUp />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
