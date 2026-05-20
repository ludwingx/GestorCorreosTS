"use client";

import { use, useState, useEffect } from "react";
import { useBuilderStore } from "@/components/email-builder/builder-store";
import { EmailBuilderLayout } from "@/components/email-builder/email-builder-layout";
import { Button } from "@/components/ui/button";
import { LayoutPanelLeft, Code as CodeIcon, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getTemplate } from "@/actions/templates";
import { SaveTemplateDialog } from "@/components/email-builder/save-template-dialog";

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { previewMode, setPreviewMode, setBlocks } = useBuilderStore();
  const [loading, setLoading] = useState(unwrappedParams.id !== "new");
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (unwrappedParams.id !== "new") {
      const loadTemplate = async () => {
        try {
          const template = await getTemplate(unwrappedParams.id);
          if (template) {
            setInitialData({
              name: template.name,
              subject: template.subject,
              invoiceTypeId: template.invoiceTypeId,
            });
            if (template.json) {
              try {
                const parsed = JSON.parse(template.json);
                if (Array.isArray(parsed)) {
                  setBlocks(parsed);
                } else if (parsed && typeof parsed === "object") {
                  // Convertidor para formato manual personalizado
                  const convertedBlocks: any[] = [];
                  const tData = parsed.template || parsed;
                  
                  if (tData.header) {
                    convertedBlocks.push({
                      id: "header-1",
                      type: "header",
                      content: {
                        logoUrl: tData.header.logo_url || "",
                        text: tData.header.company || "Empresa"
                      },
                      styles: {
                        backgroundColor: tData.header.style?.background_color || "#fafafa",
                        borderBottom: tData.header.style?.border_bottom || "1px solid #e2e8f0",
                        padding: "15px",
                        margin: "0px"
                      }
                    });
                  }
                  
                  if (tData.body) {
                    if (tData.body.greeting) {
                      convertedBlocks.push({
                        id: "greeting-1",
                        type: "title",
                        content: tData.body.greeting,
                        styles: { padding: "10px", margin: "0px", fontSize: "20px" }
                      });
                    }
                    if (tData.body.message) {
                      convertedBlocks.push({
                        id: "message-1",
                        type: "text",
                        content: tData.body.message,
                        styles: { padding: "10px", margin: "0px" }
                      });
                    }
                    if (tData.body.invoice) {
                      const inv = tData.body.invoice;
                      const textLines = [
                        inv.invoice_number ? `Factura Nro: ${inv.invoice_number}` : "",
                        inv.date ? `Fecha: ${inv.date}` : "",
                        inv.email ? `Correo: ${inv.email}` : ""
                      ].filter(Boolean).join("\n");
                      
                      if (textLines) {
                        convertedBlocks.push({
                          id: "invoice-1",
                          type: "text",
                          content: textLines,
                          styles: { padding: "15px", margin: "10px 0px", backgroundColor: "#f8fafc", borderRadius: "6px", whiteSpace: "pre-line" }
                        });
                      }
                    }
                    if (tData.body.note) {
                      convertedBlocks.push({
                        id: "note-1",
                        type: "text",
                        content: tData.body.note,
                        styles: { padding: "10px", margin: "0px", fontStyle: "italic", color: "#64748b" }
                      });
                    }
                  }
                  
                  if (tData.footer) {
                    convertedBlocks.push({
                      id: "footer-1",
                      type: "footer",
                      content: tData.footer.text || "",
                      styles: {
                        color: tData.footer.style?.color || "#888",
                        fontSize: tData.footer.style?.font_size || "12px",
                        borderTop: tData.footer.style?.border_top || "1px solid #e2e8f0",
                        padding: "20px",
                        margin: "0px",
                        textAlign: "center"
                      }
                    });
                  }

                  if (convertedBlocks.length > 0) {
                    setBlocks(convertedBlocks);
                  } else {
                    setBlocks([]);
                  }
                } else {
                  setBlocks([]);
                }
              } catch (e) {
                console.error("Error parsing template JSON:", e);
                setBlocks([]);
              }
            }
          } else {
            toast.error("Template no encontrado.");
          }
        } catch (error) {
          toast.error("Error al cargar el template");
        } finally {
          setLoading(false);
        }
      };
      loadTemplate();
    } else {
      // Clear the canvas for a new template
      setBlocks([]);
      setInitialData(null);
      setLoading(false);
    }
  }, [unwrappedParams.id, setBlocks]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando editor de template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/templates">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-sm">
              {unwrappedParams.id === "new" ? "Nuevo Template" : initialData?.name || "Editando Template"}
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {unwrappedParams.id === "new" ? "Crea una plantilla desde cero" : `ID: ${unwrappedParams.id}`}
            </p>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md">
          <Button 
            variant={previewMode === 'design' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 px-3 text-xs"
            onClick={() => setPreviewMode('design')}
          >
            <LayoutPanelLeft className="size-3 mr-1.5" /> Diseño
          </Button>
          <Button 
            variant={previewMode === 'code' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-7 px-3 text-xs"
            onClick={() => setPreviewMode('code')}
          >
            <CodeIcon className="size-3 mr-1.5" /> Exportar HTML
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Send className="size-3 mr-1.5" /> Test Email
          </Button>
          <SaveTemplateDialog templateId={unwrappedParams.id} initialData={initialData} />
        </div>
      </header>

      {/* Builder Main Area */}
      <EmailBuilderLayout />
    </div>
  );
}
