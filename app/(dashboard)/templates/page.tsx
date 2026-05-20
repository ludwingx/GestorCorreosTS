import { Suspense } from "react";
import Link from "next/link";
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Plantillas de Correo
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Diseña y administra las plantillas HTML de correo electrónico para tus notificaciones automáticas.
          </p>
        </div>
        
        <Link href="/templates/builder/new">
          <Button className="rounded-xl shadow-sm hover:scale-[1.02] transition-all font-semibold">
            <Plus className="mr-2 size-4" /> Nueva Plantilla
          </Button>
        </Link>
      </div>

      <Suspense fallback={<TemplatesSkeleton />}>
        <TemplatesData />
      </Suspense>
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
