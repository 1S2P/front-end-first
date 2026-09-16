import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export type TaskStateTone = "neutral" | "brand" | "warning" | "success" | "danger" | "muted";

type StatusMeta = {
  label: string;
  tone: TaskStateTone;
  /* dot color (used by list rows, board columns) */
  dot: string;
  /* badge classes (subtle surface, tinted text) — no aggressive fills */
  badge: string;
};

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  ready: {
    label: "Ready",
    tone: "neutral",
    dot: "bg-muted-foreground/55",
    badge: "bg-secondary text-secondary-foreground",
  },
  in_progress: {
    label: "In Progress",
    tone: "brand",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary",
  },
  waiting_review: {
    label: "Waiting Review",
    tone: "warning",
    dot: "bg-warning",
    badge: "bg-warning/12 text-warning-foreground",
  },
  approved: {
    label: "Approved",
    tone: "success",
    dot: "bg-success",
    badge: "bg-success/10 text-success",
  },
  completed: {
    label: "Completed",
    tone: "success",
    dot: "bg-success",
    badge: "bg-success/10 text-success",
  },
  rejected: {
    label: "Rejected",
    tone: "danger",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive",
  },
  needs_revision: {
    label: "Needs Revision",
    tone: "warning",
    dot: "bg-warning",
    badge: "bg-destructive/10 text-destructive",
  },
};

/** Derived attention states layered on top of the base status. */
export type TaskAttention = "overdue" | "due_soon" | null;

const ATTENTION_META: Record<Exclude<TaskAttention, null>, { label: string; badge: string; dot: string }> = {
  overdue: {
    label: "Overdue",
    badge: "bg-destructive text-destructive-foreground",
    dot: "bg-destructive",
  },
  due_soon: {
    label: "Due Today",
    badge: "bg-warning/20 text-warning-foreground",
    dot: "bg-warning",
  },
};

export function StatusBadge({
  status,
  attention,
  className,
}: {
  status: TaskStatus;
  attention?: TaskAttention;
  className?: string;
}) {
  const meta = STATUS_META[status];

  // Overdue always wins — it's the most urgent signal.
  if (attention === "overdue") {
    const a = ATTENTION_META.overdue;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
          a.badge,
          className,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", a.dot)} aria-hidden />
        {meta.label} · {a.label}
      </span>
    );
  }

  if (attention === "due_soon" && status !== "completed") {
    const a = ATTENTION_META.due_soon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
          a.badge,
          className,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", a.dot)} aria-hidden />
        {meta.label} · {a.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        meta.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

/** Status led — a bare status dot for dense rows. */
export function StatusDot({ status, attention }: { status: TaskStatus; attention?: TaskAttention }) {
  if (attention === "overdue") {
    return <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ATTENTION_META.overdue.dot)} aria-hidden />;
  }
  return <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[status].dot)} aria-hidden />;
}