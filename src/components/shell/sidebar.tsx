import { Link, useRouterState } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronsUpDown, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { useBrands } from "@/lib/api/admin";
import { useTaskBadgeCount } from "@/lib/api/tasks";
import { useUnreadCount } from "@/lib/api/notifications";
import { useSignOut } from "@/lib/api/auth";
import { NAV_GROUPS, type NavItem } from "@/components/shell/nav";
import { UserMenu } from "@/components/shell/user-menu";

const SIDEBAR_WIDTH = "w-64";
const SIDEBAR_COLLAPSED_WIDTH = "w-[68px]";

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  className,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentBrandId, currentRole, hasPermission } = useApp();
  const taskBadge = useTaskBadgeCount(currentBrandId);
  const unreadCount = useUnreadCount();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate({ to: "/login", search: { redirect: "/dashboard" } });
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out lg:flex",
        collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        className,
      )}
    >
      <BrandHeader collapsed={collapsed} />
      <div className={cn("shrink-0", collapsed ? "px-2 py-2" : "px-3 pb-2 pt-1")}>
        <BrandSwitcher collapsed={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((i) =>
            group.label === "Manage"
              ? currentRole === "admin" || hasPermission(i.permission ?? "")
              : true,
          );
          if (visible.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                  {group.label}
                </div>
              )}
              <nav className="space-y-0.5">
                {visible.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    badge={
                      item.to === "/tasks" ? taskBadge : item.to === "/notifications" ? unreadCount : 0
                    }
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex flex-col gap-1">
          <div className={cn("flex items-center gap-1", collapsed && "flex-col gap-2")}>
            <UserMenu collapsed={collapsed} />
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className={cn(
                    "hidden h-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:inline-flex",
                    collapsed ? "w-9" : "ml-1 h-9 w-9 shrink-0",
                  )}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" aria-hidden />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
          </div>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className="flex h-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export function BrandHeader({ collapsed }: { collapsed: boolean }) {
  const { currentBrandId, setCurrentBrandId } = useApp();
  const { data: brands = [] } = useBrands();
  const { currentUser } = useApp();
  const userBrands = currentUser
    ? brands.filter((b) => currentUser.brandIds.includes(b.id))
    : brands;
  const currentBrand = brands.find((b) => b.id === currentBrandId);

  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border",
        collapsed ? "justify-center px-2" : "px-5",
      )}
    >
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold", currentBrand?.color)}>
        {currentBrand?.initials ?? "…"}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{currentBrand?.name ?? "Loading…"}</div>
          <div className="text-[11px] text-muted-foreground">Workflow OS</div>
        </div>
      )}
    </div>
  );
}

export function BrandSwitcher({ collapsed }: { collapsed: boolean }) {
  const { currentBrandId, setCurrentBrandId } = useApp();
  const { data: brands = [] } = useBrands();
  const { currentUser } = useApp();
  const userBrands = currentUser
    ? brands.filter((b) => currentUser.brandIds.includes(b.id))
    : brands;

  const currentBrand = brands.find((b) => b.id === currentBrandId);

  if (userBrands.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch workspace"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
          )}
        >
          <div className={cn("grid h-6 w-6 shrink-0 place-items-center rounded text-[10px] font-bold", currentBrand?.color)}>
            {currentBrand?.initials}
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left font-medium">{currentBrand?.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userBrands.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => setCurrentBrandId(b.id)}>
            <div className={cn("grid h-6 w-6 place-items-center rounded text-[10px] font-bold", b.color)}>
              {b.initials}
            </div>
            {b.name}
            {b.id === currentBrandId && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  badge: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = pathname === item.to || pathname.startsWith(item.to + "/");

  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors duration-150",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {active && (
        <span
          className="absolute left-0 h-5 w-[3px] rounded-r-full bg-primary"
          style={{ top: "50%", transform: "translateY(-50%)" }}
          aria-hidden
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} aria-hidden />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          <span>{item.label}</span>
          {badge > 0 && <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{badge}</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}