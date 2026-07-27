import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, GripVertical } from "lucide-react";
import { useState } from "react";
import { DndProvider, Draggable, DropZone } from "@/components/dnd";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/tasks/")({
  head: () => ({
    meta: [
      { title: "My Tasks · Danfe × NTE" },
      { name: "description", content: "Everything assigned to you across brands and departments." },
      { property: "og:title", content: "My Tasks" },
      { property: "og:description", content: "Personal task queue with list and drag-and-drop board views." },
    ],
  }),
  component: MyTasks,
});

type Task = {
  id: string;
  title: string;
  brand: string;
  dep: string;
  due: string;
  priority: string;
  status: string;
};

const initialTasks: Task[] = [
  { id: "T-101", title: "Reconcile tea shipment invoices", brand: "Danfe Tea", dep: "Finance", due: "Today", priority: "High", status: "To Do" },
  { id: "T-102", title: "Post weekly product photos", brand: "Danfe Tea", dep: "Marketing", due: "Today", priority: "Med", status: "To Do" },
  { id: "T-103", title: "Approve packaging redesign v3", brand: "NTE", dep: "Design", due: "Tomorrow", priority: "High", status: "In Progress" },
  { id: "T-104", title: "Vendor onboarding — Kanchan Estate", brand: "NTE", dep: "Ops", due: "Fri", priority: "Low", status: "In Review" },
  { id: "T-105", title: "Quarterly compliance report", brand: "Danfe Tea", dep: "Legal", due: "Next Wk", priority: "Med", status: "Done" },
];

// Simplified: 4 clear columns instead of 5.
const columns = ["To Do", "In Progress", "In Review", "Done"];

function MyTasks() {
  const [view, setView] = useState<"list" | "board">("board");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const move = (id: string, status: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task || task.status === status) return prev;
      toast.success(`“${task.title}” moved to ${status}`);
      return prev.map((t) => (t.id === id ? { ...t, status } : t));
    });
  };

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Drag a card between columns to update its status."
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <Button variant={view === "board" ? "secondary" : "ghost"} size="sm" onClick={() => setView("board")}><LayoutGrid className="mr-1.5 h-4 w-4" />Board</Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}><List className="mr-1.5 h-4 w-4" />List</Button>
          </div>
        }
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {view === "list" ? <ListView tasks={tasks} /> : <BoardView tasks={tasks} onMove={move} />}
        </TabsContent>
        <TabsContent value="today" className="mt-4">
          <ListView tasks={tasks.filter((t) => t.due === "Today")} />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <ListView tasks={tasks.filter((t) => t.status === "Done")} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link to="/tasks/$id" params={{ id: t.id }} className="hover:underline">{t.title}</Link>
                </TableCell>
                <TableCell>{t.dep}</TableCell>
                <TableCell>{t.due}</TableCell>
                <TableCell><Badge variant={t.priority === "High" ? "destructive" : "secondary"}>{t.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nothing here.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BoardView({ tasks, onMove }: { tasks: Task[]; onMove: (id: string, status: string) => void }) {
  return (
    <DndProvider>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <DropZone key={col} onDrop={(id) => onMove(id, col)} className="bg-muted/50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</div>
              <Badge variant="secondary">{tasks.filter((t) => t.status === col).length}</Badge>
            </div>
            <div className="min-h-24 space-y-2">
              {tasks.filter((t) => t.status === col).map((t) => (
                <Draggable key={t.id} id={t.id}>
                  <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:border-primary/50">
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <Link to="/tasks/$id" params={{ id: t.id }} className="text-sm font-medium hover:underline">
                        {t.title}
                      </Link>
                    </div>
                    <div className="mt-2 flex items-center justify-between pl-6 text-xs text-muted-foreground">
                      <span>{t.dep}</span>
                      <Badge variant="outline" className="text-xs">{t.due}</Badge>
                    </div>
                  </div>
                </Draggable>
              ))}
            </div>
          </DropZone>
        ))}
      </div>
    </DndProvider>
  );
}
