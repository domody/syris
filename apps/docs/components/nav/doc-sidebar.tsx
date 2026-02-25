"use client";

import { source } from "@/lib/source";
import { getCurrentBase, getPagesFromFolder } from "@/lib/page-tree";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DocSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: typeof source.pageTree }) {
  const pathname = usePathname();
  const currentBase = getCurrentBase(pathname);

  return (
    <Sidebar className="sticky top-[calc(var(--header-height)+0.6rem)] z-30 hidden h-[calc(100svh-10rem)] overscroll-none bg-transparent lg:flex" collapsible="none" {...props}>
      <SidebarContent className="no-scrollbar w-(--sidebar-menu-width) overflow-x-hidden pl-0">
        {tree.children.map((item) => {
          return (
            <SidebarGroup className="w-full" key={item.$id}>
              <SidebarGroupLabel className="text-muted-foreground font-medium">
                {item.name} 
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {item.type === "folder" && (
                  <SidebarMenu className="gap-0.5">
                    {getPagesFromFolder(item, currentBase).map((page) => {
                      return (
                        <SidebarMenuItem key={page.url}>
                          <SidebarMenuButton
                            isActive={page.url === pathname}
                            className="w-full data-[active=true]:bg-accent data-[active=true]:border-accent 3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md"
                            render={
                              <Link href={page.url}>
                                <span className="absolute inset-0 flex w-(--sidebar-menu-width)" />
                                <span>{page.name}</span>
                                {/* {PAGES_NEW.includes(page.url) && (
                                <span
                                  className="flex size-2 rounded-full bg-blue-500"
                                  title="New"
                                />
                              )} */}
                              </Link>
                            }
                          />
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
