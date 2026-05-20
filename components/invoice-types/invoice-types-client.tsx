"use client";

import { useState } from "react";
import { Plus, Trash2, Search, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createInvoiceType, deleteInvoiceType } from "@/actions/invoice-types";
import { EditInvoiceTypeDialog } from "./edit-invoice-type-dialog";

interface InvoiceType {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    templates: number;
  };
}

interface InvoiceTypesClientProps {
  invoiceTypes: InvoiceType[];
}

export function InvoiceTypesClient({ invoiceTypes }: InvoiceTypesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error("El nombre es requerido");

    setIsCreating(true);
    const result = await createInvoiceType({
      name: newName,
      description: newDesc || undefined,
    });

    if (result.success) {
      toast.success("Tipo de factura creado correctamente");
      setNewName("");
      setNewDesc("");
    } else {
      toast.error(result.error || "Error al crear el tipo de factura");
    }
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este tipo de factura?")) return;

    setDeletingId(id);
    const result = await deleteInvoiceType(id);
    if (result.success) {
      toast.success("Tipo de factura eliminado");
    } else {
      toast.error(result.error || "Error al eliminar el tipo de factura");
    }
    setDeletingId(null);
  };

  const filteredTypes = invoiceTypes.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="grid gap-6 md:grid-cols-3 items-start">
      <Card className="col-span-1 border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Crear Nuevo Tipo</CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-1">Añade una nueva categoría para agrupar tus templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre de la Categoría</label>
              <Input
                placeholder="Ej. Aviso de Mora"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Descripción (Opcional)</label>
              <Input
                placeholder="Descripción breve..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <Button className="w-full font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all" type="submit" disabled={isCreating}>
              {isCreating ? (
                "Creando..."
              ) : (
                <>
                  <Plus className="mr-2 size-4" /> Crear Tipo de Factura
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="col-span-2 border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tipos Existentes</CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">Gestiona las categorías creadas.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar tipo..."
                className="pl-9 pr-4 py-2.5 w-full rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent hover:bg-transparent">
              <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nombre</TableHead>
                <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Descripción</TableHead>
                <TableHead className="py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[120px]">Templates</TableHead>
                <TableHead className="py-4 w-[110px] text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((t) => (
                <TableRow key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                  <TableCell className="py-4 font-bold text-zinc-850 dark:text-zinc-100">{t.name}</TableCell>
                  <TableCell className="py-4 text-zinc-500 dark:text-zinc-450 text-sm max-w-[200px] truncate">
                    {t.description || <span className="text-zinc-300 dark:text-zinc-700 italic font-normal">Sin descripción</span>}
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge variant="secondary" className="inline-flex gap-1.5 items-center justify-center font-bold py-1 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 transition-all">
                      <FileText className="size-3 text-zinc-500" />
                      {t._count?.templates ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <EditInvoiceTypeDialog invoiceType={t} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
                    No se encontraron tipos de factura creados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
