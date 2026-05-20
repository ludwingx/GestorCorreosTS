"use client";

import { useState, useEffect } from "react";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInvoiceTypes } from "@/actions/invoice-types";
import { saveTemplate } from "@/actions/templates";
import { useBuilderStore, EmailBlock } from "./builder-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  templateId: string;
  initialData?: {
    name: string;
    subject: string | null;
    invoiceTypeId: string | null;
  };
}

export function SaveTemplateDialog({ templateId, initialData }: SaveTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState(initialData?.name || "");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [invoiceTypeId, setInvoiceTypeId] = useState<string>(initialData?.invoiceTypeId || "none");
  const { blocks } = useBuilderStore();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSubject(initialData.subject || "");
      setInvoiceTypeId(initialData.invoiceTypeId || "none");
    }
  }, [initialData]);

  useEffect(() => {
    if (open) {
      const fetchTypes = async () => {
        try {
          const result = await getInvoiceTypes();
          setTypes(result);
        } catch (error) {
          toast.error("Error al cargar los tipos de factura");
        }
      };
      fetchTypes();
    }
  }, [open]);

  const compileHtml = (blocksList: EmailBlock[]): string => {
    const buildHtml = (list: EmailBlock[]): string => {
      return list.map(block => {
        let content = '';
        const styles = Object.entries(block.styles)
          .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`)
          .join('; ');
        
        if (block.type === 'title') content = `<h1 style="${styles}">${block.content}</h1>`;
        else if (block.type === 'text') content = `<p style="${styles}">${block.content}</p>`;
        else if (block.type === 'button') content = `<div style="text-align: ${block.styles.textAlign || 'center'};"><a href="${block.content.url}" style="display:inline-block; padding:10px 20px; background-color:#000; color:#fff; text-decoration:none; border-radius:5px; ${styles}">${block.content.text}</a></div>`;
        else if (block.type === 'image') content = `<div style="text-align: ${block.styles.textAlign || 'center'};"><img src="${block.content.url}" alt="${block.content.alt}" style="max-width:100%; ${styles}" /></div>`;
        else if (block.type === 'divider') content = `<hr style="${styles}" />`;
        else if (block.type === 'spacer') content = `<div style="height: ${block.styles.height || '20px'}; ${styles}"></div>`;
        else if (block.type === 'html') content = `<div style="${styles}">${block.content}</div>`;
        else if (block.type === 'header') content = `<table width="100%" style="${styles}"><tr><td>${block.content.logoUrl ? `<img src="${block.content.logoUrl}" height="40" />` : `<strong>LOGO</strong>`}</td><td align="right">${block.content.text}</td></tr></table>`;
        else if (block.type === 'footer') content = `<div style="${styles}">${block.content}</div>`;
        else if (block.type === 'social') content = `<div style="text-align:center; padding: 10px; ${styles}"><a href="${block.content.facebook}" style="margin: 0 10px;">FB</a><a href="${block.content.twitter}" style="margin: 0 10px;">TW</a><a href="${block.content.linkedin}" style="margin: 0 10px;">IN</a></div>`;
        else if (block.type === 'columns') {
          const leftBlocks = blocksList.filter(b => b.parentId === block.id && b.slot === 'left');
          const rightBlocks = blocksList.filter(b => b.parentId === block.id && b.slot === 'right');
          content = `
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td width="50%" valign="top" style="padding: 10px;">${buildHtml(leftBlocks)}</td>
    <td width="50%" valign="top" style="padding: 10px;">${buildHtml(rightBlocks)}</td>
  </tr>
</table>`;
        }
        return content;
      }).join('\n');
    };

    return `
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
  <tr>
    <td align="center">
      <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 20px;">
${buildHtml(blocksList.filter(b => !b.parentId))}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("El nombre del template es requerido");
    }

    setLoading(true);

    const json = JSON.stringify(blocks);
    const html = compileHtml(blocks);
    const selectedInvoiceTypeId = invoiceTypeId === "none" ? null : invoiceTypeId;

    const result = await saveTemplate(templateId, {
      name,
      subject: subject || undefined,
      json,
      html,
      invoiceTypeId: selectedInvoiceTypeId,
    });

    if (result.success) {
      toast.success("Template guardado correctamente");
      setOpen(false);
      
      // If we saved a new template, redirect back to the templates list
      if (templateId === "new") {
        router.push("/templates");
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error || "Error al guardar el template");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs">
          <Save className="size-3 mr-1.5" /> Guardar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Guardar Template
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del template para guardarlo en la base de datos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Nombre del Template</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Recordatorio de Pago Quincena"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-subject">Asunto del Correo (Opcional)</Label>
              <Input
                id="template-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Recordatorio de Pago Importante"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-type">Tipo de Factura Asociado</Label>
              <Select value={invoiceTypeId} onValueChange={setInvoiceTypeId}>
                <SelectTrigger id="template-type">
                  <SelectValue placeholder="Seleccionar Tipo de Factura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno (Sin asignar)</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Confirmar Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
