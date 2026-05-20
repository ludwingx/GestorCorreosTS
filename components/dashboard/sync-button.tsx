"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Sincronizando con OneDrive...");

    try {
      const response = await fetch("/api/sync");
      const data = await response.json();

      if (response.ok) {
        const processedCount = data.results?.filter((r: any) => r.status === "PROCESADO").length || 0;
        const failedCount = data.results?.filter((r: any) => r.status !== "PROCESADO").length || 0;

        if (processedCount > 0 || failedCount > 0) {
          toast.success(`Sincronización completada: ${processedCount} procesados, ${failedCount} fallidos`, {
            id: toastId,
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          });
        } else {
          toast.info(data.message || "No se encontraron archivos nuevos", {
            id: toastId,
          });
        }
        
        // Refresh data in the dashboard
        router.refresh();
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (error: any) {
      toast.error(`Error de sincronización: ${error.message}`, {
        id: toastId,
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      variant="default"
      className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Procesando..." : "Sincronizar Bandeja"}
    </Button>
  );
}
