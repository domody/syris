import { Figtree, Geist_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { PipelinePauseBanner } from "@/components/pipeline-pause-banner"
import { ToastLayer } from "@/components/toast-layer"
import { SidebarInset } from "@workspace/ui/components/sidebar"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
      )}
    >
      <body>
        <Providers>
          <AppSidebar />
          <SidebarInset>
            <PipelinePauseBanner />
            <TopBar />
            <div className="flex-1 overflow-auto">{children}</div>
          </SidebarInset>
          <ToastLayer />
        </Providers>
      </body>
    </html>
  )
}
