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
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink, Eye, Plus } from "lucide-react";
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

  const getExpectedOnedrivePath = () => {
    if (!selectedClientObj) return "Seleccione un cliente...";
    
    const clientName = selectedClientObj.name.toUpperCase().trim();
    
    const refDate = formData.datetime ? new Date(formData.datetime) : new Date();
    const year = refDate.getFullYear();
    const monthIndex = refDate.getMonth();
    const day = refDate.getDate();

    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthName = months[monthIndex];
    
    const diaStr = day <= 15 ? "15" : "30";

    const selectedInvoiceTypeObj = invoiceTypes.find(t => t.id === selectedInvoiceType);
    const typeLower = selectedInvoiceTypeObj ? selectedInvoiceTypeObj.name.toLowerCase() : "";
    let subfolder = "Otros";
    if (typeLower.includes("quincena")) {
      subfolder = "quincena";
    } else if (typeLower.includes("impuesto")) {
      subfolder = "impuestos";
    }

    return `GESTOR ONEDRIVE/CLIENTES/${clientName}/${year}/${monthName}/${diaStr}/${subfolder}`;
  };

  const previewSubject = getPreviewSubject();
  const previewBodyHtml = getPreviewHtml();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Despacho de Correos
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Envía facturas y documentos manualmente a tus clientes usando plantillas predefinidas y sincronización en OneDrive.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setIsPreviewMode(false);
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-sm hover:scale-[1.02] transition-all font-semibold">
              <Plus className="mr-2 size-4" /> Nuevo Envío Manual
            </Button>
          </DialogTrigger>
          <DialogContent className={`${
            isPreviewMode ? "sm:max-w-[1050px]" : "sm:max-w-[550px]"
          } transition-all duration-300 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg`}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {isPreviewMode ? "Previsualización del Correo" : "Enviar Correo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-1">
                {isPreviewMode 
                  ? "Ajusta los detalles a la izquierda y revisa la previsualización a la derecha en tiempo real." 
                  : "Selecciona el cliente, el tipo de factura y la fecha de referencia (para creación de carpetas en el servidor)."}
              </DialogDescription>
            </DialogHeader>

            {!isPreviewMode ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cliente</Label>
                  <div className="col-span-3">
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))} value={formData.clientId}>
                      <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800">
                        <SelectValue placeholder="Seleccionar Cliente" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                  <Label htmlFor="invoiceType" className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tipo Factura</Label>
                  <div className="col-span-3">
                    <Select onValueChange={handleInvoiceTypeChange} value={selectedInvoiceType}>
                      <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800">
                        <SelectValue placeholder="Seleccionar Tipo de Factura" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                  <Label htmlFor="template" className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">Template</Label>
                  <div className="col-span-3">
                    <Select onValueChange={handleTemplateChange} value={selectedTemplate} disabled={!selectedInvoiceType}>
                      <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800">
                        <SelectValue placeholder={selectedInvoiceType ? "Seleccionar Template" : "Primero selecciona un Tipo de Factura"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                  <Label htmlFor="datetime" className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fecha Ref.</Label>
                  <Input 
                    type="datetime-local" 
                    id="datetime" 
                    className="col-span-3 rounded-xl border-zinc-200 dark:border-zinc-800"
                    value={formData.datetime}
                    onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 pt-1.5">Destino OneDrive</div>
                  <div className="col-span-3 text-xs text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 dark:text-blue-400 p-3 rounded-xl font-mono break-all border border-blue-100/50 dark:border-blue-900/30">
                    {getExpectedOnedrivePath()}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4 mt-2">
                  <Label htmlFor="document" className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400">Documento</Label>
                  <div className="col-span-3">
                    {formData.file ? (
                      <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50 text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{formData.file.name}</span>
                          <span className="text-[10px] text-zinc-400 flex-shrink-0">
                            ({(formData.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md" 
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
                        className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs" 
                        onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
                {/* Columna Izquierda: Controles del Formulario */}
                <div className="md:col-span-4 space-y-4 pr-4 border-r border-zinc-200 dark:border-zinc-800">
                  <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider border-b pb-2">Ajustar Datos</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="client-pv" className="text-xs font-semibold text-zinc-500">Cliente</Label>
                      <Select onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))} value={formData.clientId}>
                        <SelectTrigger id="client-pv" className="w-full rounded-xl border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Seleccionar Cliente" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="invoiceType-pv" className="text-xs font-semibold text-zinc-500">Tipo Factura</Label>
                      <Select onValueChange={handleInvoiceTypeChange} value={selectedInvoiceType}>
                        <SelectTrigger id="invoiceType-pv" className="w-full rounded-xl border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Seleccionar Tipo de Factura" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {invoiceTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="template-pv" className="text-xs font-semibold text-zinc-500">Template</Label>
                      <Select onValueChange={handleTemplateChange} value={selectedTemplate} disabled={!selectedInvoiceType}>
                        <SelectTrigger id="template-pv" className="w-full rounded-xl border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Seleccionar Template" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {availableTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="datetime-pv" className="text-xs font-semibold text-zinc-500">Fecha Ref.</Label>
                      <Input 
                        type="datetime-local" 
                        id="datetime-pv" 
                        value={formData.datetime}
                        onChange={(e) => setFormData(prev => ({ ...prev, datetime: e.target.value }))}
                        className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-zinc-400 font-bold uppercase">Destino OneDrive</Label>
                      <div className="text-[10px] text-blue-600 bg-blue-50/50 dark:bg-blue-950/25 dark:text-blue-400 p-2.5 rounded-xl font-mono break-all border border-blue-100/50 dark:border-blue-900/30">
                        {getExpectedOnedrivePath()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="document-pv" className="text-xs font-semibold text-zinc-500">Documento</Label>
                      {formData.file ? (
                        <div className="flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-zinc-50 dark:bg-zinc-900/50 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{formData.file.name}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md" 
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
                          className="w-full text-xs rounded-xl border-zinc-200 dark:border-zinc-800" 
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
                    <div className="flex text-xs border-b border-zinc-100 dark:border-zinc-900 pb-1.5">
                      <span className="font-bold text-zinc-400 w-14">Para:</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                        {selectedClientObj ? `${selectedClientObj.name} <${selectedClientObj.email}>` : "Seleccione un cliente"}
                      </span>
                    </div>
                    <div className="flex text-xs border-b border-zinc-100 dark:border-zinc-900 py-1.5">
                      <span className="font-bold text-zinc-400 w-14">Asunto:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate">
                        {selectedTemplateObj ? previewSubject : "Seleccione un template"}
                      </span>
                    </div>
                    {formData.file && (
                      <div className="flex text-xs border-b border-zinc-100 dark:border-zinc-900 py-1.5 items-center gap-2">
                        <span className="font-bold text-zinc-400 w-14">Adjunto:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 max-w-[250px] truncate">
                          <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          {formData.file.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-h-[300px] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white shadow-inner relative">
                    {previewBodyHtml ? (
                      <iframe
                        srcDoc={previewBodyHtml}
                        title="Email Preview"
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm p-8 text-center bg-zinc-50 dark:bg-zinc-900/10">
                        <p className="font-bold">Sin previsualización</p>
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
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(false)} disabled={isSending}>Cancelar</Button>
                  <Button className="rounded-xl font-semibold" onClick={() => setIsPreviewMode(true)} disabled={isSending}>Previsualizar</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="rounded-xl" onClick={() => setIsPreviewMode(false)} disabled={isSending}>Volver a editar</Button>
                  <Button className="rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSendMail} disabled={isSending}>
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
          <DialogContent className="sm:max-w-[850px] h-[600px] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Detalle del Correo Enviado</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-1">
                Esta es una copia exacta del correo que fue enviado al cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white shadow-inner relative mt-2">
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
              <Button className="rounded-xl font-semibold" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Sends Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-base text-zinc-850 dark:text-zinc-100">Historial de Envíos Manuales</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Revisa los correos enviados manualmente o mediante plantillas personalizadas</span>
          </div>
          <div className="text-xs text-zinc-400 font-medium">
            Últimos {recentSends.length} envíos
          </div>
        </div>

        <div className="overflow-x-auto">
          {recentSends.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
              No hay envíos registrados en el historial.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Archivo Adjunto</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Cliente</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contacto</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Estado</TableHead>
                  <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-right">Fecha de Envío</TableHead>
                  <TableHead className="py-4 w-[110px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSends.map((item) => (
                  <TableRow key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                    <TableCell className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 font-semibold">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-850 dark:text-zinc-200 truncate max-w-[200px]" title={item.fileName}>
                            {item.fileName}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                            OneDrive Sincronizado
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-zinc-700 dark:text-zinc-350">
                      {item.client?.name || "Cliente Desconocido"}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {item.client?.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {item.status === "PROCESSED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/20">
                          <CheckCircle2 className="h-3 w-3" />
                          ENVIADO
                        </span>
                      ) : item.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/20">
                          <Clock className="h-3 w-3" />
                          PROCESANDO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20">
                          <XCircle className="h-3 w-3" />
                          FALLIDO
                        </span>
                      )}
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
                      <div className="flex items-center justify-end gap-1">
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
                            className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled 
                            title="Copia del correo no disponible (envío antiguo)"
                            className="h-8 w-8 rounded-lg opacity-30 cursor-not-allowed"
                          >
                            <Eye className="h-4 w-4 text-zinc-400" />
                          </Button>
                        )}
                        {item.originalPath && item.originalPath !== "Sin ruta" && (
                          <a href={item.originalPath} target="_blank" rel="noopener noreferrer">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Ver documento adjunto"
                              className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
