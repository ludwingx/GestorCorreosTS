import { Suspense } from "react";
import { getClients } from "@/actions/clients";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ClientsList } from "@/components/clients/clients-list";
import { Skeleton } from "@/components/ui/skeleton";

async function ClientsData() {
  const clients = await getClients();
  return <ClientsList initialClients={clients} />;
}

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Clientes</h1>
          <p className="text-zinc-500">
            Gestiona los perfiles de clientes y sus rutas de OneDrive.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsData />
      </Suspense>
    </div>
  );
}

function ClientsSkeleton() {
  return (
    <div className="w-full rounded-xl border bg-card p-6 space-y-4">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted/50 border-b flex items-center px-4 justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-20" />
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
