// ============================================================
// MICROSOFT GRAPH — OneDrive (Delegated /me/)
// ============================================================

import { getAccessToken } from "./auth";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export interface DriveItem {
  id:                    string;
  name:                  string;
  size:                  number;
  webUrl:                string;
  lastModifiedDateTime:  string;
  file?:                 { mimeType: string };
  folder?:               { childCount: number };
}

function getDriveBaseUrl(): string {
  const userId = process.env.ONEDRIVE_USER_ID || "me";
  return `https://graph.microsoft.com/v1.0/users/${userId}/drive`;
}

// ─────────────────────────────────────────────────────────────
// Listar archivos en una carpeta del INBOX
// ─────────────────────────────────────────────────────────────

export async function listFolderContents(folderPath: string): Promise<DriveItem[]> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  const url = `${driveBase}/root:/${encodeURIComponent(folderPath)}:/children` +
              `?$select=id,name,size,webUrl,lastModifiedDateTime,file,folder`;

  const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  if (!res.ok) {
    console.error("[OneDrive] Error listando carpeta:", data.error?.message);
    throw new Error(data.error?.message || "Error listando carpeta en OneDrive");
  }

  return (data.value as DriveItem[]).filter((item) => !item.folder);
}

// ─────────────────────────────────────────────────────────────
// Crear carpeta si no existe
// ─────────────────────────────────────────────────────────────

export async function ensureFolderExists(
  parentPath: string,
  folderName: string
): Promise<DriveItem> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  // Intentar obtener la carpeta
  const getUrl = `${driveBase}/root:/${encodeURIComponent(parentPath + "/" + folderName)}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });

  if (getRes.ok) return getRes.json();

  // No existe → crearla
  const createUrl = `${driveBase}/root:/${encodeURIComponent(parentPath)}:/children`;
  const createRes = await fetch(createUrl, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      name:   folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "rename",
    }),
  });

  const created = await createRes.json();
  if (!createRes.ok) throw new Error("[OneDrive] Error creando carpeta: " + created.error?.message);
  return created;
}

// ─────────────────────────────────────────────────────────────
// Mover archivo a carpeta destino
// ─────────────────────────────────────────────────────────────

export async function moveFile(
  fileId:            string,
  destinationPath:   string,
  newFileName:       string
): Promise<DriveItem> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  // Obtener ID de la carpeta destino
  const folderRes  = await fetch(
    `${driveBase}/root:/${encodeURIComponent(destinationPath)}?$select=id`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const folderData = await folderRes.json();

  if (!folderRes.ok) throw new Error("[OneDrive] Carpeta destino no encontrada: " + folderData.error?.message);

  // Mover el archivo
  const moveRes  = await fetch(
    `${driveBase}/items/${fileId}`,
    {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        parentReference: { id: folderData.id },
        name:            newFileName,
      }),
    }
  );
  const moved = await moveRes.json();

  if (!moveRes.ok) throw new Error("[OneDrive] Error moviendo archivo: " + moved.error?.message);
  return moved;
}

// ─────────────────────────────────────────────────────────────
// UTILIDADES — Construir ruta destino en OneDrive
// Resultado: "CLIENTES/VICTOR/2026/Mayo/Facturas"
// ─────────────────────────────────────────────────────────────

export function buildOnedrivePath(
  basePath: string,
  year:     number,
  month:    number,
  docType:  string
): string {
  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  const folderByType: Record<string, string> = {
    FACTURA:          "Facturas",
    DEPOSITO:         "Depositos",
    DOCUMENTO_VARIOS: "Documentos_Varios",
  };

  return `${basePath}/${year}/${months[month - 1]}/${folderByType[docType] ?? "Otros"}`;
}
