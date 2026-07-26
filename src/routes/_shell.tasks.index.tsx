import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_shell/tasks/")({
  head: () => ({
    meta: [
      { title: "My Tasks · Danfe × NTE" },
      { name: "description", content: "Everything assigned to you across brands and departments." },
      { property: "og:title", content: "My Tasks" },
      { property: "og:description", content: "Personal task queue with list and board views." },
    ],
  }),
  component: MyTasks,
});

const tasks = [
  { id: "T-101", title: "Reconcile tea shipment invoices", brand: "Danfe Tea", dep: "Finance", due: "Today", priority: "High", status: "In Progress" },
  { id: "T-102", title: "Post weekly product photos", brand: "Danfe Tea", dep: "Marketing", due: "Today", priority: "Med", status: "To Do" },
  { id: "T-103", title: "Approve packaging redesign v3", brand: "NTE", dep: "Design", due: "Tomorrow", priority: "High", status: "In Review" },
  { id: "T-104", title: "Vendor onboarding — Kanchan Estate", brand: "NTE", dep: "Ops", due: "Fri", priority: "Low", status: "Needs Redo" },
  { id: "T-105", title: "Quarterly compliance report", brand: "Danfe Tea", dep: "Legal", due: "Next Wk", priority: "Med", status: "Completed" },
];

const columns = ["To Do", "In Progress", "In Review", "Needs Redo", "Completed"];

function MyTasks() {
  const [view, setView] = useState<"list" | "board">("list");
  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Everything on your plate, across brands."
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}><List className="mr-1.5 h-4 w-4" />List</Button>
            <Button variant={view === "board" ? "secondary" : "ghost"} size="sm" onClick={() => setView("board")}><LayoutGrid className="mr-1.5 h-4 w-4" />Board</Button>
          </div>
        }
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {view === "list" ? <ListView /> : <BoardView />}
        </TabsContent>
        <TabsContent value="pending" className="mt-4"><ListView /></TabsContent>
        <TabsContent value="today" className="mt-4"><ListView /></TabsContent>
        <TabsContent value="done" className="mt-4"><ListView /></TabsContent>
      </Tabs>
    </>
  );
}

function ListView() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link to="/tasks/$id" params={{ id: t.id }} className="hover:underline">{t.title}</Link>
                </TableCell>
                <TableCell>{t.brand}</TableCell>
                <TableCell>{t.dep}</TableCell>
                <TableCell>{t.due}</TableCell>
                <TableCell><Badge variant={t.priority === "High" ? "destructive" : "secondary"}>{t.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BoardView() {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {columns.map((col) => (
        <div key={col} className="rounded-xl bg-muted/50 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</div>
            <Badge variant="secondary">{tasks.filter((t) => t.status === col).length}</Badge>
          </div>
          <div className="space-y-2">
            {tasks.filter((t) => t.status === col).map((t) => (
              <Link key={t.id} to="/tasks/$id" params={{ id: t.id }}>
                <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary/50">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.dep}</span>
                    <Badge variant="outline" className="text-xs">{t.due}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
