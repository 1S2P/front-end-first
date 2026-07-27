import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { DndProvider, Draggable, DropZone } from "@/components/dnd";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";

export const Route = createFileRoute("/_shell/week-plan")({
  head: () => ({
    meta: [
      { title: "Week Plan · Danfe × NTE" },
      { name: "description", content: "Drag tasks from the backlog onto any day of the week." },
      { property: "og:title", content: "Week Plan" },
      { property: "og:description", content: "Drag-and-drop weekly planning board." },
    ],
  }),
  component: WeekPlan,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Item = { id: string; t: string; tag: string; day: string | null };

const initialItems: Item[] = [
  { id: "w1", t: "Kickoff — Q4 campaign", tag: "Marketing", day: "Mon" },
  { id: "w2", t: "Vendor call", tag: "Ops", day: "Mon" },
  { id: "w3", t: "Finance close start", tag: "Finance", day: "Tue" },
  { id: "w4", t: "Design review", tag: "Design", day: "Wed" },
  { id: "w5", t: "Legal review", tag: "Legal", day: "Thu" },
  { id: "w6", t: "Weekly retro", tag: "Team", day: "Fri" },
  { id: "w7", t: "Warehouse audit", tag: "Ops", day: null },
  { id: "w8", t: "Restock packaging", tag: "Ops", day: null },
];

function WeekPlan() {
  const [items, setItems] = useState<Item[]>(initialItems);

  const move = (id: string, day: string | null) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item || item.day === day) return prev;
      toast.success(day ? `“${item.t}” scheduled for ${day}` : `“${item.t}” moved to backlog`);
      return prev.map((i) => (i.id === id ? { ...i, day } : i));
    });
  };

  return (
    <>
      <PageHeader title="Week Plan" description="Oct 21 – Oct 27 · drag cards onto a day to schedule them." />
      <DndProvider>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <DropZone onDrop={(id) => move(id, null)}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Backlog</CardTitle>
              </CardHeader>
              <CardContent className="min-h-40 space-y-2">
                {items.filter((i) => !i.day).map((i) => (
                  <PlanCard key={i.id} item={i} />
                ))}
                {items.every((i) => i.day) && (
                  <p className="text-xs text-muted-foreground">Everything is scheduled 🎉</p>
                )}
              </CardContent>
            </Card>
          </DropZone>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.map((d) => {
              const dayItems = items.filter((i) => i.day === d);
              return (
                <DropZone key={d} onDrop={(id) => move(id, d)} className="border border-border bg-card p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">{d}</div>
                    <Badge variant="secondary" className="text-[10px]">{dayItems.length}</Badge>
                  </div>
                  <div className="min-h-28 space-y-2">
                    {dayItems.map((i) => <PlanCard key={i.id} item={i} />)}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </div>
      </DndProvider>
    </>
  );
}

function PlanCard({ item }: { item: Item }) {
  return (
    <Draggable id={item.id}>
      <div className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/40 p-2.5 text-xs hover:border-primary/50">
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div>
          <div className="font-medium">{item.t}</div>
          <div className="mt-1 text-muted-foreground">{item.tag}</div>
        </div>
      </div>
    </Draggable>
  );
}
