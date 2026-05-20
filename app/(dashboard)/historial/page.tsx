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
      <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm">
        No hay registros en el historial de procesamiento.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-transparent hover:bg-transparent">
            <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Archivo</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Cliente</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tipo</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Estado</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Ruta / Enlace</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Fecha/Hora</TableHead>
              <TableHead className="py-4 w-[60px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((item) => (
              <TableRow key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 font-semibold">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{item.fileName}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 font-semibold text-zinc-700 dark:text-zinc-350">
                  {item.client?.name || "Desconocido"}
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="secondary" className="font-bold py-0.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 text-[10px]">
                    {item.fileType}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  {item.status === "PROCESSED" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20">
                      <CheckCircle2 className="h-3 w-3" />
                      ÉXITO
                    </span>
                  ) : item.status === "PENDING" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20">
                      <Clock className="h-3 w-3" />
                      PENDIENTE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20">
                      <XCircle className="h-3 w-3" />
                      ERROR
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-[11px] font-mono text-zinc-500 block max-w-[200px] truncate" title={item.finalPath || ""}>
                    {item.finalPath || "-"}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-right text-xs text-zinc-500 dark:text-zinc-400">
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
                <TableCell className="py-4 text-right">
                  {item.finalPath && (item.finalPath.startsWith("http") || item.finalPath.startsWith("https")) && (
                    <a href={item.finalPath} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ExternalLink className="h-4 w-4" />
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Historial de Procesamiento
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Registro completo de todos los archivos detectados y su estado final.
          </p>
        </div>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryData />
      </Suspense>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden bg-card">
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
