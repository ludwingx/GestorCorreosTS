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
      <Card className="col-span-1 border-muted bg-card shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold tracking-tight">Crear Nuevo Tipo</CardTitle>
          <CardDescription>Añade una nueva categoría para agrupar tus templates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nombre de la Categoría</label>
              <Input
                placeholder="Ej. Aviso de Mora"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descripción (Opcional)</label>
              <Input
                placeholder="Descripción breve..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button className="w-full font-medium" type="submit" disabled={isCreating}>
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

      <Card className="col-span-2 border-muted bg-card shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Tipos Existentes</CardTitle>
              <CardDescription>Gestiona las categorías creadas.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tipo..."
                className="pl-9 w-full bg-background/50 focus:bg-background transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                  <TableHead className="text-center font-semibold w-[120px]">Templates</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {t.description || <span className="text-muted-foreground/45 italic font-normal">Sin descripción</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="inline-flex gap-1.5 items-center justify-center font-medium py-0.5 px-2 bg-muted/65 hover:bg-muted text-muted-foreground transition-all">
                        <FileText className="size-3 text-muted-foreground/70" />
                        {t._count?.templates ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <EditInvoiceTypeDialog invoiceType={t} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron tipos de factura creados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
