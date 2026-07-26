import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Image as ImageIcon, Film, File, Upload } from "lucide-react";

export const Route = createFileRoute("/_shell/files")({
  head: () => ({
    meta: [
      { title: "File Manager · Danfe × NTE" },
      { name: "description", content: "Attachments with version history and inline preview." },
      { property: "og:title", content: "File Manager" },
      { property: "og:description", content: "Documents, images, video, PDFs." },
    ],
  }),
  component: FileManager,
});

const files = [
  { n: "invoices-sept.xlsx", k: "doc", by: "Pratik", v: "v3", size: "820 KB" },
  { n: "packaging-mock.png", k: "img", by: "Meera", v: "v2", size: "3.4 MB" },
  { n: "warehouse-walk.mp4", k: "vid", by: "Ravi", v: "v1", size: "128 MB" },
  { n: "vendor-msa.pdf", k: "pdf", by: "Sita", v: "v4", size: "1.1 MB" },
];

function icon(k: string) {
  if (k === "img") return ImageIcon;
  if (k === "vid") return Film;
  if (k === "pdf") return FileText;
  return File;
}

function FileManager() {
  return (
    <>
      <PageHeader
        title="Files"
        description="Attachments across tasks and workflows."
        actions={<Button><Upload className="mr-1.5 h-4 w-4" />Upload</Button>}
      />
      <div className="mb-4 max-w-sm"><Input placeholder="Search files…" /></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {files.map((f) => {
          const Icon = icon(f.k);
          return (
            <Card key={f.n} className="group cursor-pointer transition hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{f.n}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{f.size} · uploaded by {f.by}</div>
                  </div>
                  <Badge variant="secondary">{f.v}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">Preview</Button>
                  <Button variant="ghost" size="sm">Versions</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
