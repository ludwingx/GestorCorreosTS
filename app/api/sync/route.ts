// ============================================================
// API — GET /api/sync — Endpoint principal para orquestación
// Responsable: Ramón
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  listFolderContents,
  ensureFolderExists,
  moveFile,
  buildOnedrivePath,
} from "@/lib/microsoft/onedrive";
import { sendEmail } from "@/lib/microsoft/outlook";

const INBOX_PATH = process.env.ONEDRIVE_INBOX_PATH || "GESTOR ONEDRIVE/INBOX";

export async function GET() {
  try {
    // 1. Listar archivos en la carpeta de entrada de OneDrive
    const files = await listFolderContents(INBOX_PATH);

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No hay archivos nuevos en INBOX" });
    }

    const results = [];

    // 2. Procesar cada archivo
    for (const file of files) {
      if (file.folder) continue; // Ignorar si es una subcarpeta

      const fileName = file.name || "Archivo_Desconocido";
      const fileId = file.id || "";
      
      // Lógica de clasificación muy simple (puedes mejorarla luego con Regex o IA)
      const classification = classifyByFileName(fileName);
      
      // Buscar cliente en la BD. Esta es una simulación basada en el nombre del archivo.
      // En la vida real, buscaríamos en el contenido o con un patrón más estricto.
      // Por ahora, asumiremos que si el nombre del archivo contiene el nombre de un cliente, es de él.
      const clients = await prisma.client.findMany();
      let matchedClient = null;
      for (const client of clients) {
        if (fileName.toLowerCase().includes(client.name.toLowerCase())) {
          matchedClient = client;
          break;
        }
      }

      if (!matchedClient) {
        // Archivo sin cliente detectado, lo marcamos como FAILED en DB
        const doc = await prisma.document.create({
          data: {
            fileName: fileName,
            fileType: classification,
            originalPath: file.webUrl || "",
            finalPath: "",
            status: "FAILED",
            clientId: clients[0]?.id || "", // Fallback temporal para cumplir el schema
          }
        });
        results.push({ file: fileName, status: "Sin cliente asignado", docId: doc.id });
        continue;
      }

      const now = new Date();
      const basePath = matchedClient.folderId || `CLIENTES/${matchedClient.name}`;
      const destPath = buildOnedrivePath(basePath, now.getFullYear(), now.getMonth() + 1, classification);
      const newName = generateStandardFileName(matchedClient.name, classification, now, fileName.split('.').pop() || "pdf");

      try {
        // Asegurar que las subcarpetas existan (simplificado para el año y mes)
        await ensureFolderExists(basePath, now.getFullYear().toString());
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        await ensureFolderExists(`${basePath}/${now.getFullYear()}`, monthNames[now.getMonth()]);
        
        await ensureFolderExists(`${basePath}/${now.getFullYear()}/${monthNames[now.getMonth()]}`, destPath.split('/').pop() || "Otros");

        // Mover archivo
        const movedFile = await moveFile(fileId, destPath, newName);

        // Registrar en BD (PROCESSED)
        const doc = await prisma.document.create({
          data: {
            fileName: newName,
            fileType: classification,
            originalPath: file.webUrl || "",
            finalPath: movedFile.webUrl || "",
            status: "PROCESSED",
            clientId: matchedClient.id,
          }
        });

        // Enviar correo de notificación
        if (matchedClient.email) {
            await sendEmail({
                to: matchedClient.email,
                subject: `✅ Documento recibido y procesado: ${newName}`,
                htmlBody: buildEmailHtml(matchedClient.name, newName, classification, now)
            });
        }

        results.push({ file: fileName, newName: newName, status: "PROCESADO", client: matchedClient.name, docId: doc.id });

      } catch (error: any) {
        console.error(`Error procesando archivo ${fileName}:`, error);
         // Registrar error en BD
         const doc = await prisma.document.create({
            data: {
              fileName: fileName,
              fileType: classification,
              originalPath: file.webUrl || "",
              finalPath: "",
              status: "FAILED",
              clientId: matchedClient.id,
            }
          });
        results.push({ file: fileName, status: "ERROR_PROCESAMIENTO", error: error.message, docId: doc.id });
      }
    }

    return NextResponse.json({ message: "Sincronización completada", results });

  } catch (error: any) {
    console.error("Error en el endpoint de sincronización:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────────────────────

function classifyByFileName(fileName: string): string {
  const name = fileName.toLowerCase();
  if (/factura|fact\.?\s*n[°º]?\d+|invoice/i.test(name)) return "FACTURA";
  if (/dep[oó]sito|deposito|dep\.|deposit/i.test(name)) return "DEPOSITO";
  return "DOCUMENTO_VARIOS";
}

function generateStandardFileName(
  clientName: string,
  docType: string,
  date: Date,
  extension: string
): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const safeName = clientName.toUpperCase().replace(/\s+/g, "_").slice(0, 20);
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${dateStr}_${safeName}_${docType}_${randomSuffix}.${extension}`;
}

function buildEmailHtml(clientName: string, fileName: string, docType: string, date: Date): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">✅ Documento recibido y organizado</h2>
      <p>Estimado/a <strong>${clientName}</strong>,</p>
      <p>Le confirmamos que hemos recibido y organizado el siguiente documento:</p>
      <ul>
        <li><strong>Tipo:</strong> ${docType}</li>
        <li><strong>Archivo:</strong> ${fileName}</li>
        <li><strong>Fecha:</strong> ${date.toLocaleDateString("es-VE")}</li>
      </ul>
      <p style="color:#6b7280; font-size:12px;">Este es un correo automático de Salazar Group.</p>
    </div>
  `;
}
