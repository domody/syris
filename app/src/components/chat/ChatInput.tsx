import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUp } from "lucide-react";

export function ChatInput() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Ask, Send or Chat..." />
      <InputGroupAddon align={"block-end"}>
        <InputGroupButton
          className="rounded-full ml-auto"
          size={"icon-xs"}
          disabled
        >
          <ArrowUp />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
