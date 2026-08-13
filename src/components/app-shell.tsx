import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Workflow,
  Bell,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  Briefcase,
  Users,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/lib/app-context";
import { useBrands } from "@/lib/api/admin";
import { useUnreadCount } from "@/lib/api/notifications";
import { useSignOut } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/global-search";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks",     label: "My Tasks",  icon: ListTodo },
  { to: "/projects",  label: "Projects",  icon: Briefcase },
  { to: "/workflows", label: "Workflows", icon: Workflow },
];

const moreNav: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports",       label: "Reports",        icon: BarChart3 },
];

const adminNav: NavItem[] = [
  { to: "/admin/brands",      label: "Brands",              icon: Settings },
  { to: "/admin/departments", label: "Departments",          icon: Users },
  { to: "/admin/employees",   label: "Employees",            icon: Users },
  { to: "/admin/roles",       label: "Roles & Permissions",  icon: CheckCircle2 },
];

const ADMIN_NAV_PERMISSIONS: Record<string, string> = {
  "/admin/brands": "admin_manage_brands",
  "/admin/departments": "admin_manage_departments",
  "/admin/employees": "admin_manage_employees",
  "/admin/roles": "admin_assign_permissions",
};

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const bottomItems: NavItem[] = [
    { to: "/dashboard", label: "Home",     icon: LayoutDashboard },
    { to: "/tasks",     label: "Tasks",    icon: ListTodo },
    { to: "/projects",  label: "Projects", icon: Briefcase },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card px-2 lg:hidden">
      {bottomItems.map((i) => (
        <BottomTab key={i.to} item={i} active={pathname === i.to || pathname.startsWith(i.to + "/")} />
      ))}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="flex flex-col items-center gap-1 px-3 text-muted-foreground">
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function BottomTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn("flex flex-col items-center gap-1 px-3", active ? "text-primary" : "text-muted-foreground")}
    >
      <Icon className="h-5 w-5" />
      <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{item.label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentBrandId, setCurrentBrandId, currentRole, currentUser, hasPermission } = useApp();
  const { data: brands = [] } = useBrands();
  const [showMore, setShowMore]   = useState(() => moreNav.some((i) => pathname.startsWith(i.to)));
  const [showAdmin, setShowAdmin] = useState(() => pathname.startsWith("/admin"));

  // Filter to only brands the current user belongs to
  const userBrands = currentUser
    ? brands.filter((b) => currentUser.brandIds.includes(b.id))
    : brands;

  const currentBrand = brands.find((b) => b.id === currentBrandId);

  const visibleAdminNav = adminNav.filter((i) =>
    currentRole === "admin" || hasPermission(ADMIN_NAV_PERMISSIONS[i.to]),
  );

  return (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-xs font-bold", currentBrand?.color)}>
          {currentBrand?.initials ?? "…"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{currentBrand?.name ?? "Loading…"}</div>
          <div className="text-[11px] text-muted-foreground">Workflow Platform</div>
        </div>
      </div>

      {/* Brand Switcher */}
      {userBrands.length > 1 && (
        <div className="px-3 pt-3 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <div className={cn("grid h-6 w-6 place-items-center rounded text-[10px] font-bold", currentBrand?.color)}>
                  {currentBrand?.initials}
                </div>
                <span className="flex-1 text-left truncate font-medium">{currentBrand?.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userBrands.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => setCurrentBrandId(b.id)}>
                  <div className={cn("grid h-6 w-6 place-items-center rounded text-[10px] font-bold", b.color)}>
                    {b.initials}
                  </div>
                  {b.name}
                  {b.id === currentBrandId && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <NavList items={mainNav} pathname={pathname} onNavigate={onNavigate} />

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent"
        >
          More
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !showMore && "-rotate-90")} />
        </button>
        {showMore && <NavList items={moreNav} pathname={pathname} onNavigate={onNavigate} />}

        {visibleAdminNav.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowAdmin((v) => !v)}
              className="mt-4 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent"
            >
              Admin
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !showAdmin && "-rotate-90")} />
            </button>
            {showAdmin && <NavList items={visibleAdminNav} pathname={pathname} onNavigate={onNavigate} />}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <UserMenu />
      </div>
    </>
  );
}

function UserMenu() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate({ to: "/login" });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className={cn("text-xs", currentUser.avatar_color)}>
              {currentUser.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left leading-tight">
            <div className="truncate text-sm font-medium">{currentUser.name}</div>
            <div className="truncate text-[11px] text-muted-foreground capitalize">
              {currentUser.role.replace("_", " ")}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground">{currentUser.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavList({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5 py-1">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TopBar() {
  const { currentUser, currentBrandId } = useApp();
  const { data: brands = [] } = useBrands();
  const unreadCount = useUnreadCount();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const currentBrand = brands.find((b) => b.id === currentBrandId);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:px-6">
      {/* Mobile brand mark */}
      <div className="lg:hidden">
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg text-xs font-bold", currentBrand?.color)}>
          {currentBrand?.initials}
        </div>
      </div>

      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Link
          to="/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="hidden sm:block">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={cn("text-xs", currentUser.avatar_color)}>
                      {currentUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Skeleton className="h-8 w-8 rounded-full" />
          )}
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
