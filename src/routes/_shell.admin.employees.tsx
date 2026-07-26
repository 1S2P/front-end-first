import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_shell/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employees · Admin" },
      { name: "description", content: "Employees with multi-brand mapping." },
      { property: "og:title", content: "Employee Management" },
      { property: "og:description", content: "Assign employees to brands and roles." },
    ],
  }),
  component: EmployeeManagement,
});

const employees = [
  { n: "Pratik R.", dep: "Operations", role: "Team Lead", lead: "—", brands: { danfe: true, nte: false } },
  { n: "Sita R.", dep: "Finance", role: "Team Lead", lead: "—", brands: { danfe: true, nte: true } },
  { n: "Meera K.", dep: "Marketing", role: "Team Lead", lead: "—", brands: { danfe: true, nte: true } },
  { n: "Aakash S.", dep: "Design", role: "Employee", lead: "Meera K.", brands: { danfe: true, nte: false } },
  { n: "Sneha P.", dep: "Legal", role: "Employee", lead: "Sita R.", brands: { danfe: false, nte: true } },
  { n: "Ravi T.", dep: "Operations", role: "Employee", lead: "Pratik R.", brands: { danfe: true, nte: true } },
];

function EmployeeManagement() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Assign roles, departments, and multi-brand access."
        actions={<Button><Plus className="mr-1.5 h-4 w-4" />Invite employee</Button>}
      />
      <div className="mb-4 max-w-sm"><Input placeholder="Search employees…" /></div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead className="text-center">Danfe Tea</TableHead>
                <TableHead className="text-center">NTE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.n}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{e.n.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>
                      <span className="font-medium">{e.n}</span>
                    </div>
                  </TableCell>
                  <TableCell>{e.dep}</TableCell>
                  <TableCell><Badge variant={e.role === "Team Lead" ? "default" : "secondary"}>{e.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{e.lead}</TableCell>
                  <TableCell className="text-center"><Checkbox defaultChecked={e.brands.danfe} /></TableCell>
                  <TableCell className="text-center"><Checkbox defaultChecked={e.brands.nte} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
