import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSignIn } from "@/lib/api/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Danfe x NTE" },
      { name: "description", content: "Sign in to the workflow platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn.mutateAsync({ email, password });
      navigate({ href: redirect });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary/10 via-accent/20 to-background p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            D
          </div>
          <span className="font-semibold">Danfe x NTE</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">
            One platform for every brand, department, and workflow.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Define workflows once. Employees simply complete their work. The system handles
            everything else.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">Workflow Automation Platform</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-sm">
          <CardContent className="p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your work email to continue.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@danfetea.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={signIn.isPending}>
                {signIn.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Trouble signing in? Contact your workspace admin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
