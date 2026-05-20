"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  UserCog
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateUserRole, deleteUser } from "@/actions/users";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string;
}

export function UsersTable({ users, currentUserId }: { users: User[], currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'USER') => {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success("Rol actualizado correctamente");
    } else {
      toast.error(result.error);
    }
    setLoading(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    
    setLoading(userId);
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("Usuario eliminado");
    } else {
      toast.error(result.error);
    }
    setLoading(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-transparent hover:bg-transparent">
            <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nombre</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Usuario</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Rol</TableHead>
              <TableHead className="py-4 w-[60px] text-right text-xs font-semibold uppercase tracking-wider text-zinc-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-900/50 transition-colors">
                <TableCell className="py-4 font-bold text-zinc-900 dark:text-zinc-100">{user.name}</TableCell>
                <TableCell className="py-4 font-semibold text-zinc-700 dark:text-zinc-350">{user.username}</TableCell>
                <TableCell className="py-4 text-zinc-500 dark:text-zinc-400 text-xs font-mono">{user.email}</TableCell>
                <TableCell className="py-4">
                  {user.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50/50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20">
                      <ShieldCheck className="h-3 w-3" />
                      ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50">
                      <UserCog className="h-3 w-3" />
                      OPERADOR
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800" disabled={loading === user.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
                      <DropdownMenuLabel className="text-xs font-bold text-zinc-400 uppercase tracking-wider py-1.5 px-2">Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator className="border-zinc-100 dark:border-zinc-800" />
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                        className="rounded-lg text-xs font-medium cursor-pointer"
                      >
                        <UserCog className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                        Cambiar a {user.role === "ADMIN" ? "OPERADOR" : "ADMIN"}
                      </DropdownMenuItem>
                      
                      {user.id !== currentUserId && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user.id)}
                          className="rounded-lg text-xs font-medium text-red-500 focus:text-red-550 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Eliminar Usuario
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
