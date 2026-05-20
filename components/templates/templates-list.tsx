"use client";

import { useState } from "react";
import { Search, Edit, Trash2, FileText, Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { deleteTemplate } from "@/actions/templates";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoiceType: {
    id: string;
    name: string;
  } | null;
}

interface TemplatesListProps {
  initialTemplates: Template[];
}

export function TemplatesList({ initialTemplates }: TemplatesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredTemplates = initialTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.invoiceType && t.invoiceType.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este template?")) return;

    setLoading(id);
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success("Template eliminado correctamente");
    } else {
      toast.error(result.error || "Error al eliminar el template");
    }
    setLoading(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar template..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Asunto del Correo</TableHead>
              <TableHead>Tipo de Factura</TableHead>
              <TableHead>Última Edición</TableHead>
              <TableHead>Creador</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron templates.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span>{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.subject ? (
                      <span className="text-sm text-muted-foreground">{template.subject}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">Sin asunto</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {template.invoiceType ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {template.invoiceType.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-dashed">
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{formatDate(template.updatedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.createdBy ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5" />
                        <span>{template.createdBy}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/30 italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/templates/builder/${template.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(template.id)}
                        disabled={loading === template.id}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
