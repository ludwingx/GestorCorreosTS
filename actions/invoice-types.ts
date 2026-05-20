'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getInvoiceTypes() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  return await prisma.invoiceType.findMany({
    include: {
      _count: {
        select: { templates: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function createInvoiceType(data: { name: string; description?: string }) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  if (!data.name.trim()) {
    return { error: 'El nombre es requerido' };
  }

  try {
    const type = await prisma.invoiceType.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      }
    });

    revalidatePath('/tipos-factura');
    revalidatePath('/enviar-mails');
    return { success: true, type };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un tipo de factura con ese nombre' };
    }
    return { error: 'Error al crear el tipo de factura' };
  }
}

export async function updateInvoiceType(id: string, data: { name: string; description?: string }) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  if (!data.name.trim()) {
    return { error: 'El nombre es requerido' };
  }

  try {
    const type = await prisma.invoiceType.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      }
    });

    revalidatePath('/tipos-factura');
    revalidatePath('/enviar-mails');
    return { success: true, type };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe otro tipo de factura con ese nombre' };
    }
    return { error: 'Error al actualizar el tipo de factura' };
  }
}

export async function deleteInvoiceType(id: string) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  try {
    // Validar si existen templates asociados
    const count = await prisma.template.count({
      where: { invoiceTypeId: id }
    });

    if (count > 0) {
      return { error: 'No se puede eliminar porque hay templates asociados a este tipo de factura' };
    }

    await prisma.invoiceType.delete({
      where: { id }
    });

    revalidatePath('/tipos-factura');
    revalidatePath('/enviar-mails');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el tipo de factura' };
  }
}
