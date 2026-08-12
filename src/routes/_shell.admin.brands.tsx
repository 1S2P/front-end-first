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
import { Plus, Building2 } from "lucide-react";
import { useState } from "react";
import { useBrands, useCreateBrand } from "@/lib/api/admin";
import { useProjects } from "@/lib/api/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/admin/brands")({
  head: () => ({
    meta: [
      { title: "Brands · Admin" },
      { name: "description", content: "Manage brand workspaces." },
      { property: "og:title", content: "Brand Management" },
    ],
  }),
  component: BrandManagement,
});

function BrandManagement() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState("bg-primary/15 text-primary");

  const handleCreate = async () => {
    if (!name.trim() || !initials.trim()) return;
    try {
      await createBrand.mutateAsync({
        id: name.toLowerCase().replace(/\s+/g, "_"),
        name: name.trim(),
        initials: initials.trim().toUpperCase(),
        color,
      });
      toast.success("Brand created");
      setShowNew(false);
      setName("");
      setInitials("");
    } catch {
      toast.error("Failed to create brand");
    }
  };

  return (
    <>
      <PageHeader
        title="Brands"
        description="Each brand is a fully scoped workspace with separate projects, tasks, and analytics."
        actions={
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Brand
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading brands…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {brands.map((b) => (
            <Card key={b.id} className="transition-colors hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-lg font-bold text-sm ${b.color}`}
                  >
                    {b.initials}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{b.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      ID: {b.id}
                    </div>
                    <div className="mt-3">
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Brand name</Label>
              <Input
                placeholder="e.g. Danfe Tea"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initials</Label>
              <Input
                placeholder="e.g. DT"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || !initials.trim() || createBrand.isPending}
            >
              Create Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
