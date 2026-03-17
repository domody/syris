"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDocsSearch } from "fumadocs-core/search/client";
import { Search, ArrowRight, FileText, CornerDownLeft } from "lucide-react";

import { getCurrentBase, getPagesFromFolder } from "@/lib/page-tree";
import { source } from "@/lib/source";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "../ui/kbd";

export function SearchCommand({
  tree,
  className,
}: {
  tree: typeof source.pageTree;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentBase = getCurrentBase(pathname);

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const { setSearch, query } = useDocsSearch({ type: "fetch" });

  // Debounce the fumadocs search so it's not firing on every keystroke,
  // but keep inputValue in sync immediately for the client-side page filter.
  React.useEffect(() => {
    const timeout = setTimeout(() => setSearch(inputValue), 300);
    return () => clearTimeout(timeout);
  }, [inputValue, setSearch]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset search state when the dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      setSearch("");
    }
  }, [open, setSearch]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  // Flatten all pages from the tree once
  const allPages = React.useMemo(() => {
    const pages: { url: string; name: string; group: string }[] = [];
    for (const group of tree.children) {
      if (group.type !== "folder") continue;
      for (const page of getPagesFromFolder(group, currentBase)) {
        if (page.name) {
          pages.push({
            url: page.url,
            name: page.name.toString(),
            group: group.name as string,
          });
        }
      }
    }
    return pages;
  }, [tree.children, currentBase]);

  // Group 1: pages whose *name* matches the query (client-side)
  const matchedPages = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return allPages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q),
    );
  }, [inputValue, allPages]);

  // Group 2: fumadocs content-level search results, deduplicated and stripped
  // of single-word text hits. We also exclude any URL already shown above
  // so the two groups don't overlap.
  const matchedPageUrls = React.useMemo(
    () => new Set(matchedPages.map((p) => p.url)),
    [matchedPages],
  );

  const liveResults = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    if (!query.data || query.data === "empty" || !Array.isArray(query.data))
      return [];

    return query.data.filter(
      (item, index, self) =>
        !matchedPageUrls.has(item.url) &&
        !(
          item.type === "text" && item.content.trim().split(/\s+/).length <= 1
        ) &&
        index === self.findIndex((t) => t.content === item.content),
    );
  }, [inputValue, query.data, matchedPageUrls]);

  const isSearching = inputValue.trim().length > 0;

  // Full tree view shown when not searching
  const pageGroupsSection = React.useMemo(() => {
    return tree.children.map((group) => {
      if (group.type !== "folder") return null;
      const pages = getPagesFromFolder(group, currentBase);
      if (pages.length === 0) return null;

      return (
        <CommandGroup key={group.$id} heading={group.name}>
          {pages.map((item) => (
            <CommandItem
              key={item.url}
              value={`${group.name} ${item.name}`}
              onSelect={() => runCommand(() => router.push(item.url))}
            >
              <ArrowRight className="mr-2 size-4 text-muted-foreground" />
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
      );
    });
  }, [tree.children, currentBase, runCommand, router]);

  return (
    <div className={className}>
      <Button onClick={() => setOpen(true)} variant="outline" className={"min-w-48 xl:min-w-64"}>
        <Search data-icon="inline-start" />
        Search...
        <Kbd className="ml-auto">
          <span>⌘</span>K
        </Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="sm:max-w-lg w-full"
      >
        <Command shouldFilter={false}>
          {/*
            shouldFilter={false} disables cmdk's built-in fuzzy filter entirely.
            We handle all filtering ourselves: matchedPages is client-side,
            liveResults comes from fumadocs. Without this, cmdk would re-filter
            our already-filtered results and hide things unexpectedly.
          */}
          <CommandInput
            placeholder="Search documentation..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList className="max-h-75">
            <CommandEmpty>
              {query.isLoading ? "Searching..." : "No results found."}
            </CommandEmpty>

            {isSearching ? (
              <>
                {/* Group 1 — page name matches */}
                {matchedPages.length > 0 && (
                  <CommandGroup heading="Pages">
                    {matchedPages.map((page) => (
                      <CommandItem
                        key={page.url}
                        value={page.url}
                        onSelect={() => runCommand(() => router.push(page.url))}
                      >
                        <ArrowRight className="mr-2 size-4 text-muted-foreground" />
                        <div className="flex items-center justify-between w-full">
                          <span className="overflow-hidden line-clamp-1">
                            {page.name}
                          </span>
                          <span className="pl-4 text-xs text-muted-foreground">
                            {page.group}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Group 2 — fumadocs content matches */}
                {liveResults.length > 0 && (
                  <CommandGroup heading="In content">
                    {liveResults.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => runCommand(() => router.push(item.url))}
                      >
                        <FileText className="mr-2 size-4 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1 text-sm">
                          {item.content}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              pageGroupsSection
            )}
          </CommandList>
          <div className="w-full p-1 pt-0">
            <div className="h-10 bg-input/30 rounded-lg flex items-center px-2 gap-2">
              <Kbd className="pointer-events-none flex h-5 items-center justify-center gap-1 rounded border bg-background px-1 text-[0.7rem] font-medium text-muted-foreground select-none [&_svg:not([class*='size-'])]:size-3">
                <CornerDownLeft />
              </Kbd>
              <span className="text-xs text-muted-foreground">Go to page</span>
            </div>
          </div>
        </Command>
      </CommandDialog>
    </div>
  );
}
