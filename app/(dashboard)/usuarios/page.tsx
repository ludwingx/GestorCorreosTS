import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { UsersTable } from "@/components/users/users-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { Skeleton } from "@/components/ui/skeleton";

async function UsersData({ currentUserId }: { currentUserId: string }) {
  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <UsersTable users={users} currentUserId={currentUserId} />;
}

export default async function UsuariosPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Gestión de Usuarios
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Administra los accesos, roles y permisos de los operadores del sistema.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersData currentUserId={session.user.id!} />
      </Suspense>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted/50 border-b flex items-center px-4 justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3 w-1/4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
