import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getTemplates } from "@/actions/templates";
import { TemplatesList } from "@/components/templates/templates-list";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 0;

async function TemplatesData() {
  const templates = await getTemplates();
  return <TemplatesList initialTemplates={templates} />;
}

export default function TemplatesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Templates</h2>
          <p className="text-muted-foreground">
            Diseña y administra las plantillas de correo electrónico para tus notificaciones automáticas.
          </p>
        </div>
        
        <Link href="/templates/builder/new">
          <Button>
            <Plus className="mr-2 size-4" /> Nuevo Template
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full border-muted bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Plantillas Registradas</CardTitle>
            <CardDescription>
              Templates disponibles para asignación a tipos de factura y envíos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TemplatesSkeleton />}>
              <TemplatesData />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted/50 border-b flex items-center px-4 justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-5 w-1/5" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
