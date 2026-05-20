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
// Resolver ID de carpeta desde ruta o ID
// ─────────────────────────────────────────────────────────────

export async function resolveFolderId(pathOrId: string): Promise<string> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  const parts = pathOrId.split("/");
  const firstPart = parts[0];
  const relativePath = parts.slice(1).join("/");

  const isFirstPartId =
    !firstPart.includes("/") &&
    firstPart !== "CLIENTES" &&
    firstPart !== "GESTOR ONEDRIVE";

  let url: string;
  if (isFirstPartId) {
    if (relativePath) {
      url = `${driveBase}/items/${firstPart}:/${encodeURIComponent(relativePath)}?$select=id`;
    } else {
      return firstPart; // Ya es el ID directo
    }
  } else {
    url = `${driveBase}/root:/${encodeURIComponent(pathOrId)}?$select=id`;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `[OneDrive] No se pudo resolver la carpeta ${pathOrId}: ${data.error?.message}`
    );
  }
  return data.id;
}

// ─────────────────────────────────────────────────────────────
// Crear carpeta si no existe
// ─────────────────────────────────────────────────────────────

export async function ensureFolderExists(
  parentPathOrId: string,
  folderName: string
): Promise<DriveItem> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  // 1. Resolver el ID de la carpeta padre
  const parentId = await resolveFolderId(parentPathOrId);

  // 2. Intentar obtener la carpeta hija
  const getUrl = `${driveBase}/items/${parentId}:/${encodeURIComponent(folderName)}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });

  if (getRes.ok) return getRes.json();

  // 3. No existe → crearla bajo el parentId
  const createUrl = `${driveBase}/items/${parentId}/children`;
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
  fileId:              string,
  destinationPathOrId: string,
  newFileName:         string
): Promise<DriveItem> {
  const token = await getAccessToken();
  const driveBase = getDriveBaseUrl();

  // 1. Resolver el ID de la carpeta destino
  const destinationFolderId = await resolveFolderId(destinationPathOrId);

  // 2. Mover el archivo
  const moveRes  = await fetch(
    `${driveBase}/items/${fileId}`,
    {
      method:  "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        parentReference: { id: destinationFolderId },
        name:            newFileName,
      }),
    }
  );
  const moved = await moveRes.json();

  if (!moveRes.ok) throw new Error("[OneDrive] Error moviendo archivo: " + moved.error?.message);
  return moved;
}

// ─────────────────────────────────────────────────────────────
// Crear estructura completa del cliente (CLIENTES/NOMBRE/AÑO/MES/DIA/quincena e impuestos)
// ─────────────────────────────────────────────────────────────

function obtenerMesActual(): string {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return meses[new Date().getMonth()];
}

export async function crearEstructuraCliente(
  nombreCliente: string,
  anio: number | null = null,
  mes: string | null = null,
  dias: number[] = [15, 30]
): Promise<{ rootFolderId: string; rootFolderUrl: string; carpetasCreadas: any[] }> {
  const carpetasCreadas: any[] = [];

  async function crear(nombre: string, parentPath: string) {
    const resultado = await ensureFolderExists(parentPath, nombre);
    const ruta = `${parentPath}/${nombre}`;
    carpetasCreadas.push({ ruta, id: resultado.id, webUrl: resultado.webUrl });
    console.log(`[OneDrive] ✅ Carpeta creada/asegurada: ${ruta}`);
    return resultado;
  }

  const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || "GESTOR ONEDRIVE";
  const parentFolder = `${rootFolder}/CLIENTES`;
  const nameUpper = nombreCliente.toUpperCase().trim();

  // Nivel 1: GESTOR ONEDRIVE/CLIENTES/CLIENTE
  const resCliente = await crear(nameUpper, parentFolder);
  const rutaCliente = `${parentFolder}/${nameUpper}`;

  // Nivel 2: AÑO
  const anioStr = String(anio ?? new Date().getFullYear());
  await crear(anioStr, rutaCliente);
  const rutaAnio = `${rutaCliente}/${anioStr}`;

  // Nivel 3: MES
  const mesStr = mes ?? obtenerMesActual();
  await crear(mesStr, rutaAnio);
  const rutaMes = `${rutaAnio}/${mesStr}`;

  // Nivel 4: DÍA + quincena e impuestos
  for (const dia of dias) {
    const diaStr = String(dia);
    await crear(diaStr, rutaMes);
    const rutaDia = `${rutaMes}/${diaStr}`;
    await crear("quincena", rutaDia);
    await crear("impuestos", rutaDia);
  }

  return {
    rootFolderId: resCliente.id,
    rootFolderUrl: resCliente.webUrl,
    carpetasCreadas
  };
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
