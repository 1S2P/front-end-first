import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
  Search,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/team-queue", label: "Team Queue", icon: Users },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/week-plan", label: "Week Plan", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText },
];

const adminNav: NavItem[] = [
  { to: "/admin/brands", label: "Brands", icon: Building2 },
  { to: "/admin/departments", label: "Departments", icon: Boxes },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
  { to: "/admin/employees", label: "Employees", icon: UserCog },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
          D
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Danfe × NTE</div>
          <div className="text-xs text-muted-foreground">Workflow Platform</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <SectionLabel>Workspace</SectionLabel>
        <NavList items={mainNav} pathname={pathname} />
        <SectionLabel className="mt-6">Admin</SectionLabel>
        <NavList items={adminNav} pathname={pathname} />
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

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <Link
              to={item.to}
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

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
      <BrandSwitcher />
      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks, workflows, people…" className="pl-9 bg-muted/60 border-transparent focus-visible:bg-card" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New
        </Button>
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
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
