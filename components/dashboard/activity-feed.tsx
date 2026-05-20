"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientFormattedDate } from "@/components/ui/client-formatted-date";
import { FileText, Calendar, Receipt, ExternalLink, Send, Loader2 } from "lucide-react";
import { resendFailedDocument } from "@/actions/send-email";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  originalPath: string;
  finalPath: string;
  status: string;
  processedAt: Date;
  client?: {
    name: string;
  } | null;
}

export function ActivityFeed({ documents }: { documents: Document[] }) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const router = useRouter();

  const handleResend = async (id: string, fileName: string) => {
    setResendingId(id);
    const toastId = toast.loading(`Reenviando notificación para ${fileName}...`);

    try {
      const res = await resendFailedDocument(id);
      if (res.error) {
        toast.error(`Error al reenviar: ${res.error}`, { id: toastId });
      } else {
        toast.success(`Notificación reenviada con éxito para ${fileName}`, { id: toastId });
        router.refresh();
      }
    } catch (err: any) {
      toast.error(`Error inesperado: ${err.message || err}`, { id: toastId });
    } finally {
      setResendingId(null);
    }
  };

  const getDocIcon = (fileType: string) => {
    const typeLower = (fileType || "").toLowerCase();
    if (typeLower.includes("quincena")) {
      return <Calendar className="h-4 w-4 text-blue-500" />;
    }
    if (typeLower.includes("impuesto")) {
      return <Receipt className="h-4 w-4 text-amber-500" />;
    }
    return <FileText className="h-4 w-4 text-zinc-500" />;
  };

  return (
    <div className="rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 py-3.5 pl-6">Documento</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Cliente</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Tipo</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Estado</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 text-right">Fecha</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 dark:text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-medium">No hay actividad reciente.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((item) => {
                const isFailed = item.status === "FAILED";
                const isProcessed = item.status === "PROCESSED";
                
                return (
                  <TableRow 
                    key={item.id}
                    className="border-b border-zinc-100 dark:border-zinc-900/80 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20 transition-colors"
                  >
                    <TableCell className="py-4 pl-6 font-medium">
                      <div className="flex items-center gap-2.5 max-w-[280px]">
                        <div className="flex-shrink-0 p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                          {getDocIcon(item.fileType)}
                        </div>
                        <span className="truncate text-zinc-800 dark:text-zinc-200 text-sm" title={item.fileName}>
                          {item.fileName}
                        </span>
                        {(item.finalPath || item.originalPath) && (
                          <a 
                            href={item.finalPath || item.originalPath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-zinc-400 hover:text-blue-500 transition-colors"
                            title="Ver documento"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                      {item.client?.name || "N/A"}
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      {item.fileType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-semibold rounded-full px-2.5 py-0.5 border ${
                          isProcessed 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                            : isFailed 
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" 
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                      <ClientFormattedDate
                        date={item.processedAt}
                        options={{
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {isFailed && (
                        <button
                          onClick={() => handleResend(item.id, item.fileName)}
                          disabled={resendingId === item.id}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-95"
                        >
                          {resendingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Reenviar
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
