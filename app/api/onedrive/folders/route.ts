import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/microsoft/auth";

// POST: Crear carpeta
// Body JSON: { "parentPath": "CLIENTES", "folderName": "VICTOR" }
export async function POST(request: Request) {
  try {
    const { parentPath, folderName } = await request.json();
    const token = await getAccessToken();

    // Si parentPath está vacío, se crea en la raíz
    const url = parentPath 
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(parentPath)}:/children`
      : `https://graph.microsoft.com/v1.0/me/drive/root/children`;

    const res = await fetch(url, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Error creando carpeta");

    return NextResponse.json({ message: "Carpeta creada", folder: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
