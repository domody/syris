import { Sidebar } from "../ui/sidebar";
import { AppSidebar } from "../navigation/app-sidebar";

export function SidebarLayout({
  sidebar,
  children,
}: React.PropsWithChildren<{
  sidebar: React.ReactNode;
}>) {
  return (
    <div className="flex transition-[width] duration-300 w-full">
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      >
        {/* First */}
        <AppSidebar subNav={sidebar} />

      </Sidebar>
      <main className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
