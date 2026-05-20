import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SyncButton } from "@/components/dashboard/sync-button";
import { getDashboardStats, getRecentDocuments } from "@/actions/dashboard";

export default async function DashboardPage() {
  const [stats, documents] = await Promise.all([
    getDashboardStats(),
    getRecentDocuments(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-zinc-500">
            Monitoreo en tiempo real de la clasificación de documentos.
          </p>
        </div>
        <SyncButton />
      </div>
      
      <StatsCards stats={stats} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Actividad Reciente</h2>
        <ActivityFeed documents={documents} />
      </div>
    </div>
  );
}

