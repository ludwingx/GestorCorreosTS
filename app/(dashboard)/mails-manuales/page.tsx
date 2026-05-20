"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getFailedDocuments, resendFailedDocument } from "@/actions/send-email";
import { toast } from "sonner";
import { RefreshCw, Send, Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { ClientFormattedDate } from "@/components/ui/client-formatted-date";

export default function MailsManualesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [failedDocs, setFailedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    body: ""
  });

  // Cargar documentos fallidos
  const loadFailedDocs = async () => {
    setLoading(true);
    const result = await getFailedDocuments();
    if (result.success && result.documents) {
      setFailedDocs(result.documents);
    } else {
      toast.error(result.error || "Error al cargar correos fallidos.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFailedDocs();
  }, []);

  // Manejar reenvío
  const handleResend = async (id: string) => {
    setResendingId(id);
    const toastId = toast.loading("Reenviando correo...");
    const result = await resendFailedDocument(id);
    if (result.success) {
      toast.success("Correo reenviado exitosamente", { id: toastId });
      // Remover de la lista para que desaparezca
      setFailedDocs(prev => prev.filter(doc => doc.id !== id));
    } else {
      toast.error(result.error || "Error al reenviar el correo", { id: toastId });
    }
    setResendingId(null);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          Reenvío Manual
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Redactar Correo Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Redactar Correo de Emergencia / Manual</DialogTitle>
              <DialogDescription>
                Usa esta herramienta solo si un correo automático falló y necesitas reenviarlo manualmente.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to" className="text-right">Para</Label>
                <Input 
                  id="to" 
                  className="col-span-3" 
                  placeholder="ejemplo@correo.com"
                  value={formData.to}
                  onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">Asunto</Label>
                <Input 
                  id="subject" 
                  className="col-span-3" 
                  placeholder="Reenvío de factura..."
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="body" className="text-right mt-3">Mensaje</Label>
                <Textarea 
                  id="body" 
                  className="col-span-3 min-h-[200px]"
                  placeholder="Escribe tu mensaje o pega el HTML..."
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsDialogOpen(false)}>Enviar Inmediatamente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* Tabla de correos con error */}
        <Card className="border-red-200/50 shadow-md">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/10 border-b border-red-100 dark:border-red-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive animate-pulse" />
                <div>
                  <CardTitle className="text-destructive">Correos con Error de Envío</CardTitle>
                  <CardDescription>
                    Documentos clasificados cuyo correo de notificación no se pudo entregar.
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFailedDocs}
                disabled={loading}
                className="h-8 gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : failedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                <h3 className="font-semibold text-foreground text-base">¡Todo al día!</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  No hay correos con error pendientes. Todos los documentos fueron notificados con éxito.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left text-foreground">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b font-semibold">
                    <tr>
                      <th className="px-4 py-3">Archivo</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Destinatario</th>
                      <th className="px-4 py-3">Fecha Error</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {failedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium max-w-[200px] truncate" title={doc.fileName}>
                          {doc.fileName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                            {doc.fileType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium">{doc.client?.name || "Sin cliente"}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{doc.client?.email || "Sin correo"}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <ClientFormattedDate date={doc.processedAt} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 gap-1.5 h-8 font-medium"
                            onClick={() => handleResend(doc.id)}
                            disabled={resendingId === doc.id}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${resendingId === doc.id ? "animate-spin" : ""}`} />
                            Reenviar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
