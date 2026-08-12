import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_shell")({
  beforeLoad: async ({ location }) => {
    // The server can't access the browser's Supabase session (stored in
    // localStorage), so this check must only run on the client. Otherwise every
    // hard refresh is SSR'd without a session and gets redirected to /login.
    if (typeof window === "undefined") return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <AppShell />,
});

export { Outlet };
