"use client"

import { AppSidebar } from "@/components/nav/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useSSEStream } from "@/lib/sse"

export default function ProtectedLayout({ children }: { children: React.ReactNode}) {
    useSSEStream()
    
    return (
        <SidebarProvider>
            <AppSidebar />
            {children}
        </SidebarProvider>
    )
}