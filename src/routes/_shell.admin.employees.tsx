import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useProfiles, useBrands, useDepartments, useInviteUser } from "@/lib/api/admin";
import { useRequirePermission } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_shell/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employees · Admin" },
      { name: "description", content: "Manage employees with multi-brand mapping." },
      { property: "og:title", content: "Employee Management" },
    ],
  }),
  component: EmployeeManagement,
});

function EmployeeManagement() {
  const denied = useRequirePermission("admin_manage_employees");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: brands = [] } = useBrands();
  const { data: departments = [] } = useDepartments();
  const inviteUser = useInviteUser();

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
        title="Employees"
        description="Assign roles, departments, and multi-brand access."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Invite Employee
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading employees…
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  {brands.map((b) => (
                    <TableHead key={b.id} className="text-center">
                      {b.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => {
                  const dept = departments.find((d) => d.id === e.department_id);
                  const userBrands =
                    (e as any).profile_brands?.map((pb: any) => pb.brand_id) ?? [];
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={cn("text-xs", e.avatar_color)}
                            >
                              {e.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{e.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {e.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{dept?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            e.role === "admin"
                              ? "destructive"
                              : e.role === "team_lead"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {e.role === "admin"
                            ? "Admin"
                            : e.role === "team_lead"
                              ? "Team Lead"
                              : "Team Member"}
                        </Badge>
                      </TableCell>
                      {brands.map((b) => (
                        <TableCell key={b.id} className="text-center">
                          {userBrands.includes(b.id) ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3 + brands.length}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        departments={departments}
        brands={brands}
        inviteUser={inviteUser}
      />
    </>
  );
}

function InviteEmployeeDialog({
  open,
  onOpenChange,
  departments,
  brands,
  inviteUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  inviteUser: ReturnType<typeof useInviteUser>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("team_member");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("team_member");
    setDepartmentId("");
    setSelectedBrands([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !departmentId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      await inviteUser.mutateAsync({
        email,
        name,
        password,
        role: role as any,
        departmentId,
        brandIds: selectedBrands,
      });
      toast.success(`${name} has been created successfully.`);
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee.");
    }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account. They can change their password after first login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Full Name *</Label>
            <Input
              id="invite-name"
              placeholder="e.g. John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Password *</Label>
            <Input
              id="invite-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Brand Access</Label>
            <div className="flex gap-2">
              {brands.map((b) => (
                <Button
                  key={b.id}
                  type="button"
                  variant={selectedBrands.includes(b.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleBrand(b.id)}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
