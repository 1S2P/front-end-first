import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DndState = {
  dragging: string | null;
  setDragging: (id: string | null) => void;
};

const DndContext = createContext<DndState>({ dragging: null, setDragging: () => {} });

export function DndProvider({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState<string | null>(null);
  return <DndContext.Provider value={{ dragging, setDragging }}>{children}</DndContext.Provider>;
}

export function useDnd() {
  return useContext(DndContext);
}

/** A draggable card. `id` is passed to the drop zone's onDrop. */
export function Draggable({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { dragging, setDragging } = useDnd();
  const isDragging = dragging === id;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        setDragging(id);
      }}
      onDragEnd={() => setDragging(null)}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-40 scale-[0.98]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A drop target. Calls onDrop with the dragged item's id. */
export function DropZone({
  onDrop,
  children,
  className,
  activeClassName = "ring-2 ring-primary/60 bg-primary/5",
}: {
  onDrop: (id: string) => void;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const { dragging, setDragging } = useDnd();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!dragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain") || dragging;
        setDragging(null);
        if (id) onDrop(id);
      }}
      className={cn("transition-colors rounded-xl", className, over && activeClassName)}
    >
      {children}
    </div>
  );
}
