/**
 * Diagnóstico completo de la cuenta Microsoft
 * Detecta qué servicios están disponibles: OneDrive Personal vs Business, Mail, etc.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").replace(/^"|"$/g, "").trim();
}

// ── Refrescar token ────────────────────────────────────────────
const TOKEN_URL = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

const tokenRes = await fetch(TOKEN_URL, {
  method:  "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id:     process.env.AZURE_CLIENT_ID,
    grant_type:    "refresh_token",
    refresh_token: process.env.MICROSOFT_REFRESH_TOKEN,
    scope:         "https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
  }),
});

const tokenData = await tokenRes.json();
if (!tokenRes.ok) {
  console.error("❌ Error renovando token:", tokenData.error_description);
  process.exit(1);
}
const token = tokenData.access_token;
console.log("✅ Token renovado OK\n");

async function graphGet(path) {
  const res  = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: { raw: text } }; }
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 DIAGNÓSTICO COMPLETO DE CUENTA MICROSOFT");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 1. Perfil del usuario
const me = await graphGet("/me");
if (me.ok) {
  console.log("👤 PERFIL:");
  console.log("   Nombre:", me.data.displayName);
  console.log("   UPN:   ", me.data.userPrincipalName);
  console.log("   Mail:  ", me.data.mail || "(sin mail empresarial)");
} else {
  console.log("👤 PERFIL: ❌", me.data.error?.message);
}

// 2. OneDrive Business (/me/drive)
console.log("\n📁 ONEDRIVE BUSINESS (/me/drive):");
const driveBiz = await graphGet("/me/drive");
if (driveBiz.ok) {
  console.log("   ✅ Disponible. Tipo:", driveBiz.data.driveType);
  const gb = (driveBiz.data.quota?.used / 1e9).toFixed(2);
  console.log("   Uso:", gb, "GB");
} else {
  console.log("   ❌", driveBiz.data.error?.code, "-", driveBiz.data.error?.message);
}

// 3. OneDrive Personal (via /drives)
console.log("\n💾 TODOS LOS DRIVES DISPONIBLES (/me/drives):");
const drives = await graphGet("/me/drives");
if (drives.ok && drives.data.value?.length > 0) {
  for (const d of drives.data.value) {
    const usedGB  = (d.quota?.used  / 1e9).toFixed(2);
    const totalGB = (d.quota?.total / 1e9).toFixed(2);
    console.log(`   ✅ [${d.driveType}] "${d.name}" — ${usedGB}/${totalGB} GB — ID: ${d.id}`);
  }
} else {
  console.log("   ❌", drives.data.error?.message || "Sin drives disponibles");
}

// 4. Root del drive
console.log("\n📂 ARCHIVOS EN RAÍZ (/me/drive/root/children):");
const root = await graphGet("/me/drive/root/children?$select=name,file,folder,size");
if (root.ok) {
  const items = root.data.value || [];
  if (items.length === 0) {
    console.log("   (vacío)");
  } else {
    for (const item of items.slice(0, 10)) {
      const tipo = item.folder ? "📁" : "📄";
      console.log(`   ${tipo} ${item.name}`);
    }
  }
} else {
  console.log("   ❌", root.data.error?.message);
}

// 5. Mailbox
console.log("\n📧 MAILBOX (/me/mailFolders):");
const mail = await graphGet("/me/mailFolders?$top=3");
if (mail.ok) {
  for (const f of mail.data.value || []) {
    console.log(`   ✅ ${f.displayName} (${f.totalItemCount} items)`);
  }
} else {
  console.log("   ❌", mail.data.error?.code, "-", mail.data.error?.message);
}

// 6. Suscripciones activas
console.log("\n💳 SUSCRIPCIONES (/me/licenseDetails):");
const lic = await graphGet("/me/licenseDetails");
if (lic.ok) {
  if (lic.data.value?.length === 0) {
    console.log("   ⚠️  Sin licencias asignadas (cuenta personal sin M365)");
  }
  for (const l of lic.data.value || []) {
    console.log("   -", l.skuPartNumber);
  }
} else {
  console.log("   ❌", lic.data.error?.message);
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
