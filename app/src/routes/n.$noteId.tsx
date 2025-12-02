import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { NoteSidebar } from "@/components/navigation/note-sidebar";
import { Note } from "@/components/note/Note";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/n/$noteId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { noteId } = Route.useParams();

  if (noteId == "new") {
    return (
      <SidebarLayout sidebar={<NoteSidebar />}>
        <Note />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout sidebar={<NoteSidebar />}>
      <Note />
    </SidebarLayout>
  );
}
