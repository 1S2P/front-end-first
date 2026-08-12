import { createFileRoute } from "@tanstack/react-router";
import { TeamLeadDashboard } from "@/components/dashboard/team-lead-dashboard";

export const Route = createFileRoute("/_shell/dashboard/team-lead")({
  head: () => ({
    meta: [{ title: "Team Lead Dashboard · Danfe x NTE" }],
  }),
  component: TeamLeadDashboard,
});
