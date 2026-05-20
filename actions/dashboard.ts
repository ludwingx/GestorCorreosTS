'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error('No autorizado');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalDocs,
    totalClients,
    failedDocs,
    processedDocs,
    processedToday,
    templatesCount,
    typeBreakdown
  ] = await Promise.all([
    prisma.document.count(),
    prisma.client.count(),
    prisma.document.count({ where: { status: 'FAILED' } }),
    prisma.document.count({ where: { status: 'PROCESSED' } }),
    prisma.document.count({
      where: {
        processedAt: {
          gte: todayStart,
        },
      },
    }),
    prisma.template.count(),
    prisma.document.groupBy({
      by: ['fileType'],
      _count: {
        id: true
      }
    })
  ]);

  const typeDistribution = typeBreakdown.map(item => ({
    name: item.fileType,
    count: item._count.id
  }));

  return {
    totalDocs,
    totalClients,
    failedDocs,
    processedDocs,
    processedToday,
    templatesCount,
    typeDistribution,
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
