import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { InvoiceTypesClient } from "@/components/invoice-types/invoice-types-client";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 0;

async function InvoiceTypesData() {
  const invoiceTypes = await prisma.invoiceType.findMany({
    include: {
      _count: {
        select: { templates: true }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return <InvoiceTypesClient invoiceTypes={invoiceTypes} />;
}

export default function TiposFacturaPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Tipos de Factura
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Gestiona las categorías de facturas para agrupar tus templates y automatizar envíos.
          </p>
        </div>
      </div>

      <Suspense fallback={<InvoiceTypesSkeleton />}>
        <InvoiceTypesData />
      </Suspense>
    </div>
  );
}

function InvoiceTypesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3 items-start">
      {/* Left panel skeleton (form) */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Right panel skeleton (table list) */}
      <div className="md:col-span-2 rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-10 bg-muted/50 border-b flex items-center px-4 justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="space-y-1 w-1/3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-6 w-12" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
