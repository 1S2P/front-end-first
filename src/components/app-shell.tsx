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
  Settings,
  ChevronDown,
  Search,
  Menu,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

// Simplified: 5 everyday destinations, everything else lives under "More".
const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/team-queue", label: "Team Queue", icon: Users },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/week-plan", label: "Week Plan", icon: CalendarDays },
];

const moreNav: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText },
];

const adminNav: NavItem[] = [
  { to: "/admin/brands", label: "Brands" },
  { to: "/admin/departments", label: "Departments" },
  { to: "/admin/roles", label: "Roles & Permissions" },
  { to: "/admin/employees", label: "Employees" },
].map((i) => ({ ...i, icon: Settings }));

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
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

const bottomNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/week-plan", label: "Plan", icon: CalendarDays },
];

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[4.5rem] items-center justify-around border-t border-border bg-card px-2 pb-2 lg:hidden">
      {bottomNav.slice(0, 2).map((i) => (
        <BottomTab key={i.to} item={i} active={pathname === i.to || pathname.startsWith(i.to + "/")} />
      ))}
      <Link
        to="/team-queue"
        aria-label="Team Queue"
        className="grid h-12 w-12 -translate-y-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
      >
        <Users className="h-5 w-5" />
      </Link>
      {bottomNav.slice(2).map((i) => (
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


function BrandMark() {
  return (
    <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">D</div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Danfe × NTE</div>
        <div className="text-xs text-muted-foreground">Workflow Platform</div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showMore, setShowMore] = useState(() => moreNav.some((i) => pathname.startsWith(i.to)));
  const [showAdmin, setShowAdmin] = useState(() => pathname.startsWith("/admin"));

  return (
    <>
      <BrandMark />
      <nav className="flex-1 overflow-y-auto p-3">
        <NavList items={mainNav} pathname={pathname} onNavigate={onNavigate} />

        <SectionToggle open={showMore} onClick={() => setShowMore((v) => !v)} label="More" className="mt-4" />
        {showMore && <NavList items={moreNav} pathname={pathname} onNavigate={onNavigate} />}

        <SectionToggle open={showAdmin} onClick={() => setShowAdmin((v) => !v)} label="Admin" className="mt-4" />
        {showAdmin && <NavList items={adminNav} pathname={pathname} onNavigate={onNavigate} />}
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
    </>
  );
}

function SectionToggle({
  label,
  open,
  onClick,
  className,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent",
        className,
      )}
    >
      {label}
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
    </button>
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

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-6">
      <MobileNav />
      <BrandSwitcher />
      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks, workflows, people…" className="pl-9 bg-muted/60 border-transparent focus-visible:bg-card" />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Link to="/notifications" className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Link>
        <RoleSwitcher />
      </div>
    </header>
  );
}

function BrandSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pl-2 pr-2.5">
          <div className="grid h-6 w-6 place-items-center rounded bg-accent text-accent-foreground text-xs font-bold">DT</div>
          <span className="hidden text-sm font-medium sm:inline">Danfe Tea</span>
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
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
