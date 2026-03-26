import { Geist, Geist_Mono, Figtree } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "../../../packages/ui/src/lib/utils"
import { AppSidebar } from "@/components/app-sidebar"
import { Topbar } from "@/components/topbar"

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
        fontMono.variable,
        "overflow-x-hidden font-sans",
        figtree.variable
      )}
    >
      <body className="flex min-h-screen flex-col [--header-height:calc(var(--spacing)*11)]">
        <ThemeProvider>
          <Topbar />
          <div className="flex-1# flex w-full">
            <AppSidebar />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
