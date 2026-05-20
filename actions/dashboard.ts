'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  const [totalDocs, totalClients, failedDocs, processedToday] = await Promise.all([
    prisma.document.count(),
    prisma.client.count(),
    prisma.document.count({ where: { status: 'FAILED' } }),
    prisma.document.count({
      where: {
        processedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return {
    totalDocs,
    totalClients,
    failedDocs,
    processedToday,
  };
}

export async function getRecentDocuments() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  return await prisma.document.findMany({
    take: 10,
    orderBy: {
      processedAt: 'desc',
    },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
  });
}
