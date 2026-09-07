import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Clock,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  title?: string;
  created_at: string;
  read: boolean;
};

const KIND_META: Record<string, { icon: LucideIcon; className: string }> = {
  overdue: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  rejected: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive" },
  approved: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  comment: { icon: MessageSquare, className: "bg-primary/10 text-primary" },
  workflow: { icon: Workflow, className: "bg-primary/10 text-primary" },
};

const FALLBACK = { icon: Clock, className: "bg-muted text-muted-foreground" };

export function NotificationRow({ notification }: { notification: NotificationRow }) {
  const meta = getKindMeta(notification.type);
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        notification.read ? "hover:bg-muted/50" : "bg-primary/[0.04] hover:bg-primary/[0.07]",
      )}
    >
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.className)}>
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] leading-snug",
            notification.read ? "text-muted-foreground" : "font-medium text-foreground",
          )}
        >
          {notification.message}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
      )}
    </div>
  );
}

function getKindMeta(type: string) {
  for (const [key, meta] of Object.entries(KIND_META)) {
    if (type.includes(key)) return meta;
  }
  return FALLBACK;
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
