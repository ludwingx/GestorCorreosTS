import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientFormattedDate } from "@/components/ui/client-formatted-date";

export const revalidate = 0;

async function HistoryData() {
  const documents = await prisma.document.findMany({
    include: {
      client: true
    },
    orderBy: {
      processedAt: "desc"
    }
  });

  if (documents.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground bg-muted/20">
        No hay registros en el historial de procesamiento.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ruta / Enlace</TableHead>
              <TableHead className="text-right">Fecha/Hora</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground/70" />
                    <span className="font-medium text-foreground">{item.fileName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.client?.name || "Desconocido"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal border-border bg-muted/20">
                    {item.fileType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.status === "PROCESSED" ? (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Éxito</span>
                    </div>
                  ) : item.status === "PENDING" ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Pendiente</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Error</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground block max-w-[250px] truncate">
                    {item.finalPath || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  <ClientFormattedDate 
                    date={item.processedAt} 
                    options={{
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {item.finalPath && (item.finalPath.startsWith("http") || item.finalPath.startsWith("https")) && (
                    <a href={item.finalPath} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function HistorialPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Historial de Procesamiento</h1>
        <p className="text-zinc-500">
          Registro completo de todos los archivos detectados y su estado final.
        </p>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryData />
      </Suspense>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="h-12 bg-muted/50 border-b flex items-center px-4 justify-between">
        <Skeleton className="h-4 w-1/4 animate-pulse" />
        <Skeleton className="h-4 w-1/5 animate-pulse" />
        <Skeleton className="h-4 w-12 animate-pulse" />
        <Skeleton className="h-4 w-16 animate-pulse" />
        <Skeleton className="h-4 w-1/4 animate-pulse" />
        <Skeleton className="h-4 w-16 animate-pulse" />
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <Skeleton className="h-5 w-1/4 animate-pulse" />
            <Skeleton className="h-4 w-1/5 animate-pulse" />
            <Skeleton className="h-6 w-16 animate-pulse" />
            <Skeleton className="h-6 w-16 animate-pulse" />
            <Skeleton className="h-4 w-1/4 animate-pulse" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
