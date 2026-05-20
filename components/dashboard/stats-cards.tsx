import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, AlertCircle } from "lucide-react";

interface Stats {
  totalDocs: number;
  totalClients: number;
  failedDocs: number;
  processedToday: number;
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Archivos Procesados",
      value: stats.totalDocs.toString(),
      icon: FileText,
      description: "Total de documentos clasificados",
    },
    {
      title: "Clientes Activos",
      value: stats.totalClients.toString(),
      icon: Users,
      description: "Clientes configurados en el sistema",
    },
    {
      title: "Errores (Hoy)",
      value: stats.failedDocs.toString(),
      icon: AlertCircle,
      description: "Fallos en el procesamiento",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
