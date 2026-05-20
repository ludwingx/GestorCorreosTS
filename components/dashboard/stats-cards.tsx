import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, AlertCircle, CheckCircle } from "lucide-react";

interface Stats {
  totalDocs: number;
  totalClients: number;
  failedDocs: number;
  processedDocs: number;
  processedToday: number;
  templatesCount: number;
  typeDistribution: { name: string; count: number }[];
}

export function StatsCards({ stats }: { stats: Stats }) {
  const successRate = stats.totalDocs > 0 
    ? Math.round((stats.processedDocs / stats.totalDocs) * 100) 
    : 100;

  const cards = [
    {
      title: "Documentos Totales",
      value: stats.totalDocs.toLocaleString(),
      icon: FileText,
      description: `Hoy: +${stats.processedToday}`,
      colorClass: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
      gradient: "from-blue-500/20 to-transparent",
    },
    {
      title: "Tasa de Éxito",
      value: `${successRate}%`,
      icon: CheckCircle,
      description: `${stats.processedDocs} procesados con éxito`,
      colorClass: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
      gradient: "from-emerald-500/20 to-transparent",
      progress: successRate,
    },
    {
      title: "Clientes Activos",
      value: stats.totalClients.toLocaleString(),
      icon: Users,
      description: "Directorio completo",
      colorClass: "text-purple-500 bg-purple-500/10 dark:bg-purple-500/20",
      gradient: "from-purple-500/20 to-transparent",
    },
    {
      title: "Errores del Sistema",
      value: stats.failedDocs.toLocaleString(),
      icon: AlertCircle,
      description: "Documentos fallidos",
      colorClass: stats.failedDocs > 0 ? "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 animate-pulse" : "text-zinc-500 bg-zinc-500/10 dark:bg-zinc-500/20",
      gradient: "from-rose-500/20 to-transparent",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card 
          key={stat.title} 
          className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50"
        >
          {/* Subtle top gradient line */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient}`} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-xl transition-all duration-300 ${stat.colorClass}`}>
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </div>
            
            {stat.progress !== undefined ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {stat.description}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
