import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function Notice() {
  return (
    <Alert>
      <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} />
      <AlertTitle>Mobile app coming soon</AlertTitle>
      <AlertDescription>
        We're moving this project to React Native so we can ship a proper
        iOS/Android app. Web stays up while we migrate.
      </AlertDescription>
      <AlertAction>
        <Button variant={"ghost"} size={"icon"}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </AlertAction>
    </Alert>
  );
}
