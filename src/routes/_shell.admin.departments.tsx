import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { useDepartments, useCreateDepartment, useBrands } from "@/lib/api/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments · Admin" },
      { name: "description", content: "Create and manage departments." },
      { property: "og:title", content: "Department Management" },
    ],
  }),
  component: DepartmentManagement,
});

function DepartmentManagement() {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: brands = [] } = useBrands();
  const createDepartment = useCreateDepartment();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createDepartment.mutateAsync({
        name: name.trim(),
        brandIds: selectedBrands,
      });
      toast.success("Department created");
      setShowNew(false);
      setName("");
      setSelectedBrands([]);
    } catch {
      toast.error("Failed to create department");
    }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((b) => b !== brandId) : [...prev, brandId],
    );
  };

  return (
    <>
      <PageHeader
        title="Departments"
        description="Team lead and team members hierarchy per department."
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Department
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading departments…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => {
            const lead = (d as any).profiles;
            return (
              <Card key={d.id} className="transition-colors hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        ID: {d.id}
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  {lead && (
                    <div className="mt-4 text-sm">
                      <span className="text-muted-foreground">Team Lead: </span>
                      <span className="font-medium">{lead.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Department name</Label>
              <Input
                placeholder="e.g. Content Marketing"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brands</Label>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Button
                    key={b.id}
                    variant={selectedBrands.includes(b.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleBrand(b.id)}
                  >
                    {b.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createDepartment.isPending}>
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
