import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";

export const Route = createFileRoute("/_shell/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments · Admin" },
      { name: "description", content: "Create and structure departments." },
      { property: "og:title", content: "Department Management" },
      { property: "og:description", content: "Departments and team-lead structure." },
    ],
  }),
  component: DepartmentManagement,
});

const departments = [
  { n: "Operations", lead: "Pratik R.", size: 8 },
  { n: "Marketing", lead: "Meera K.", size: 6 },
  { n: "Finance", lead: "Sita R.", size: 4 },
  { n: "Design", lead: "Aakash S.", size: 5 },
  { n: "Legal", lead: "Sneha P.", size: 2 },
];

function DepartmentManagement() {
  return (
    <>
      <PageHeader
        title="Departments"
        description="Team lead → team members hierarchy per department."
        actions={<Button><Plus className="mr-1.5 h-4 w-4" />New department</Button>}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.n}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{d.n}</div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{d.size} members</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{d.lead.split(" ").map((s) => s[0]).join("")}</AvatarFallback></Avatar>
                <div>
                  <div className="text-xs text-muted-foreground">Team Lead</div>
                  <div className="text-sm">{d.lead}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">Rename</Button>
                <Button variant="outline" size="sm">Members</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
