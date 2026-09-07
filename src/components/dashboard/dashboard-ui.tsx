import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  viewAllTo,
  viewAllLabel = "View all",
  icon: Icon,
}: {
  title: string;
  description?: string;
  viewAllTo?: string;
  viewAllLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="group inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {viewAllLabel}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
