import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Briefcase, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { useProjects, useCreateProject } from "@/lib/api/admin";
import { useBrands } from "@/lib/api/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/projects")({
  head: () => ({
    meta: [
      { title: "Projects · Danfe x NTE" },
      { name: "description", content: "Project containers for workflow automation." },
      { property: "og:title", content: "Projects" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { currentBrandId } = useApp();
  const { data: brandProjects = [], isLoading } = useProjects(currentBrandId);
  const { data: brands = [] } = useBrands();
  const createProject = useCreateProject();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState(currentBrandId);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        brand_id: brandId,
      });
      toast.success("Project created");
      setShowNew(false);
      setName("");
      setDescription("");
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Containers for workflows. Tasks are generated automatically."
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading projects…
        </div>
      ) : brandProjects.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-medium">No projects yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a project to start running workflows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {brandProjects.map((p) => (
            <Card key={p.id} className="group cursor-pointer transition-colors hover:border-primary/50 hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={p.status === "active" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project name</Label>
              <Input
                placeholder="e.g. Dashain Campaign 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createProject.isPending}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
