import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={"ghost"} size={"icon"}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>
                I'm too lazy to setup a database to close this
              </AlertDialogTitle>
              <AlertDialogDescription>
                For now, the modal is permenantly here until you both message me
                you've seen it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Okay</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AlertAction>
    </Alert>
  );
}
