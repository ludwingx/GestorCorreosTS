'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getTemplates() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  return await prisma.template.findMany({
    include: {
      invoiceType: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getTemplate(id: string) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  return await prisma.template.findUnique({
    where: { id },
    include: {
      invoiceType: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });
}

export async function saveTemplate(
  id: string,
  data: {
    name: string;
    subject?: string;
    json: string;
    html: string;
    invoiceTypeId?: string | null;
  }
) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  if (!data.name.trim()) {
    return { error: 'El nombre del template es requerido' };
  }

  const isNew = id === 'new';

  const updateData = {
    name: data.name.trim(),
    subject: data.subject?.trim() || null,
    json: data.json,
    html: data.html,
    invoiceTypeId: data.invoiceTypeId || null,
    createdBy: session.user?.name || null,
  };

  try {
    let template;
    if (isNew) {
      template = await prisma.template.create({
        data: updateData
      });
    } else {
      template = await prisma.template.update({
        where: { id },
        data: updateData
      });
    }

    revalidatePath('/templates');
    revalidatePath('/enviar-mails');
    return { success: true, template };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Ya existe un template con ese nombre' };
    }
    return { error: 'Error al guardar el template' };
  }
}

export async function deleteTemplate(id: string) {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  try {
    await prisma.template.delete({
      where: { id }
    });
    
    revalidatePath('/templates');
    revalidatePath('/enviar-mails');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el template' };
  }
}
