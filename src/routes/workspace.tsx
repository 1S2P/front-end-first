import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Choose a workspace · Danfe × NTE" },
      { name: "description", content: "Pick a brand workspace to continue." },
      { property: "og:title", content: "Choose a workspace" },
      { property: "og:description", content: "Danfe Tea and Nepal Tea Exchange workspaces." },
    ],
  }),
  component: WorkspacePage,
});

const brands = [
  { id: "danfe", name: "Danfe Tea", initials: "DT", tone: "bg-accent text-accent-foreground", role: "Team Lead · Operations" },
  { id: "nte", name: "Nepal Tea Exchange", initials: "NT", tone: "bg-primary/15 text-primary", role: "Employee · Logistics" },
];

function WorkspacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">D</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Choose a workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You have access to more than one brand. Pick one to enter — you can switch anytime from the top bar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {brands.map((b) => (
            <Link key={b.id} to="/dashboard">
              <Card className="group cursor-pointer border-border/70 transition hover:border-primary/60 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`grid h-12 w-12 place-items-center rounded-lg font-bold ${b.tone}`}>{b.initials}</div>
                  <div className="flex-1">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.role}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Signed in</Badge> pratik@danfetea.com
        </div>
      </div>
    </div>
  );
}
