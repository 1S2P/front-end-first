import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Workflow,
  ClipboardCheck,
  Clock,
  AlertCircle,
  Undo2,
  FileText,
  Send,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useNotifications, useMarkAllRead, useMarkNotificationRead } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/database.types";

export const Route = createFileRoute("/_shell/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Danfe x NTE" },
      { name: "description", content: "All alerts across your tasks and workflows." },
      { property: "og:title", content: "Notifications" },
    ],
  }),
  component: Notifications,
});

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  task_assigned: { icon: ClipboardCheck, tone: "text-info bg-info/10", label: "Task Assigned" },
  task_submitted: { icon: Send, tone: "text-primary bg-primary/10", label: "Task Submitted" },
  waiting_review: {
    icon: Clock,
    tone: "text-purple-600 bg-purple-50",
    label: "Waiting for Review",
  },
  task_approved: { icon: CheckCircle2, tone: "text-success bg-success/10", label: "Approved" },
  task_rejected: {
    icon: AlertCircle,
    tone: "text-destructive bg-destructive/10",
    label: "Rejected",
  },
  revision_requested: {
    icon: MessageSquare,
    tone: "text-warning bg-warning/15",
    label: "Revision Requested",
  },
  submission_withdrawn: {
    icon: Undo2,
    tone: "text-muted-foreground bg-muted",
    label: "Submission Withdrawn",
  },
  task_due_today: { icon: Clock, tone: "text-info bg-info/10", label: "Due Today" },
  task_overdue: {
    icon: AlertTriangle,
    tone: "text-destructive bg-destructive/10",
    label: "Overdue",
  },
  workflow_started: {
    icon: Workflow,
    tone: "text-primary bg-primary/10",
    label: "Workflow Started",
  },
  workflow_completed: {
    icon: CheckCircle2,
    tone: "text-success bg-success/10",
    label: "Workflow Completed",
  },
  project_updated: { icon: FileText, tone: "text-info bg-info/10", label: "Project Updated" },
};

function Notifications() {
  const { isLoading } = useApp();
  const { data: notifications = [], isLoading: notifLoading } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkNotificationRead();

  if (isLoading || notifLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading notifications…
      </div>
    );
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const handleNotificationClick = (n: any) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="All alerts across your tasks and workflows."
        actions={
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            Mark all as read
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No notifications</h3>
            <p className="mt-1 text-xs text-muted-foreground">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {notifications.map((n) => {
              const config = NOTIFICATION_CONFIG[n.type as NotificationType] ?? NOTIFICATION_CONFIG.task_assigned;
              const Icon = config.icon;
              return (
                <Link
                  key={n.id}
                  to={n.task_id ? `/tasks/$id` : "/notifications"}
                  params={n.task_id ? { id: n.task_id } : undefined}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-muted/40",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      config.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">{n.message}</div>
                  </div>
                  {!n.read && <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}
