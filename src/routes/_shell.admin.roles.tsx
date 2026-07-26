import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_shell/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions · Admin" },
      { name: "description", content: "Fine-grained permission matrix per role." },
      { property: "og:title", content: "Roles & Permissions" },
      { property: "og:description", content: "Configure what each role can do." },
    ],
  }),
  component: RolesAndPermissions,
});

const roles = [
  { name: "Admin", level: 1, tone: "bg-destructive/10 text-destructive" },
  { name: "Team Lead", level: 2, tone: "bg-info/10 text-info" },
  { name: "Employee", level: 3, tone: "bg-primary/10 text-primary" },
];

const permissions = [
  { g: "Dashboards", items: ["View Dashboard", "View Department", "View Team Tasks"] },
  { g: "Tasks", items: ["Create", "Edit", "Delete", "Assign Tasks", "Approve Tasks", "Start Workflow"] },
  { g: "Content", items: ["Upload Files"] },
  { g: "Insights", items: ["View Reports", "View Analytics"] },
  { g: "Admin", items: ["Manage Departments", "Manage Brands", "Manage Users", "Manage Roles"] },
];

function defaultOn(role: string, perm: string) {
  if (role === "Admin") return true;
  if (role === "Team Lead") return !perm.startsWith("Manage") || perm === "Manage Users";
  return ["View Dashboard", "Create", "Edit", "Upload Files"].includes(perm);
}

function RolesAndPermissions() {
  return (
    <>
      <PageHeader title="Roles & Permissions" description="Three-level hierarchy: Admin → Team Lead → Employee." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.name}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`grid h-10 w-10 place-items-center rounded-lg font-semibold ${r.tone}`}>{r.level}</div>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">Hierarchy level {r.level}</div>
              </div>
              <Badge variant="secondary" className="ml-auto">System</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                {roles.map((r) => <TableHead key={r.name} className="text-center">{r.name}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.flatMap((g) => [
                <TableRow key={g.g}>
                  <TableCell colSpan={4} className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.g}</TableCell>
                </TableRow>,
                ...g.items.map((p) => (
                  <TableRow key={p}>
                    <TableCell className="text-sm">{p}</TableCell>
                    {roles.map((r) => (
                      <TableCell key={r.name} className="text-center">
                        <Switch defaultChecked={defaultOn(r.name, p)} />
                      </TableCell>
                    ))}
                  </TableRow>
                )),
              ])}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
