import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$chatId")({
    component: RouteComponent,
    // loader: async ({ context, params }) => {
    //     if (params.chatId !== "new") {
    //         console.log(params.chatId)
    //     }
    // }
})

function RouteComponent() {
    const { chatId } = Route.useParams();

    // Call necessary hooks

    // Cases

    if (chatId == "new") {
        return (
            <div className="">
                <p>S.Y.R.I.S</p>
                <p>New Chat</p>
            </div>
        )
    }
    else {
        return (
            <div className="">
                <p>S.Y.R.I.S</p>
                <p>Existing Chat</p>
            </div>
        )
    }
}