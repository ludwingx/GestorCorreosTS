import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/microsoft/auth";

// GET: Listar archivos en una carpeta
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "root";
    
    const token = await getAccessToken();
    const url = path === "root" 
      ? `https://graph.microsoft.com/v1.0/me/drive/root/children`
      : `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(path)}:/children`;

    const res = await fetch(`${url}?$select=id,name,size,webUrl,file,folder`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Error listando archivos");

    return NextResponse.json(data.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Subir un archivo (simple upload < 4MB)
// Body: FormData con 'file' (Blob) y 'path' (string)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string || ""; // Carpeta destino

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo en la petición" }, { status: 400 });
    }

    const token = await getAccessToken();
    const fileBuffer = await file.arrayBuffer();
    
    // Si path está vacío, sube a la raíz. Si no, sube a la carpeta especificada.
    const urlPath = path ? `${path}/${file.name}` : file.name;
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(urlPath)}:/content`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type || "application/octet-stream"
      },
      body: fileBuffer
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Error subiendo archivo");

    return NextResponse.json({ message: "Archivo subido correctamente", file: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Mover/Renombrar un archivo
// Body JSON: { "fileId": "id", "destPath": "NUEVA_CARPETA", "newName": "nuevo_nombre.pdf" }
export async function PATCH(request: Request) {
    try {
        const { fileId, destPath, newName } = await request.json();
        const token = await getAccessToken();

        // 1. Obtener ID de la carpeta destino
        const folderRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(destPath)}?$select=id`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const folderData = await folderRes.json();
        if (!folderRes.ok) throw new Error(`Carpeta destino '${destPath}' no encontrada`);

        // 2. Mover el archivo
        const moveRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
            {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    parentReference: { id: folderData.id },
                    name: newName
                })
            }
        );
        
        const moved = await moveRes.json();
        if (!moveRes.ok) throw new Error(moved.error?.message || "Error moviendo archivo");

        return NextResponse.json({ message: "Archivo movido", file: moved });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
