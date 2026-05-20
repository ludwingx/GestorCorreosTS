"use server";

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/microsoft/outlook";
import { uploadFile, getOrCreateDestinationFolder, ensureFolderExists } from "@/lib/microsoft/onedrive";

export async function sendMailWithTemplate(data: {
  clientId: string;
  templateId: string;
  datetime: string;
  fileBase64?: string | null;
  fileName?: string | null;
}) {
  try {
    // 1. Validaciones iniciales
    if (!data.clientId) return { error: "Debe seleccionar un cliente." };
    if (!data.templateId) return { error: "Debe seleccionar una plantilla (template)." };

    // Buscar el cliente
    const client = await prisma.client.findUnique({
      where: { id: data.clientId }
    });
    if (!client) return { error: "Cliente no encontrado." };
    if (!client.email) return { error: "El cliente seleccionado no tiene un correo electrónico configurado." };

    // Buscar la plantilla
    const template = await prisma.template.findUnique({
      where: { id: data.templateId },
      include: {
        invoiceType: true
      }
    });
    if (!template) return { error: "Plantilla no encontrada." };

    let fileUrl = "";
    let uploadedFileId = "";
    let onedriveUrl = "";

    // 2. Subir archivo a OB Files y OneDrive si se adjuntó
    if (data.fileBase64 && data.fileName) {
      const OB_FILE_TOKEN = process.env.OB_FILE || "sk_f0aa1147cb619eede17fba029ec575a9941ac19d4fb85ebc";
      const uploadUrl = "https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload";

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OB_FILE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          file: data.fileBase64,
          filename: data.fileName
        })
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        console.error("Error al subir archivo a OB Files:", errText);
        return { error: "Error al subir el archivo al servidor externo de documentos (OB Files)." };
      }

      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        return { error: "El servidor de documentos OB Files rechazó la carga del archivo." };
      }

      fileUrl = uploadData.url;
      uploadedFileId = uploadData.id;

      // Subir también a OneDrive
      try {
        const fileBuffer = Buffer.from(data.fileBase64, "base64");
        const invoiceTypeName = template.invoiceType?.name || "DOCUMENTO_VARIOS";
        
        // Obtener o crear ruta de destino en OneDrive basada en la fecha y tipo de factura
        const destFolder = await getOrCreateDestinationFolder(
          client.name,
          invoiceTypeName,
          data.datetime
        );

        // Subir el archivo
        const uploadedToOnedrive = await uploadFile(
          destFolder.folderId,
          null,
          fileBuffer,
          data.fileName
        );

        onedriveUrl = uploadedToOnedrive.linkCompartible || uploadedToOnedrive.webUrl;

        // Actualizar la carpeta del cliente en la BD si no estaba guardada
        if (!client.folderId) {
          const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || "GESTOR ONEDRIVE";
          const clientesPath = `${rootFolder}/CLIENTES`;
          const nameUpper = client.name.toUpperCase().trim();
          const clientFolder = await ensureFolderExists(clientesPath, nameUpper);
          await prisma.client.update({
            where: { id: client.id },
            data: { folderId: clientFolder.id }
          });
        }
      } catch (oneDriveError: any) {
        console.error("Error al subir archivo a OneDrive:", oneDriveError);
        return { error: `Error al subir el archivo a OneDrive: ${oneDriveError.message || oneDriveError}` };
      }
    }

    // 3. Compilación y reemplazo de variables dinámicas en el HTML
    let emailHtml = template.html || "";
    
    // Obtener la fecha de referencia formateada
    const refDate = data.datetime ? new Date(data.datetime) : new Date();
    const formattedDate = refDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Compañía por defecto
    const companyName = "Burger King S.R.L.";

    // Intentar extraer el número de factura del nombre de archivo
    let invoiceNumber = "N/A";
    if (data.fileName) {
      const match = data.fileName.match(/\d{5,}/);
      if (match) {
        invoiceNumber = match[0];
      } else {
        const matchAny = data.fileName.match(/\d+/);
        if (matchAny) {
          invoiceNumber = matchAny[0];
        }
      }
    }

    // Reemplazos de variables comunes
    emailHtml = emailHtml.replace(/\{\{client_name\}\}/gi, client.name);
    emailHtml = emailHtml.replace(/\{\{name\}\}/gi, client.name);
    emailHtml = emailHtml.replace(/\{\{date\}\}/gi, formattedDate);
    emailHtml = emailHtml.replace(/\{\{email\}\}/gi, client.email);
    emailHtml = emailHtml.replace(/\{\{client_email\}\}/gi, client.email);
    emailHtml = emailHtml.replace(/\{\{company\}\}/gi, companyName);
    emailHtml = emailHtml.replace(/\{\{invoice_number\}\}/gi, invoiceNumber);
    
    if (fileUrl) {
      emailHtml = emailHtml.replace(/\{\{file_url\}\}/gi, fileUrl);
      emailHtml = emailHtml.replace(/\{\{file_name\}\}/gi, data.fileName || "");
      
      // Si el template no incluye la URL del archivo de manera nativa, agregamos un botón de descarga elegante
      if (!emailHtml.includes(fileUrl)) {
        emailHtml += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-family: Arial, sans-serif;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; font-weight: 500;">
              Se ha adjuntado un documento de referencia para su descarga:
            </p>
            <a href="${fileUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center;">
              Descargar ${data.fileName}
            </a>
          </div>
        `;
      }
    } else {
      emailHtml = emailHtml.replace(/\{\{file_url\}\}/gi, "#");
      emailHtml = emailHtml.replace(/\{\{file_name\}\}/gi, "Ninguno");
    }

    // 4. Enviar correo usando el backend de Outlook (Microsoft Graph)
    let subject = template.subject || `Documento de referencia - ${client.name}`;
    subject = subject.replace(/\{\{client_name\}\}/gi, client.name);
    subject = subject.replace(/\{\{name\}\}/gi, client.name);
    subject = subject.replace(/\{\{date\}\}/gi, formattedDate);
    subject = subject.replace(/\{\{email\}\}/gi, client.email);
    subject = subject.replace(/\{\{client_email\}\}/gi, client.email);
    subject = subject.replace(/\{\{company\}\}/gi, companyName);
    subject = subject.replace(/\{\{invoice_number\}\}/gi, invoiceNumber);

    await sendEmail({
      to: client.email,
      subject: subject,
      htmlBody: emailHtml
    });

    // 5. Registrar el documento en la base de datos local con estado PROCESSED
    await prisma.document.create({
      data: {
        fileName: data.fileName || "Sin archivo",
        fileType: template.invoiceType?.name || "DOCUMENTO_VARIOS",
        originalPath: fileUrl || "Sin ruta",
        finalPath: onedriveUrl || fileUrl || "Sin ruta",
        status: "PROCESSED",
        clientId: client.id,
        emailHtml: emailHtml,
      }
    });

    return { success: true, fileUrl, onedriveUrl };
  } catch (error: any) {
    console.error("Error al procesar el envío de correo:", error);
    return { error: error.message || "Error desconocido al procesar el correo." };
  }
}

export async function getFailedDocuments() {
  try {
    const docs = await prisma.document.findMany({
      where: {
        status: "FAILED"
      },
      include: {
        client: true
      },
      orderBy: {
        processedAt: "desc"
      }
    });
    return { success: true, documents: docs };
  } catch (error: any) {
    console.error("Error al obtener documentos fallidos:", error);
    return { error: error.message || "Error al obtener documentos fallidos." };
  }
}

export async function resendFailedDocument(documentId: string) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true }
    });

    if (!doc) return { error: "Documento no encontrado." };
    if (!doc.client) return { error: "El documento no tiene un cliente asociado." };
    if (!doc.client.email) return { error: "El cliente asociado no tiene correo electrónico." };

    // Construir un HTML limpio para el reenvío
    const refDate = new Date(doc.processedAt);
    const formattedDate = refDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 20px;">✉️ Reenvío de Documento Organizado</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 13px;">Gestor de Correos Salazar Group</p>
        </div>
        <p>Estimado/a <strong>${doc.client.name}</strong>,</p>
        <p>Le reenviamos la notificación de recepción del documento adjunto a su cuenta:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; text-align: left;">
          <tr>
            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; width: 40%;">Tipo de Documento:</th>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${doc.fileType}</td>
          </tr>
          <tr>
            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">Nombre del Archivo:</th>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${doc.fileName}</td>
          </tr>
          <tr>
            <th style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">Fecha de Procesamiento:</th>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${formattedDate}</td>
          </tr>
        </table>

        ${doc.originalPath && doc.originalPath !== "Sin ruta" ? `
        <div style="margin: 30px 0 10px 0; text-align: center;">
          <a href="${doc.originalPath}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
            Descargar Documento →
          </a>
        </div>` : ""}

        <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center;">
          Este es un reenvío manual y de carácter informativo. Salazar Group.
        </p>
      </div>
    `;

    const subject = `Reenvío: Documento recibido y procesado: ${doc.fileName}`;

    await sendEmail({
      to: doc.client.email,
      subject: subject,
      htmlBody: emailHtml
    });

    // Actualizar el estado del documento en la BD a PROCESSED
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "PROCESSED",
        emailHtml: emailHtml
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al reenviar documento fallido:", error);
    return { error: error.message || "Error al reenviar el documento." };
  }
}
