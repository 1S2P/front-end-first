import { Outlet } from "@tanstack/react-router";
import { useState, useCallback, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { BottomNav } from "@/components/shell/bottom-nav";

export { PageHeader } from "@/components/page-header";

const SIDEBAR_COLLAPSE_KEY = "sidebar:collapsed";

function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // ignore — SSR or quota error
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

export function AppShell() {
  const { collapsed, toggle } = useSidebarCollapse();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />

      {/* Mobile sheet sidebar */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar collapsed={false} onToggleCollapse={() => setMobileSheetOpen(false)} onNavigate={() => setMobileSheetOpen(false)} className="flex w-72 border-r-0" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMobileMenu={() => setMobileSheetOpen(true)} />
        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden">
        <BottomNav onOpenSheet={() => setMobileSheetOpen(true)} />
      </div>
    </div>
  );
}
