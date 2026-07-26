import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log · Danfe × NTE" },
      { name: "description", content: "Every action recorded across the platform." },
      { property: "og:title", content: "Audit Log" },
      { property: "og:description", content: "Actor, action, entity, timestamp." },
    ],
  }),
  component: AuditLog,
});

const rows = [
  { actor: "Pratik R.", action: "Submitted task", entity: "Task T-101", id: "evt_9812", when: "Today 10:24" },
  { actor: "Sita R.", action: "Approved task", entity: "Task T-089", id: "evt_9799", when: "Today 09:11" },
  { actor: "Admin", action: "Created workflow", entity: "Monthly finance close", id: "evt_9780", when: "Yesterday" },
  { actor: "Meera", action: "Uploaded file", entity: "invoices-sept.xlsx", id: "evt_9772", when: "Yesterday" },
  { actor: "Aakash", action: "Reassigned task", entity: "Task T-064", id: "evt_9750", when: "2 days ago" },
];

function AuditLog() {
  return (
    <>
      <PageHeader title="Audit Log" description="Full history of platform activity." />
      <div className="mb-4 max-w-sm"><Input placeholder="Filter by actor, action, entity…" /></div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Event ID</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.actor}</TableCell>
                  <TableCell><Badge variant="secondary">{r.action}</Badge></TableCell>
                  <TableCell>{r.entity}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="text-muted-foreground">{r.when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
