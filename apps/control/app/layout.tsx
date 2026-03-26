import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google"
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers/providers";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})


export const metadata: Metadata = {
  title: "syris-control",
  description: "Mission Control for SYRIS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning       className={cn(
        fontMono.variable,
        "overflow-x-hidden font-sans",
        figtree.variable
      )}>
      <body
        className={`min-h-screen [--header-height:calc(var(--spacing)*14)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
