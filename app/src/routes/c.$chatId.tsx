import { createFileRoute } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/navigation/chat-sidebar";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Chat } from "@/components/chat/Chat";

export const Route = createFileRoute("/c/$chatId")({
  component: RouteComponent,
  // loader: async ({ context, params }) => {
  //     if (params.chatId !== "new") {
  //         console.log(params.chatId)
  //     }
  // }
});

function RouteComponent() {
  const { chatId } = Route.useParams();

  // Call necessary hooks

  // Cases

  if (chatId == "new") {
    return (
      <SidebarLayout sidebar={<ChatSidebar />}>
        <Chat chatId={chatId} />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout sidebar={<ChatSidebar />}>
      <Chat chatId={chatId} />
    </SidebarLayout>
  );
}
