import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { EnviarMailsClient } from "./enviar-mails-client";
import { Skeleton } from "@/components/ui/skeleton";

async function EnviarMailsData() {
  const clients = await prisma.client.findMany({ 
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });
  
  const invoiceTypes = await prisma.invoiceType.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  
  const templates = await prisma.template.findMany({ 
    select: { id: true, name: true, invoiceTypeId: true, subject: true, html: true },
    orderBy: { name: 'asc' }
  });

  const recentSends = await prisma.document.findMany({
    where: {
      OR: [
        { fileType: "DOCUMENTO_MANUAL" },
        { emailHtml: { not: null } }
      ]
    },
    select: {
      id: true,
      fileName: true,
      processedAt: true,
      status: true,
      originalPath: true,
      emailHtml: true,
      client: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      processedAt: "desc"
    },
    take: 10
  });

  return (
    <EnviarMailsClient 
      clients={clients} 
      invoiceTypes={invoiceTypes} 
      templates={templates} 
      recentSends={recentSends}
    />
  );
}

export default function EnviarMailsPage() {
  return (
    <Suspense fallback={<EnviarMailsSkeleton />}>
      <EnviarMailsData />
    </Suspense>
  );
}

function EnviarMailsSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-9 w-64 animate-pulse" />
        <Skeleton className="h-9 w-24 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-48 animate-pulse" />
          <Skeleton className="h-4 w-96 animate-pulse" />
          <div className="border rounded-md p-8 text-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto animate-pulse" />
            <Skeleton className="h-4 w-48 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
