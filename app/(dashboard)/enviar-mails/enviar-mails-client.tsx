"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sendMailWithTemplate } from "@/actions/send-email";
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientFormattedDate } from "@/components/ui/client-formatted-date";

export function EnviarMailsClient({ 
  clients, 
  invoiceTypes, 
  templates,
  recentSends = []
}: { 
  clients: any[]; 
  invoiceTypes: any[]; 
  templates: any[]; 
  recentSends?: any[];
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [viewingMailHtml, setViewingMailHtml] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    return {
      clientId: "",
      file: null as File | null,
      datetime: localISOTime
    };
  });

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1] || '';
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMail = async () => {
    if (!formData.clientId) {
      toast.error("Por favor selecciona un cliente.");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Por favor selecciona un template.");
      return;
    }

    try {
      setIsSending(true);
      const toastId = toast.loading("Enviando correo y subiendo archivo...");

      let fileBase64: string | null = null;
      let fileName: string | null = null;

      if (formData.file) {
        fileName = formData.file.name;
        fileBase64 = await getBase64(formData.file);
      }

      const res = await sendMailWithTemplate({
        clientId: formData.clientId,
        templateId: selectedTemplate,
        datetime: formData.datetime,
        fileBase64,
        fileName
      });

      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success("Correo enviado y registrado correctamente.", { id: toastId });
        setIsDialogOpen(false);
        setIsPreviewMode(false);
        router.refresh();
        // Reiniciar formulario
        setFormData(prev => {
          const tzoffset = (new Date()).getTimezoneOffset() * 60000;
          const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
          return {
            clientId: "",
            file: null,
            datetime: localISOTime
          };
        });
        setSelectedInvoiceType("");
        setSelectedTemplate("");
        // Reiniciar input de archivo físico en el DOM
        const fileInput = document.getElementById("document") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al procesar el envío.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInvoiceTypeChange = (value: string) => {
    setSelectedInvoiceType(value);
    setSelectedTemplate("");
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
  };

  const availableTemplates = templates.filter(t => t.invoiceTypeId === selectedInvoiceType);

  const selectedClientObj = clients.find(c => c.id === formData.clientId);
  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);

  const getPreviewHtml = () => {
    if (!selectedTemplateObj || !selectedClientObj) return "";
    
    let html = selectedTemplateObj.html || "";
    
    const refDate = formData.datetime ? new Date(formData.datetime) : new Date();
    const formattedDate = refDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const companyName = "Burger King S.R.L.";

    let invoiceNumber = "N/A";
    if (formData.file) {
      const match = formData.file.name.match(/\d{5,}/);
      if (match) {
        invoiceNumber = match[0];
      } else {
        const matchAny = formData.file.name.match(/\d+/);
        if (matchAny) {
          invoiceNumber = matchAny[0];
        }
      }
    }

    // Replaces
    html = html.replace(/\{\{client_name\}\}/gi, selectedClientObj.name);
    html = html.replace(/\{\{name\}\}/gi, selectedClientObj.name);
    html = html.replace(/\{\{date\}\}/gi, formattedDate);
    html = html.replace(/\{\{email\}\}/gi, selectedClientObj.email || "");
    html = html.replace(/\{\{client_email\}\}/gi, selectedClientObj.email || "");
    html = html.replace(/\{\{company\}\}/gi, companyName);
    html = html.replace(/\{\{invoice_number\}\}/gi, invoiceNumber);
    
    if (formData.file) {
      const fileUrlPlaceholder = "#";
      html = html.replace(/\{\{file_url\}\}/gi, fileUrlPlaceholder);
      html = html.replace(/\{\{file_name\}\}/gi, formData.file.name);
      
      if (!html.includes(fileUrlPlaceholder)) {
        html += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-family: Arial, sans-serif;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 500;">
              Se ha adjuntado un documento de referencia para su descarga:
            </p>
            <a href="${fileUrlPlaceholder}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;">
              Descargar ${formData.file.name}
            </a>
          </div>
        `;
      }
    } else {
      html = html.replace(/\{\{file_url\}\}/gi, "#");
      html = html.replace(/\{\{file_name\}\}/gi, "Ninguno");
    }

    return html;
  };

  const getPreviewSubject = () => {
    let subject = selectedTemplateObj?.subject || (selectedClientObj ? `Documento de referencia - ${selectedClientObj.name}` : "");
    if (!selectedClientObj) return subject;

    const refDate = formData.datetime ? new Date(formData.datetime) : new Date();
    const formattedDate = refDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const companyName = "Burger King S.R.L.";

    let invoiceNumber = "N/A";
    if (formData.file) {
      const match = formData.file.name.match(/\d{5,}/);
      if (match) {
        invoiceNumber = match[0];
      } else {
        const matchAny = formData.file.name.match(/\d+/);
        if (matchAny) {
          invoiceNumber = matchAny[0];
        }
      }
    }

    subject = subject.replace(/\{\{client_name\}\}/gi, selectedClientObj.name);
    subject = subject.replace(/\{\{name\}\}/gi, selectedClientObj.name);
    subject = subject.replace(/\{\{date\}\}/gi, formattedDate);
    subject = subject.replace(/\{\{email\}\}/gi, selectedClientObj.email || "");
    subject = subject.replace(/\{\{client_email\}\}/gi, selectedClientObj.email || "");
    subject = subject.replace(/\{\{company\}\}/gi, companyName);
    subject = subject.replace(/\{\{invoice_number\}\}/gi, invoiceNumber);
    return subject;
  };

  const previewSubject = getPreviewSubject();
  const previewBodyHtml = getPreviewHtml();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Enviar Mails con Template</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setIsPreviewMode(false);
        }}>
          <DialogTrigger asChild>
            <Button>Nuevo Envío</Button>
          </DialogTrigger>
          <DialogContent className={isPreviewMode ? "sm:max-w-[1050px] transition-all duration-300" : "sm:max-w-[550px] transition-all duration-300"}>
            <DialogHeader>
              <DialogTitle>{isPreviewMode ? "Previsualización del Correo" : "Enviar Correo"}</DialogTitle>
              <DialogDescription>
                {isPreviewMode 
                  ? "Ajusta los detalles a la izquierda y revisa la previsualización a la derecha en tiempo real." 
                  : "Selecciona el cliente, el tipo de factura y la fecha de referencia (para creación de carpetas en el servidor)."}
              </DialogDescription>
            </DialogHeader>

            {!isPreviewMode ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">Cliente</Label>
                  <div className="col-span-3">
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))} value={formData.clientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <SelectItem value="empty" disabled>No hay clientes registrados</SelectItem>
                        ) : (
                          clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="invoiceType" className="text-right">Tipo Factura</Label>
                  <div className="col-span-3">
                    <Select onValueChange={handleInvoiceTypeChange} value={selectedInvoiceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar Tipo de Factura" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoiceTypes.length === 0 ? (
                           <SelectItem value="empty" disabled>No hay tipos de factura</SelectItem>
                        ) : (
                           invoiceTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template" className="text-right">Template</Label>
                  <div className="col-span-3">
                    <Select onValueChange={handleTemplateChange} value={selectedTemplate} disabled={!selectedInvoiceType}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedInvoiceType ? "Seleccionar Template" : "Primero selecciona un Tipo de Factura"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.length === 0 ? (
                           <SelectItem value="empty" disabled>No hay templates para este tipo</SelectItem>
                        ) : (
                           availableTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="datetime" className="text-right">Fecha Ref.</Label>
                  <Input 
                    type="datetime-local" 
                    id="datetime" 
                    className="col-span-3"
                    value={formData.datetime}
                    onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4 mt-2">
                  <Label htmlFor="document" className="text-right">Documento</Label>
                  <div className="col-span-3">
                    {formData.file ? (
                      <div className="flex items-center justify-between border rounded-md p-2 bg-muted/30 text-xs">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate font-medium">{formData.file.name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            ({(formData.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10" 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, file: null }));
                            const fileInput = document.getElementById("document") as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                        >
                          <span className="text-xs font-bold">X</span>
                        </Button>
                      </div>
                    ) : (
                      <Input 
                        type="file" 
                        id="document" 
                        className="w-full" 
                        onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
                {/* Columna Izquierda: Controles del Formulario */}
                <div className="md:col-span-4 space-y-4 pr-4 border-r border-muted">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">Ajustar Datos</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-pv">Cliente</Label>
                      <Select onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))} value={formData.clientId}>
                        <SelectTrigger id="client-pv" className="w-full">
                          <SelectValue placeholder="Seleccionar Cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="invoiceType-pv">Tipo Factura</Label>
                      <Select onValueChange={handleInvoiceTypeChange} value={selectedInvoiceType}>
                        <SelectTrigger id="invoiceType-pv" className="w-full">
                          <SelectValue placeholder="Seleccionar Tipo de Factura" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoiceTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="template-pv">Template</Label>
                      <Select onValueChange={handleTemplateChange} value={selectedTemplate} disabled={!selectedInvoiceType}>
                        <SelectTrigger id="template-pv" className="w-full">
                          <SelectValue placeholder="Seleccionar Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="datetime-pv">Fecha Ref.</Label>
                      <Input 
                        type="datetime-local" 
                        id="datetime-pv" 
                        value={formData.datetime}
                        onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="document-pv">Documento</Label>
                      {formData.file ? (
                        <div className="flex items-center justify-between border rounded-md p-2 bg-muted/30 text-xs">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate font-medium">{formData.file.name}</span>
                            <span className="text-[10px] text-zinc-400 flex-shrink-0">
                              ({(formData.file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-destructive hover:bg-destructive/10" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, file: null }));
                              const fileInput = document.getElementById("document") as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                          >
                            <span className="text-[10px] font-bold">X</span>
                          </Button>
                        </div>
                      ) : (
                        <Input 
                          type="file" 
                          id="document-pv" 
                          className="w-full text-xs" 
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData(prev => ({ ...prev, file }));
                            const fileInput = document.getElementById("document") as HTMLInputElement;
                            if (fileInput && file) {
                              const dt = new DataTransfer();
                              dt.items.add(file);
                              fileInput.files = dt.files;
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Previsualización en Vivo */}
                <div className="md:col-span-8 flex flex-col h-[460px]">
                  <div className="space-y-1 px-1 pb-3 flex-shrink-0">
                    <div className="flex text-xs border-b pb-1.5">
                      <span className="font-semibold text-muted-foreground w-14">Para:</span>
                      <span className="text-foreground font-medium truncate">
                        {selectedClientObj ? `${selectedClientObj.name} <${selectedClientObj.email}>` : "Seleccione un cliente"}
                      </span>
                    </div>
                    <div className="flex text-xs border-b py-1.5">
                      <span className="font-semibold text-muted-foreground w-14">Asunto:</span>
                      <span className="text-foreground font-semibold truncate">
                        {selectedTemplateObj ? previewSubject : "Seleccione un template"}
                      </span>
                    </div>
                    {formData.file && (
                      <div className="flex text-xs border-b py-1.5 items-center gap-2">
                        <span className="font-semibold text-muted-foreground w-14">Adjunto:</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted border text-muted-foreground max-w-[250px] truncate">
                          <FileText className="h-2.5 w-2.5 flex-shrink-0" />
                          {formData.file.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-h-[300px] rounded-lg border overflow-hidden bg-white shadow-inner relative">
                    {previewBodyHtml ? (
                      <iframe
                        srcDoc={previewBodyHtml}
                        title="Email Preview"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-8 text-center bg-zinc-50">
                        <p className="font-semibold">Sin previsualización</p>
                        <p className="text-xs mt-1 text-zinc-400">Complete los datos de la izquierda para ver el diseño del correo.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {!isPreviewMode ? (
                <>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSending}>Cancelar</Button>
                  <Button onClick={() => setIsPreviewMode(true)} disabled={isSending}>Previsualizar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsPreviewMode(false)} disabled={isSending}>Volver a editar</Button>
                  <Button onClick={handleSendMail} disabled={isSending}>
                    {isSending ? "Enviando..." : "Enviar Ahora"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para ver copia del correo enviado */}
        <Dialog open={isViewOpen} onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) setViewingMailHtml(null);
        }}>
          <DialogContent className="sm:max-w-[850px] h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>Detalle del Correo Enviado</DialogTitle>
              <DialogDescription>
                Esta es una copia exacta del correo que fue enviado al cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 rounded-lg border overflow-hidden bg-white shadow-inner relative mt-2">
              {viewingMailHtml && (
                <iframe
                  srcDoc={viewingMailHtml}
                  title="Sent Email Content"
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                />
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full border-muted bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Historial de Envíos</CardTitle>
            <CardDescription>
              Revisa los correos que se han enviado usando plantillas y flujos automáticos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSends.length === 0 ? (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground bg-muted/20">
                No hay envíos registrados.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Fecha/Hora</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSends.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground/70" />
                            <span className="font-medium text-foreground">{item.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.client?.name || "Desconocido"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{item.client?.email || "-"}</TableCell>
                        <TableCell>
                          {item.status === "PROCESSED" ? (
                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Enviado</span>
                            </div>
                          ) : item.status === "PENDING" ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Procesando</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Fallido</span>
                            </div>
                          )}
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
                        <TableCell className="text-right flex items-center justify-end gap-1">
                          {item.emailHtml ? (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setViewingMailHtml(item.emailHtml);
                                setIsViewOpen(true);
                              }}
                              title="Previsualizar correo enviado"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled 
                              title="Copia del correo no disponible (envío antiguo)"
                              className="opacity-30 cursor-not-allowed"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          {item.originalPath && item.originalPath !== "Sin ruta" && (
                            <a href={item.originalPath} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" title="Ver documento adjunto">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
