import { redirect } from "next/navigation";

export default function Page() {
        redirect("/login")

        return (
            <div className="w-screen h-screen flex items-center justify-center">
                <p>How are you here...</p>
            </div>
        )
}