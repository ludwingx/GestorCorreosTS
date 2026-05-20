"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
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
import { createClient } from "@/actions/clients";
import { toast } from "sonner";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const clientName = formData.get("name") as string;
    const email = formData.get("email") as string;

    const result = await createClient({ name: clientName, email });

    if (result.success) {
      toast.success("Cliente creado correctamente");
      setOpen(false);
      setName("");
    } else {
      toast.error(result.error || "Error al crear el cliente");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agregar Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del cliente. La carpeta de OneDrive se gestionará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Comercial</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Ej. Salazar Group" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {name && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground italic">
                    Estructura automática en OneDrive:
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono bg-muted/50 p-1.5 rounded border border-dashed">
                    <span className="text-blue-600">/CLIENTES</span>
                    <span>/</span>
                    <span className="font-bold text-foreground">{name.replace(/\s+/g, '_')}</span>
                    <span className="text-zinc-400">/ [AÑO] / [MES] / [TIPO]</span>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email de Notificación</Label>
              <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
