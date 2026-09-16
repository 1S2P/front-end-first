import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListTodo, Bell, Workflow, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { useTaskBadgeCount } from "@/lib/api/tasks";
import { useUnreadCount } from "@/lib/api/notifications";

export function BottomNav({ onOpenSheet }: { onOpenSheet: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentBrandId, currentRole } = useApp();
  const taskBadge = useTaskBadgeCount(currentBrandId);
  const unreadCount = useUnreadCount();
  const isAdmin = currentRole === "admin";

  const items = isAdmin
    ? [
        { to: "/dashboard", label: "Home", icon: LayoutDashboard, badge: 0 },
        { to: "/tasks", label: "Tasks", icon: ListTodo, badge: taskBadge },
        { to: "/workflows", label: "Workflows", icon: Workflow, badge: 0 },
      ]
    : [
        { to: "/dashboard", label: "Home", icon: LayoutDashboard, badge: 0 },
        { to: "/tasks", label: "Tasks", icon: ListTodo, badge: taskBadge },
        { to: "/notifications", label: "Alerts", icon: Bell, badge: unreadCount },
      ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card px-2 lg:hidden"
    >
      {items.map((i) => (
        <BottomTab
          key={i.to}
          to={i.to}
          label={i.label}
          icon={i.icon}
          badge={i.badge}
          active={pathname === i.to || pathname.startsWith(i.to + "/")}
        />
      ))}
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label="More menu"
        className="flex flex-col items-center gap-1 px-3 text-muted-foreground"
      >
        <Menu className="h-5 w-5" aria-hidden />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}

function BottomTab({
  to,
  label,
  icon: Icon,
  badge,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge: number;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 px-3",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <div className="relative">
        <Icon className="h-5 w-5" aria-hidden />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{label}</span>
    </Link>
  );
}