"use client";

import { useState } from "react";
import { Search, Edit, Trash2, FileText, Calendar, User, FileCode } from "lucide-react";
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
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
      {/* Search Header */}
      <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            placeholder="Buscar por nombre, tipo o asunto..."
            className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-zinc-400 font-medium">
          Mostrando {filteredTemplates.length} plantilla(s)
        </div>
      </div>

      {/* Templates Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nombre</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Asunto del Correo</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Asociación Factura</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Última Edición</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Autor</TableHead>
              <TableHead className="py-4 w-[100px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
                  No se encontraron plantillas registradas.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                  <TableCell className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400">
                        <FileCode className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{template.name}</span>
                        <span className="text-[10px] text-zinc-400">ID: {template.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {template.subject ? (
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[200px] block" title={template.subject}>
                        {template.subject}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic font-medium">Sin asunto</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    {template.invoiceType ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100/50 border border-blue-200/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30 text-xs font-semibold py-0.5 px-2">
                        {template.invoiceType.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-zinc-400 border-dashed py-0.5 px-2">
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <Calendar className="size-3.5 text-zinc-400" />
                      <span>{formatDate(template.updatedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {template.createdBy ? (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <User className="size-3.5 text-zinc-400" />
                        <span>{template.createdBy}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">Sistemas</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/templates/builder/${template.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <Edit className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
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
