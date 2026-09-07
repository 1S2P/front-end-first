import { Link } from "@tanstack/react-router";
import { CalendarClock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types";

type TaskRowData = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  due_date?: string | null;
  completed_at?: string | null;
  department?: { name?: string } | null;
  project?: { name?: string } | null;
};

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string; dot: string }> = {
  ready: {
    label: "Ready",
    className: "bg-secondary text-secondary-foreground",
    dot: "bg-muted-foreground/60",
  },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary", dot: "bg-primary" },
  waiting_review: {
    label: "Waiting Review",
    className: "bg-warning/12 text-warning-foreground",
    dot: "bg-warning",
  },
  approved: { label: "Approved", className: "bg-success/10 text-success", dot: "bg-success" },
  completed: { label: "Completed", className: "bg-success/10 text-success", dot: "bg-success" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  needs_revision: {
    label: "Needs Revision",
    className: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

const PRIORITY_META: Record<"high" | "medium" | "low", string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function TaskRow({
  task,
  today,
  onToggleComplete,
}: {
  task: TaskRowData;
  today: string;
  onToggleComplete?: (task: TaskRowData) => void;
}) {
  const completed = task.status === "completed" || !!task.completed_at;
  const isOverdue = !completed && !!task.due_date && task.due_date < today;
  const dueSoon = !completed && !!task.due_date && task.due_date === today;
  const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.ready;
  const context = task.project?.name ?? task.department?.name;
  const priority = PRIORITY_META[task.priority] ?? "Medium";

  return (
    <Link
      to="/tasks/$id"
      params={{ id: task.id }}
      className="group relative flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3 py-3 transition-[border-color,box-shadow,background-color] duration-200 hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:gap-4 sm:px-4"
    >
      {onToggleComplete && (
        <button
          type="button"
          aria-label={
            completed ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className={cn(
            "group/check grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-all duration-200",
            completed
              ? "border-success bg-success text-white"
              : "border-input bg-background text-transparent hover:border-primary",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
            <path
              d="M3.5 8.5 6.5 11.5 12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight",
              completed
                ? "text-muted-foreground line-through decoration-muted-foreground/40"
                : "text-foreground",
            )}
          >
            {task.title}
          </p>
          {context && <span className="truncate text-xs text-muted-foreground">{context}</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex flex items-center gap-1",
                isOverdue ? "font-medium text-destructive" : "",
              )}
            >
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              {task.due_date ? (
                <span
                  className={cn(
                    isOverdue ? "text-destructive" : dueSoon ? "text-warning-foreground" : "",
                  )}
                >
                  {formatDue(task.due_date, today)}
                </span>
              ) : (
                <span>No due date</span>
              )}
            </span>
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                task.priority === "high"
                  ? "bg-destructive"
                  : task.priority === "medium"
                    ? "bg-warning"
                    : "bg-muted-foreground/50",
              )}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground">{priority}</span>
          </span>
        </div>
      </div>

      <span
        className={cn(
          "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium md:inline-flex",
          status.className,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} aria-hidden />
        {status.label}
      </span>

      {isOverdue && (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive md:hidden">
          Overdue
        </span>
      )}

      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}

function formatDue(dateStr: string, today: string) {
  if (dateStr === today) return "Today";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return dateStr < today
    ? `${Math.max(1, daysBetween(dateStr, today))}d overdue`
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime()) / 86400000,
  );
}

export type { TaskRowData };
