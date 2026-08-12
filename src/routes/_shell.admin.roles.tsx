import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_shell/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions · Admin" },
      { name: "description", content: "Permission matrix per role." },
      { property: "og:title", content: "Roles & Permissions" },
    ],
  }),
  component: RolesAndPermissions,
});

const roles = [
  {
    name: "Admin",
    level: 1,
    tone: "bg-destructive/10 text-destructive",
    description: "Full platform control",
  },
  {
    name: "Team Lead",
    level: 2,
    tone: "bg-info/10 text-info",
    description: "Same as member + department view",
  },
  {
    name: "Team Member",
    level: 3,
    tone: "bg-primary/10 text-primary",
    description: "Task execution only",
  },
];

const permissionGroups = [
  {
    g: "Workflow",
    items: [
      { name: "Access Workflow Builder", admin: true, lead: false, member: false },
      { name: "Create Workflows", admin: true, lead: false, member: false },
      { name: "Edit Workflows", admin: true, lead: false, member: false },
      { name: "Delete Workflows", admin: true, lead: false, member: false },
      { name: "Start Workflows", admin: true, lead: false, member: false },
    ],
  },
  {
    g: "Tasks",
    items: [
      { name: "View Assigned Tasks", admin: true, lead: true, member: true },
      { name: "Complete Tasks", admin: true, lead: true, member: true },
      { name: "Submit for Review", admin: true, lead: true, member: true },
      { name: "Upload Files", admin: true, lead: true, member: true },
      { name: "Comment", admin: true, lead: true, member: true },
      { name: "Review & Approve", admin: true, lead: true, member: false },
    ],
  },
  {
    g: "Dashboard",
    items: [
      { name: "View Personal Dashboard", admin: true, lead: true, member: true },
      { name: "View Department Tasks", admin: true, lead: true, member: false },
      { name: "View Department Progress", admin: true, lead: true, member: false },
      { name: "View All Projects", admin: true, lead: false, member: false },
      { name: "View All Workflows", admin: true, lead: false, member: false },
    ],
  },
  {
    g: "Reports",
    items: [
      { name: "View Reports", admin: true, lead: true, member: false },
      { name: "View Analytics", admin: true, lead: false, member: false },
      { name: "Export Reports", admin: true, lead: false, member: false },
    ],
  },
  {
    g: "Admin",
    items: [
      { name: "Manage Brands", admin: true, lead: false, member: false },
      { name: "Manage Departments", admin: true, lead: false, member: false },
      { name: "Manage Employees", admin: true, lead: false, member: false },
      { name: "Assign Permissions", admin: true, lead: false, member: false },
      { name: "Configure Settings", admin: true, lead: false, member: false },
    ],
  },
];

function RolesAndPermissions() {
  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Three roles: Admin, Team Lead, Team Member. Google Drive-inspired permission levels."
      />

      {/* Role Cards */}
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.name}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`grid h-10 w-10 place-items-center rounded-lg font-semibold ${r.tone}`}
              >
                {r.level}
              </div>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </div>
              <Badge variant="secondary" className="ml-auto">
                System
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Permission</TableHead>
                {roles.map((r) => (
                  <TableHead key={r.name} className="text-center">
                    {r.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionGroups.map((g) => [
                <TableRow key={g.g}>
                  <TableCell
                    colSpan={4}
                    className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {g.g}
                  </TableCell>
                </TableRow>,
                ...g.items.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="text-sm">{p.name}</TableCell>
                    <TableCell className="text-center">
                      {p.admin ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-success/10 text-success"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.lead ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-success/10 text-success"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.member ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-success/10 text-success"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
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
