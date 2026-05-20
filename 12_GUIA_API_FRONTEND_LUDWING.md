# 🚀 12 — GUÍA DE INTEGRACIÓN API (Para Ludwing - Frontend)

**Para**: Ludwing (Arquitecto de Experiencia / Frontend)  
**De**: Ramón (Ingeniero de Integración)  
**Fecha**: 2026-05-12  
**Tema**: Cómo consumir los servicios de Microsoft Graph + Prisma desde la UI

---

## 🏗️ Arquitectura Actual del Backend

Ludwing, el backend de integración ya está listo y conectado a la Base de Datos Remota (`76.13.228.134:4444`) y a **Microsoft Graph** (OneDrive + Outlook).

He implementado el flujo de autenticación mediante *Device Code Flow*, por lo que el servidor ya tiene un `refresh_token` persistente. **Tú no tienes que preocuparte por el login de Microsoft**, la API ya tiene acceso continuo en segundo plano.

Todo está expuesto mediante **API Routes** en Next.js (`app/api/...`). Puedes consumirlas directamente usando `fetch` desde tus Client Components o desde Server Actions.

---

## 🔗 Los 2 Endpoints Principales que vas a usar

### 1. El Orquestador Principal (El botón "Escanear / Sincronizar")
Este es el endpoint más importante. Hace todo el trabajo pesado descrito en los requerimientos.

**`GET /api/sync`**

- **Qué hace:**
  1. Lee los archivos que están en `GESTOR ONEDRIVE/INBOX`.
  2. Busca a qué cliente de la base de datos (Prisma `Client`) pertenece cada archivo.
  3. Mueve el archivo en OneDrive hacia la ruta final (ej: `CLIENTES/VICTOR/2026/Mayo/Facturas`).
  4. Crea un registro en la base de datos (Prisma `Document`) con estado `PROCESSED` o `FAILED`.
  5. Envía un correo automático al cliente vía Outlook.
- **Cuándo usarlo:** Cuando el usuario haga clic en un botón de "Escanear Bandeja" o "Sincronizar" en el Dashboard.
- **Respuesta Esperada:**
  ```json
  {
    "message": "Sincronización completada",
    "results": [
      {
        "file": "Factura_Victor_01.pdf",
        "newName": "20260512_VICTOR_FACTURA_042.pdf",
        "status": "PROCESADO",
        "client": "Victor",
        "docId": "id-del-documento-creado"
      }
    ]
  }
  ```

### 2. Leer Documentos y Clientes (Para tus Tablas y Gráficos)
Para el `ActivityFeed` y las vistas de Clientes, **debes leer directamente de la Base de Datos usando Prisma**.

Ya que el endpoint `/api/sync` guarda todo en la base de datos automáticamente, tú solo debes crear Server Actions o consultar Prisma en tus Server Components:

**Ejemplo para tu `ActivityFeed`:**
```typescript
import prisma from "@/lib/prisma"

export async function getRecentDocuments() {
  return await prisma.document.findMany({
    take: 10,
    orderBy: { id: 'desc' }, // O por createdAt si lo agregas al schema
    include: { client: true }
  });
}
```

---

## 🛠️ Endpoints Atómicos (Por si necesitas hacer UI manual)

Si en el futuro agregas una vista donde el usuario pueda mover o subir archivos manualmente (fuera de la sincronización automática), he dejado estos endpoints atómicos listos:

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| **GET** | `/api/onedrive/files?path=CARPETA` | - | Lista archivos de una ruta en OneDrive. |
| **POST** | `/api/onedrive/folders` | `{ parentPath, folderName }` | Crea una carpeta nueva en OneDrive. |
| **POST** | `/api/onedrive/files` | `FormData (file, path)` | Sube un archivo a OneDrive. |
| **PATCH** | `/api/onedrive/files` | `{ fileId, destPath, newName }` | Mueve o renombra un archivo. |
| **POST** | `/api/outlook/send` | `{ to, subject, html }` | Envía un correo electrónico. |

---

## 🤝 Próximos Pasos (Tu Turno)

1. Haz un `git pull` de la rama `feat/ms-integration` (o haz merge a `main`).
2. Levanta el proyecto (`npm run dev`).
3. Agrega un botón de **"Sincronizar Bandeja"** en el Dashboard.
4. En el `onClick` de ese botón, haz un `fetch('/api/sync')`.
5. Muestra notificaciones Toast (de shadcn) con los resultados que te devuelva el JSON.
6. Reemplaza la data Mock (falsa) de tus componentes por consultas reales a Prisma.

Cualquier duda con los JSONs de respuesta, avísame. ¡La tubería backend está 100% operativa!
