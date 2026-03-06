import { AppSidebar } from "@/components/nav/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function ProtectedLayout({ children }: { children: React.ReactNode}) {

    return (
        <SidebarProvider>
            <AppSidebar />
            {children}
        </SidebarProvider>
    )
}