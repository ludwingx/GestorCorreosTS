"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
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
import { updateInvoiceType } from "@/actions/invoice-types";
import { toast } from "sonner";

interface InvoiceType {
  id: string;
  name: string;
  description: string | null;
}

interface EditInvoiceTypeDialogProps {
  invoiceType: InvoiceType;
}

export function EditInvoiceTypeDialog({ invoiceType }: EditInvoiceTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(invoiceType.name);
  const [description, setDescription] = useState(invoiceType.description || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("El nombre es requerido");
    }

    setLoading(true);
    const result = await updateInvoiceType(invoiceType.id, {
      name,
      description: description || undefined,
    });

    if (result.success) {
      toast.success("Tipo de factura actualizado correctamente");
      setOpen(false);
    } else {
      toast.error(result.error || "Error al actualizar el tipo de factura");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) {
        setName(invoiceType.name);
        setDescription(invoiceType.description || "");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Editar Tipo de Factura
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del tipo de factura. Los cambios se aplicarán inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre de la Categoría</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Aviso de Mora"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción (Opcional)</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
