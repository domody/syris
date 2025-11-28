export function SidebarLayout({
  sidebar,
  children,
}: React.PropsWithChildren<{
  sidebar: React.ReactNode;
}>) {
  return (
    <div className="flex transition-[width] duration-300 w-full">
      {sidebar}
      <main className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
