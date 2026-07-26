import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_shell/workflows")({
  component: () => <Outlet />,
});

export { Link };
