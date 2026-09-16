import { lazy, Suspense, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Menu, Play, PenLine, Briefcase, UserPlus, LogOut, KeyRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/app-context";
import { useSignOut, useChangePassword } from "@/lib/api/auth";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { NotificationBell } from "@/components/shell/notification-bell";
import { toast } from "sonner";

const GlobalSearch = lazy(() =>
  import("@/components/global-search").then((m) => ({ default: m.GlobalSearch })),
);

export function TopBar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { currentRole, currentUser } = useApp();
  const navigate = useNavigate();
  const isAdmin = currentRole === "admin";
  const signOut = useSignOut();
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    navigate({ to: "/login", search: { redirect: "/dashboard" } });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onMobileMenu}
        aria-label="Open navigation"
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <div className="relative ml-1 hidden max-w-md flex-1 md:block">
        <Suspense fallback={<div className="h-9 w-full max-w-md rounded-lg bg-muted/60" />}>
          <GlobalSearch />
        </Suspense>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">New</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Quick create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/workflows" })}>
                <Play className="mr-2 h-4 w-4" aria-hidden />
                Run workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/workflows/builder", search: { templateId: "" } })}>
                <PenLine className="mr-2 h-4 w-4" aria-hidden />
                New workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/projects" })}>
                <Briefcase className="mr-2 h-4 w-4" aria-hidden />
                New project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/employees" })}>
                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                Invite employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <NotificationBell />

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-muted"
              >
                <EmployeeAvatar profile={currentUser} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" aria-hidden />
                Change password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </header>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const changePassword = useChangePassword();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await changePassword.mutateAsync({ password: newPassword });
      toast.success("Password changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        setNewPassword("");
        setConfirmPassword("");
      }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter a new password for your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tb-cp-new">New password</Label>
            <Input
              id="tb-cp-new"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tb-cp-confirm">Confirm password</Label>
            <Input
              id="tb-cp-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}