import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Briefcase, ListTodo, Users, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useApp } from "@/lib/app-context";
import { useProjects, useProfiles, useDepartments } from "@/lib/api/admin";
import { useMyTasks } from "@/lib/api/tasks";
import { useWorkflowTemplates } from "@/lib/api/workflows";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { currentBrandId } = useApp();

  const { data: projects = [] } = useProjects(currentBrandId);
  const { data: tasks = [] } = useMyTasks(currentBrandId);
  const { data: profiles = [] } = useProfiles(currentBrandId);
  const { data: workflows = [] } = useWorkflowTemplates(currentBrandId);
  const { data: departments = [] } = useDepartments(currentBrandId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-transparent bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search tasks, projects, people...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search everything..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Projects">
            {projects.slice(0, 5).map((p) => (
              <CommandItem key={p.id} asChild>
                <Link to="/projects" onClick={() => setOpen(false)}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>{p.name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Project
                  </Badge>
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="My Tasks">
            {tasks.slice(0, 5).map((t) => (
              <CommandItem key={t.id} asChild>
                <Link to="/tasks/$id" params={{ id: t.id }} onClick={() => setOpen(false)}>
                  <ListTodo className="mr-2 h-4 w-4" />
                  <span>{t.title}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                    {t.status.replace("_", " ")}
                  </Badge>
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="People">
            {profiles.slice(0, 5).map((u) => {
              const dept = departments.find((d) => d.id === u.department_id);
              return (
                <CommandItem key={u.id}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{u.name}</span>
                  {dept && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {dept.name}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandGroup heading="Workflows">
            {workflows.slice(0, 5).map((w) => (
              <CommandItem key={w.id} asChild>
                <Link to="/workflows" onClick={() => setOpen(false)}>
                  <Workflow className="mr-2 h-4 w-4" />
                  <span>{w.name}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Template
                  </Badge>
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
