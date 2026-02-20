import { source } from "@/lib/source";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DocSidebar } from "@/components/nav/doc-sidebar";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <div className="flex flex-1 flex-col container">
      <SidebarProvider
        className="3xl:fixed:container 3xl:fixed:px-3 min-h-min flex-1 items-start px-0 [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:[--top-spacing:calc(var(--spacing)*4)]"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
          } as React.CSSProperties
        }
      >
        <DocSidebar tree={source.pageTree} />
        {children}
      </SidebarProvider>
    </div>
  );
}
