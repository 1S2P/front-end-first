import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Danfe × NTE" },
      { name: "description", content: "Sign in to the Danfe Tea × Nepal Tea Exchange workflow platform." },
      { property: "og:title", content: "Sign in · Danfe × NTE" },
      { property: "og:description", content: "Workflow automation & team management platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary/15 via-accent/25 to-background p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">D</div>
          <span className="font-semibold">Danfe × NTE</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">
            One workspace for every brand, department, and workflow.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sign in to plan the week, run approvals across departments, and keep every task on track.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Danfe Tea · Nepal Tea Exchange</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with your work email to continue.</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/workspace";
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@danfetea.com" required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                </div>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
            <div className="my-6 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/workspace">Continue with SSO</Link>
            </Button>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Trouble signing in? Contact your workspace admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
