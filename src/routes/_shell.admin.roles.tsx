import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, Save, AlertCircle } from "lucide-react";
import {
  usePermissionsCatalog,
  useProfilePermissions,
  useAssignPermissions,
  useProfiles,
} from "@/lib/api/admin";
import { useRequirePermission } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_shell/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions · Admin" },
      { name: "description", content: "Assign granular permissions to any employee." },
      { property: "og:title", content: "Roles & Permissions" },
    ],
  }),
  component: RolesAndPermissions,
});

function RolesAndPermissions() {
  const denied = useRequirePermission("admin_assign_permissions");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const { data: catalog = [] } = usePermissionsCatalog();

  if (denied) return null;

  const filtered = search
    ? profiles.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : profiles;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Pick an employee and toggle their permissions. Admins automatically have every permission."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Employee list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
              {profilesLoading ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Loading employees…
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No employees found.
                </div>
              ) : (
                filtered.map((u) => (
                  <EmployeeRow
                    key={u.id}
                    profile={u}
                    selected={selectedId === u.id}
                    onSelect={() => setSelectedId(u.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permission editor */}
        <PermissionEditor profileId={selectedId} catalog={catalog} />
      </div>
    </>
  );
}

function EmployeeRow({
  profile,
  selected,
  onSelect,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const { data: permissionIds = [] } = useProfilePermissions(profile.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors",
        selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted",
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className={cn("text-xs", profile.avatar_color)}>
          {profile.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{profile.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {profile.role === "admin"
            ? "Admin · full access"
            : `${permissionIds.length} permission${permissionIds.length !== 1 ? "s" : ""} granted`}
        </div>
      </div>
      {profile.role === "admin" && (
        <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
      )}
    </button>
  );
}

function PermissionEditor({
  profileId,
  catalog,
}: {
  profileId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog: any[];
}) {
  const { data: profiles = [] } = useProfiles();
  const { data: grantedIds = [], isLoading: permsLoading } = useProfilePermissions(profileId ?? undefined);
  const assignPermissions = useAssignPermissions();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const profile = profiles.find((p) => p.id === profileId);
  const isAdminProfile = profile?.role === "admin";

  useEffect(() => {
    if (profileId) {
      setSelectedIds([...grantedIds]);
      setSavedIds([...grantedIds]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, permsLoading]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof catalog>();
    for (const p of catalog) {
      const list = map.get(p.group_name) ?? [];
      list.push(p);
      map.set(p.group_name, list);
    }
    return Array.from(map.entries());
  }, [catalog]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleGroup = (group: string, ids: string[]) => {
    const grantedInGroup = selectedIds.filter((id) => ids.includes(id));
    const allOn = grantedInGroup.length === ids.length;
    setSelectedIds((prev) =>
      allOn
        ? prev.filter((id) => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids])),
    );
  };

  const hasChanges =
    selectedIds.length !== savedIds.length ||
    selectedIds.some((id) => !savedIds.includes(id)) ||
    savedIds.some((id) => !selectedIds.includes(id));

  const handleSave = async () => {
    if (!profileId) return;
    try {
      await assignPermissions.mutateAsync({
        profileId,
        permissionIds: selectedIds,
      });
      setSavedIds([...selectedIds]);
      toast.success(`${profile?.name}'s permissions updated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save permissions.");
    }
  };

  if (!profileId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-sm font-semibold">Select an employee</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Choose someone from the list to view and edit their permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={cn("text-xs", profile?.avatar_color)}>
              {profile?.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{profile?.name}</span>
              <Badge
                variant={
                  profile?.role === "admin"
                    ? "destructive"
                    : profile?.role === "team_lead"
                      ? "default"
                      : "secondary"
                }
                className="text-[10px]"
              >
                {profile?.role === "admin"
                  ? "Admin"
                  : profile?.role === "team_lead"
                    ? "Team Lead"
                    : "Team Member"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{profile?.email}</div>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || assignPermissions.isPending || isAdminProfile}>
            <Save className="mr-1.5 h-4 w-4" />
            {assignPermissions.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </CardContent>
      </Card>

      {isAdminProfile && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-success" />
            Admins automatically have every permission. Their access cannot be changed.
          </CardContent>
        </Card>
      )}

      {permsLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading permissions…
          </CardContent>
        </Card>
      ) : (
        grouped.map(([group, items]) => {
          const allChecked = items.every((i) => selectedIds.includes(i.id));
          const someChecked = items.some((i) => selectedIds.includes(i.id));
          return (
            <Card key={group}>
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </span>
                  <button
                    type="button"
                    disabled={isAdminProfile}
                    onClick={() => toggleGroup(group, items.map((i) => i.id))}
                    className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {allChecked ? "Clear all" : someChecked ? "Select all" : "Select all"}
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {items.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40",
                          isAdminProfile && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <Checkbox
                          checked={isAdminProfile ? true : checked}
                          disabled={isAdminProfile}
                          onCheckedChange={() => toggle(p.id)}
                          className="mt-0.5"
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || assignPermissions.isPending || isAdminProfile}
        >
          <Save className="mr-1.5 h-4 w-4" />
          {assignPermissions.isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}
