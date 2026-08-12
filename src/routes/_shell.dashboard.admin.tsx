import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export const Route = createFileRoute("/_shell/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard · Danfe x NTE" },
      {
        name: "description",
        content: "Platform-wide overview across brands, departments, and users.",
      },
      { property: "og:title", content: "Admin Dashboard" },
    ],
  }),
  component: AdminDashboard,
});
