import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/navigation/app-sidebar";
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
      <SidebarLayout sidebar={<AppSidebar />}>
        <Chat chatId={chatId} />
      </SidebarLayout>
    );
  } else {
    return (
      <div className="">
        <AppSidebar />
        <p>S.Y.R.I.S</p>
        <p>Existing Chat</p>
      </div>
    );
  }
}
