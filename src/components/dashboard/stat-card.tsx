import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "primary" | "success" | "warning" | "destructive" | "info";

const TONE_STYLES: Record<StatTone, { icon: string; value: string; ring: string }> = {
  default: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
    ring: "border-border",
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
    ring: "border-border",
  },
  success: {
    icon: "bg-success/10 text-success",
    value: "text-foreground",
    ring: "border-border",
  },
  warning: {
    icon: "bg-warning/12 text-warning-foreground",
    value: "text-foreground",
    ring: "border-border",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    value: "text-destructive",
    ring: "border-destructive/25",
  },
  info: {
    icon: "bg-info/10 text-info",
    value: "text-foreground",
    ring: "border-border",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  hintTone = "default",
  children,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  hintTone?: "default" | "success" | "destructive" | "warning";
  children?: React.ReactNode;
}) {
  const style = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        "group relative flex min-h-[7.5rem] flex-col justify-between gap-5 overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md",
        style.ring,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
            style.icon,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "text-[28px] font-bold leading-none tracking-tight tabular-nums",
            style.value,
          )}
        >
          {value}
        </span>
        {hint && (
          <span
            className={cn(
              "mb-0.5 text-[11px] font-medium",
              hintTone === "destructive"
                ? "text-destructive"
                : hintTone === "success"
                  ? "text-success"
                  : hintTone === "warning"
                    ? "text-warning-foreground"
                    : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
