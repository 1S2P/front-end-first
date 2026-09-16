import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type EmployeeAvatarData = {
  name?: string | null;
  initials?: string | null;
  avatar_color?: string | null;
};

const SIZE_META = {
  sm: { avatar: "h-5 w-5", text: "text-[8px]" },
  md: { avatar: "h-6 w-6", text: "text-[9px]" },
  lg: { avatar: "h-8 w-8", text: "text-xs" },
} as const;

export function EmployeeAvatar({
  profile,
  size = "md",
  online = false,
  className,
}: {
  profile?: EmployeeAvatarData | null;
  size?: keyof typeof SIZE_META;
  /** presence dot (only when online tracking is enabled for the surface) */
  online?: boolean;
  className?: string;
}) {
  const meta = SIZE_META[size];
  const initials =
    profile?.initials ??
    (profile?.name
      ? profile.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "•");

  return (
    <span className={cn("relative inline-flex shrink-0", meta.avatar, className)}>
      <Avatar className={cn("h-full w-full")}>
        <AvatarFallback
          className={cn(meta.text, "font-semibold", profile?.avatar_color ?? "bg-muted text-muted-foreground")}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {online && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-background bg-success"
          aria-label="Online"
        />
      )}
    </span>
  );
}