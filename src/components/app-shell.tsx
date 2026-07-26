import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Workflow,
  CalendarDays,
  Bell,
  BarChart3,
  ScrollText,
  FolderOpen,
  Building2,
  Boxes,
  ShieldCheck,
  UserCog,
  ChevronDown,
  Menu,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

/** The 5 things people use every day. Everything else lives under "More". */
const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/team-queue", label: "Team", icon: Users },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/week-plan", label: "Week Plan", icon: CalendarDays },
];

const moreNav: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText },
];

const adminNav: NavItem[] = [
  { to: "/admin/brands", label: "Brands", icon: Building2 },
  { to: "/admin/departments", label: "Departments", icon: Boxes },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
  { to: "/admin/employees", label: "Employees", icon: UserCog },
];

const allNav = [...primaryNav, ...moreNav, ...adminNav];

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">D</div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Danfe × NTE</div>
        <div className="text-xs text-muted-foreground">Workflow Platform</div>
      </div>
    </div>
  );
}

function NavSections({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <NavList items={primaryNav} pathname={pathname} onNavigate={onNavigate} />
      <SectionLabel className="mt-6">More</SectionLabel>
      <NavList items={moreNav} pathname={pathname} onNavigate={onNavigate} />
      <SectionLabel className="mt-6">Admin</SectionLabel>
      <NavList items={adminNav} pathname={pathname} onNavigate={onNavigate} />
    </>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <BrandMark />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <NavSections pathname={pathname} />
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-primary text-xs">PR</AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">Pratik R.</div>
            <div className="truncate text-xs text-muted-foreground">Team Lead · Ops</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.to);
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/12 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
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

function MobileMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <BrandMark />
        </div>
        <nav className="p-3">
          <NavSections pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Current page title, so users always know where they are. */
function CurrentPageTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const match = allNav
    .filter((n) => isActive(pathname, n.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return <span className="truncate text-sm font-semibold">{match?.label ?? "Overview"}</span>;
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-6">
      <MobileMenu />
      <span className="lg:hidden">
        <CurrentPageTitle />
      </span>
      <div className="hidden lg:block">
        <BrandSwitcher />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Plus className="h-4 w-4" /> New
        </Button>
        <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}

/** Bottom tabs give one-tap access to the 5 core pages on small screens. */
function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
      {primaryNav.map((item) => {
        const active = isActive(pathname, item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
              active ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pl-2 pr-2.5">
          <div className="grid h-6 w-6 place-items-center rounded bg-accent text-accent-foreground text-xs font-bold">DT</div>
          <span className="text-sm font-medium">Danfe Tea</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="grid h-6 w-6 place-items-center rounded bg-accent text-accent-foreground text-xs font-bold">DT</div>
          Danfe Tea
          <Badge variant="secondary" className="ml-auto">Active</Badge>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="grid h-6 w-6 place-items-center rounded bg-primary/15 text-primary text-xs font-bold">NT</div>
          Nepal Tea Exchange
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/workspace">All workspaces</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/15 text-primary text-xs">PR</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View as (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/dashboard">Employee</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/dashboard/team-lead">Team Lead</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/dashboard/admin">Admin</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/login">Sign out</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
