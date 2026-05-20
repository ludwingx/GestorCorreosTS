'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { crearEstructuraCliente } from '@/lib/microsoft/onedrive';

export async function getClients() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  return await prisma.client.findMany({
    include: {
      _count: {
        select: { documents: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function createClient(data: { name: string; email: string }) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  try {
    const nameUpper = data.name.toUpperCase().trim();
    let folderId: string | null = null;

    try {
      const resOneDrive = await crearEstructuraCliente(nameUpper);
      folderId = resOneDrive.rootFolderId;
    } catch (oneDriveError: any) {
      console.error('[createClient] Error creating folders in OneDrive:', oneDriveError);
      return { error: `Error al crear carpetas en OneDrive: ${oneDriveError.message || 'Verifica la conexión'}` };
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        folderId,
      }
    });

    revalidatePath('/clientes');
    return { success: true, client };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un cliente con ese nombre' };
    }
    return { error: 'Error al crear el cliente en la base de datos' };
  }
}

export async function deleteClient(id: string) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  try {
    await prisma.client.delete({
      where: { id }
    });
    revalidatePath('/clientes');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el cliente' };
  }
}
