import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$noteId")({
  component: () => <div>Note page</div>,
});
