import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function isOverdue(dueDate: string | null | undefined, status?: string): boolean {
  if (!dueDate) return false;
  const done = status === "completed" || status === "approved" || status === "rejected";
  return !done && dueDate < todayISO();
}

export function isDueToday(dueDate: string | null | undefined, status?: string): boolean {
  if (!dueDate) return false;
  const done = status === "completed" || status === "approved" || status === "rejected";
  return !done && dueDate === todayISO();
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago" */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Time-aware greeting: "Good morning" / "Good afternoon" / "Good evening" */
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** "Today", "Yesterday", or "Mon, Sep 14" for a date string */
export function humanDate(dateStr: string): string {
  const date = new Date(dateStr);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((dayStart.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** "Due Today", "Sep 16", "3d overdue" */
export function formatDueDate(dueDate: string, status?: string): string {
  if (isDueToday(dueDate, status)) return "Due today";
  if (isOverdue(dueDate, status)) {
    const diff = Math.max(1, Math.round((Date.now() - new Date(dueDate).getTime()) / 86400000));
    return `${diff}d overdue`;
  }
  return new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Compact duration from hours: "2.4d" / "6h" / "45m" */
export function formatHours(hours: number): string {
  if (!isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1).replace(/\.0$/, "")}d`;
}

/** Compute completion hours for a task from its timestamps. */
export function taskCompletionHours(task: {
  created_at?: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  completed_at?: string | null;
  status: string;
}): number | null {
  const start = new Date(task.created_at ?? Date.now()).getTime();
  if (task.reviewed_at) {
    return (new Date(task.reviewed_at).getTime() - start) / 3600000;
  }
  if (task.completed_at || task.status === "completed") {
    return (Date.now() - start) / 3600000;
  }
  return null;
}
