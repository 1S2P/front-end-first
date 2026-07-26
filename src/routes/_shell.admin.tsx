import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/admin")({
  component: () => <Outlet />,
});
