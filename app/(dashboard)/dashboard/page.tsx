import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { getDashboardStats, getRecentDocuments } from "@/actions/dashboard";
import { auth } from "@/auth";
import { Mail, Users, FileText, ChevronRight, Tags, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Usuario";

  const [stats, documents] = await Promise.all([
    getDashboardStats(),
    getRecentDocuments(),
  ]);

  // Calculate percentages for document types breakdown
  const totalCount = stats.typeDistribution.reduce((acc, item) => acc + item.count, 0);

  const quickActions = [
    {
      title: "Enviar Mails",
      description: "Notificar clientes con plantillas",
      href: "/enviar-mails",
      icon: Mail,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Gestionar Clientes",
      description: "Directorio y carpetas OneDrive",
      href: "/clientes",
      icon: Users,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Plantillas de Correo",
      description: "Crear y compilar diseños HTML",
      href: "/templates",
      icon: FileText,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800/80 p-8 shadow-md border border-zinc-800/20">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full bg-zinc-800/30 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              ¡Hola, {userName}! 👋
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl">
              Bienvenido de nuevo al sistema. Monitorea y clasifica de forma automática tus documentos y notifica a tus clientes sin fricciones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-2 text-center">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Hoy</div>
              <div className="text-xl font-bold text-white">+{stats.processedToday}</div>
            </div>
            <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-2 text-center">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Plantillas</div>
              <div className="text-xl font-bold text-white">{stats.templatesCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <StatsCards stats={stats} />

      {/* Quick Actions & Types Distribution Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            Acciones Rápidas
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link 
                key={action.title}
                href={action.href}
                className="group relative flex flex-col justify-between p-5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
              >
                <div className="space-y-3">
                  <div className={`p-2.5 w-fit rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Document Category Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Tags className="h-4 w-4 text-zinc-500" /> Distribución
          </h2>
          <div className="p-5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 space-y-4 shadow-sm h-[calc(100%-2.25rem)]">
            {stats.typeDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                Sin documentos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.typeDistribution.map((item, index) => {
                  const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  const colorClasses = [
                    "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-indigo-500"
                  ];
                  const barColor = colorClasses[index % colorClasses.length];
                  
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] uppercase tracking-wider text-[10px]">
                          {item.name || "Otros"}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            Actividad Reciente
          </h2>
          <Link 
            href="/historial" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
          >
            Ver Historial Completo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ActivityFeed documents={documents} />
      </div>
    </div>
  );
}

