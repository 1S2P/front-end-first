import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useBrands } from "@/lib/api/admin";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [{ title: "Choose a workspace · Danfe x NTE" }],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { currentUser, setCurrentBrandId } = useApp();
  const { data: brands = [] } = useBrands();

  const userBrands = currentUser
    ? brands.filter((b) => currentUser.brandIds.includes(b.id))
    : brands;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            D
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Choose a workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You have access to more than one brand. Pick one to enter — you can switch anytime from
            the sidebar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {userBrands.map((b) => (
            <Link key={b.id} to="/dashboard" onClick={() => setCurrentBrandId(b.id)}>
              <Card className="group cursor-pointer border-border/70 transition hover:border-primary/60 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("grid h-12 w-12 place-items-center rounded-lg font-bold text-sm", b.color)}>
                    {b.initials}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
