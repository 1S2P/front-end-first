import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "default" | "primary" | "success" | "warning" | "danger" | "info";

const KPI_TONES: Record<KpiTone, { icon: string; value: string; ring: string }> = {
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
    icon: "bg-warning/15 text-warning-foreground",
    value: "text-foreground",
    ring: "border-border",
  },
  danger: {
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

export type TrendDirection = "up" | "down" | "flat";

export function TrendIndicator({
  value,
  direction,
  tone = "neutral",
  className,
}: {
  value: string;
  direction: TrendDirection;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  if (direction === "flat" || !value) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground", className)}>
        <Minus className="h-3 w-3" aria-hidden />
        {value}
      </span>
    );
  }

  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  const color =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", color, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {value}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  hint,
  href,
  to,
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: KpiTone;
  trend?: { value: string; direction: TrendDirection; tone?: "positive" | "negative" | "neutral" };
  hint?: string;
  href?: string;
  to?: string;
  className?: string;
}) {
  const style = KPI_TONES[tone];

  const classes = cn(
    "group relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-[border-color,box-shadow] duration-200",
    (href || to) && "cursor-pointer hover:border-primary/40 hover:shadow-md",
    style.ring,
    className,
  );

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
          {label}
        </span>
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md", style.icon)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={cn("text-2xl font-semibold leading-none tracking-tight tabular-nums", style.value)}>
          {value}
        </span>
        {trend ? (
          <TrendIndicator value={trend.value} direction={trend.direction} tone={trend.tone} />
        ) : hint ? (
          <span className="mb-0.5 text-[11px] font-medium text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {body}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {body}
      </a>
    );
  }

  return <div className={classes}>{body}</div>;
}

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-10 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}