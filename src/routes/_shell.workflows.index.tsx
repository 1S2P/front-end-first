import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Archive, Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_shell/workflows/")({
  head: () => ({
    meta: [
      { title: "Workflow Library · Danfe × NTE" },
      { name: "description", content: "All workflow templates by department." },
      { property: "og:title", content: "Workflow Library" },
      { property: "og:description", content: "Browse, clone and manage workflow templates." },
    ],
  }),
  component: WorkflowLibrary,
});

const groups = [
  { dep: "Finance", items: [{ n: "Monthly finance close", status: "Active" }, { n: "Vendor payment approval", status: "Active" }] },
  { dep: "Marketing", items: [{ n: "Campaign launch", status: "Active" }, { n: "Content review", status: "Archived" }] },
  { dep: "Operations", items: [{ n: "Vendor onboarding", status: "Active" }, { n: "Warehouse audit", status: "Active" }, { n: "Shipping SOP", status: "Archived" }] },
];

function WorkflowLibrary() {
  return (
    <>
      <PageHeader
        title="Workflow Library"
        description="Reusable, versioned templates per department."
        actions={<Button asChild><Link to="/workflows/builder"><Plus className="mr-1.5 h-4 w-4" />New workflow</Link></Button>}
      />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search templates…" />
      </div>
      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.dep}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{g.dep}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {g.items.map((it) => (
                <Card key={it.n}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{it.n}</div>
                        <div className="mt-1 text-xs text-muted-foreground">6 steps · 3 approvals</div>
                      </div>
                      <Badge variant={it.status === "Active" ? "default" : "secondary"}>{it.status}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Button variant="outline" size="sm" asChild><Link to="/workflows/builder"><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Link></Button>
                      <Button variant="outline" size="sm"><Copy className="mr-1 h-3.5 w-3.5" />Clone</Button>
                      <Button variant="outline" size="sm"><Archive className="mr-1 h-3.5 w-3.5" />Archive</Button>
                      <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
