import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Boxes, UserCog, Workflow, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard · Danfe × NTE" },
      { name: "description", content: "Platform-wide overview across brands, departments, and users." },
      { property: "og:title", content: "Admin Dashboard" },
      { property: "og:description", content: "Manage brands, users, roles and analytics." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <>
      <PageHeader title="Admin overview" description="Everything across every brand." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Stat icon={Building2} label="Brands" value="2" />
        <Stat icon={Boxes} label="Departments" value="9" />
        <Stat icon={UserCog} label="Employees" value="47" />
        <Stat icon={Workflow} label="Active workflows" value="18" />
        <Stat icon={Activity} label="Delayed tasks" value="6" />
        <Stat icon={ShieldCheck} label="Roles" value="3" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Shortcut to="/admin/brands" title="Manage brands" body="Add, deactivate, and configure brand workspaces." />
        <Shortcut to="/admin/roles" title="Roles & permissions" body="Fine-tune what each role can do across the platform." />
        <Shortcut to="/admin/employees" title="Employees" body="Assign people to brands and departments." />
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Shortcut({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{body}</p>
        <Button variant="outline" size="sm" asChild><Link to={to}>Open</Link></Button>
      </CardContent>
    </Card>
  );
}
