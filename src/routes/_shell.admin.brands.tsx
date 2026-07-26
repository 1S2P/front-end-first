import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_shell/admin/brands")({
  head: () => ({
    meta: [
      { title: "Brands · Admin" },
      { name: "description", content: "Manage brand workspaces." },
      { property: "og:title", content: "Brand Management" },
      { property: "og:description", content: "Add and deactivate brands." },
    ],
  }),
  component: BrandManagement,
});

const brands = [
  { n: "Danfe Tea", initials: "DT", tone: "bg-accent text-accent-foreground", status: "Active", employees: 28 },
  { n: "Nepal Tea Exchange", initials: "NT", tone: "bg-primary/15 text-primary", status: "Active", employees: 19 },
];

function BrandManagement() {
  return (
    <>
      <PageHeader
        title="Brands"
        description="Each brand is a fully scoped workspace."
        actions={<Button><Plus className="mr-1.5 h-4 w-4" />Add brand</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {brands.map((b) => (
          <Card key={b.n}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`grid h-12 w-12 place-items-center rounded-lg font-bold ${b.tone}`}>{b.initials}</div>
              <div className="flex-1">
                <div className="font-medium">{b.n}</div>
                <div className="text-xs text-muted-foreground">{b.employees} employees</div>
              </div>
              <Badge variant="secondary">{b.status}</Badge>
              <Button variant="outline" size="sm">Manage</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
