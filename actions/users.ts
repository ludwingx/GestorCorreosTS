'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function createUser(data: { name: string; username: string; email: string; password: string; role: 'ADMIN' | 'USER' }) {
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
    });

    revalidatePath('/usuarios');
    return { success: true, user: newUser };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'El usuario o email ya existe' };
    }
    return { error: 'Error al crear el usuario' };
  }
}

export async function updateUserRole(userId: string, role: 'ADMIN' | 'USER') {
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    return { error: 'Error al actualizar el rol' };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  // No permitir que un admin se elimine a sí mismo
  if (session.user.id === userId) {
    return { error: 'No puedes eliminarte a ti mismo' };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    return { error: 'Error al eliminar el usuario' };
  }
}
