import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/dashboard")({
  beforeLoad: ({ location }) => {
    // The dashboard index route handles role-based rendering
    // so we don't need a beforeLoad here — the child index component
    // will decide what to show based on currentUser.role
  },
  component: () => <Outlet />,
});
