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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium text-foreground">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.username}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={loading === user.id}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Cambiar a {user.role === "ADMIN" ? "USER" : "ADMIN"}
                  </DropdownMenuItem>
                  
                  {user.id !== currentUserId && (
                    <DropdownMenuItem 
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
  );
}
