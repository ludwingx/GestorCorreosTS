"use client";

import { useState } from "react";
import { Search, MoreHorizontal, Mail, FolderOpen, Trash2, Files, ClipboardCopy, Check } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteClient } from "@/actions/clients";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  folderId: string | null;
  _count: {
    documents: number;
  };
}

export function ClientsList({ initialClients }: { initialClients: Client[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredClients = initialClients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) return;
    
    setLoading(id);
    const result = await deleteClient(id);
    if (result.success) {
      toast.success("Cliente eliminado con éxito");
    } else {
      toast.error(result.error || "Error al eliminar el cliente");
    }
    setLoading(null);
  };

  const copyPath = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Ruta copiada al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
      {/* Search Header */}
      <div className="p-5 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-zinc-400 font-medium">
          Mostrando {filteredClients.length} cliente(s)
        </div>
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Cliente</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contacto</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">OneDrive Carpeta Destino</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Documentos</TableHead>
              <TableHead className="py-4 w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-sm">
                  No se encontraron clientes registrados.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const folderPath = `/CLIENTES/${client.name.replace(/\s+/g, "_")}`;
                return (
                  <TableRow key={client.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                    <TableCell className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 font-bold text-sm uppercase">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{client.name}</span>
                          <span className="text-[10px] text-zinc-400">ID: {client.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Mail className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs">{client.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                          <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                          <span>{folderPath}</span>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                          onClick={() => copyPath(client.id, folderPath)}
                        >
                          {copiedId === client.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <ClipboardCopy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20">
                        <Files className="h-3.5 w-3.5" />
                        {client._count.documents}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={loading === client.id}>
                            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 cursor-pointer font-medium"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
