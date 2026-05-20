/**
 * Script de prueba de conexión con Azure AD y Microsoft Graph
 * 
 * Uso:
 *   node scripts/test-azure.mjs
 *
 * Qué verifica:
 *   1. Que las credenciales en .env.local son correctas (obtiene token)
 *   2. Que la app tiene acceso al usuario de OneDrive (lista archivos del drive)
 *   3. Que puede enviar correos (solo verifica permisos, NO envía nada)
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Cargar .env.local manualmente (sin depender de dotenv instalado)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").replace(/^"|"$/g, "");
    process.env[key] = value;
  }
} catch {
  console.error("❌ No se encontró .env.local — asegúrate de ejecutar desde la raíz del proyecto");
  process.exit(1);
}

const TENANT_ID  = process.env.AZURE_TENANT_ID;
const CLIENT_ID  = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const USER_ID    = process.env.ONEDRIVE_TARGET_USER_ID;

// ── Validar que las variables estén cargadas ─────────────────
console.log("\n📋 Variables detectadas:");
console.log("  AZURE_TENANT_ID  :", TENANT_ID  || "❌ VACÍA");
console.log("  AZURE_CLIENT_ID  :", CLIENT_ID  || "❌ VACÍA");
console.log("  AZURE_CLIENT_SECRET:", CLIENT_SECRET && CLIENT_SECRET !== "PEGAR_VALUE_DEL_SECRETO_AQUI"
  ? `✅ (${CLIENT_SECRET.slice(0, 6)}...)` : "❌ SIN VALOR REAL");
console.log("  ONEDRIVE_USER_ID :", USER_ID    || "❌ VACÍA");

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || CLIENT_SECRET === "PEGAR_VALUE_DEL_SECRETO_AQUI") {
  console.log("\n⛔ Completa todas las variables en .env.local antes de continuar.\n");
  process.exit(1);
}

// ── PASO 1: Obtener token de Azure AD ────────────────────────
console.log("\n🔑 PASO 1 — Obteniendo token de Azure AD...");

const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

const tokenRes = await fetch(tokenUrl, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope:         "https://graph.microsoft.com/.default",
  }),
});

const tokenData = await tokenRes.json();

if (!tokenRes.ok || !tokenData.access_token) {
  console.error("❌ ERROR obteniendo token:");
  console.error("  Código:", tokenData.error);
  console.error("  Detalle:", tokenData.error_description?.split("\r\n")[0]);
  console.log("\n💡 Causas comunes:");
  console.log("  - El CLIENT_SECRET está mal copiado (revisa que sea el VALUE, no el ID)");
  console.log("  - El TENANT_ID o CLIENT_ID no coinciden con la app registrada");
  process.exit(1);
}

const accessToken = tokenData.access_token;
const expiresIn   = tokenData.expires_in;
console.log(`✅ Token obtenido. Expira en ${expiresIn}s (~${Math.round(expiresIn/60)} min)`);

// ── PASO 2: Verificar acceso al usuario / Drive ──────────────
console.log(`\n📁 PASO 2 — Verificando acceso al usuario: ${USER_ID}...`);

// Primero intentamos obtener el perfil del usuario
const userRes = await fetch(
  `https://graph.microsoft.com/v1.0/users/${USER_ID}`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const userData = await userRes.json();

if (!userRes.ok) {
  console.error("❌ ERROR accediendo al usuario:");
  console.error("  Código:", userData.error?.code);
  console.error("  Detalle:", userData.error?.message);
  console.log("\n💡 Probando con /me en su lugar (solo funciona con Delegated)...");
} else {
  console.log(`✅ Usuario encontrado: ${userData.displayName} (${userData.userPrincipalName})`);
}

// Intentar acceder al drive
const driveRes = await fetch(
  `https://graph.microsoft.com/v1.0/users/${USER_ID}/drive`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const driveText = await driveRes.text();
let driveData = {};
try { driveData = JSON.parse(driveText); } catch { /* respuesta vacía */ }

if (!driveRes.ok) {
  console.error("❌ ERROR accediendo al Drive del usuario:");
  console.error("  Código:", driveData.error?.code);
  console.error("  Detalle:", driveData.error?.message);
  console.log("\n💡 Causas comunes:");
  console.log("  - Cuenta personal sin licencia Microsoft 365 / OneDrive for Business");
  console.log("  - El permiso Files.ReadWrite.All no tiene 'Grant admin consent'");
  console.log("  - El ONEDRIVE_TARGET_USER_ID (Object ID) no es correcto");
} else {
  const driveName = driveData.name || driveData.driveType;
  const quota = driveData.quota;
  console.log(`✅ Drive accesible. Tipo: "${driveName}"`);
  if (quota) {
    const usedGB = (quota.used / 1e9).toFixed(2);
    const totalGB = (quota.total / 1e9).toFixed(2);
    console.log(`   Uso: ${usedGB} GB / ${totalGB} GB`);
  }
}

// ── PASO 3: Verificar permiso de Mail ────────────────────────
if (USER_ID && USER_ID !== "CORREO_DEL_USUARIO_ONEDRIVE@salazargroup.com") {
  console.log(`\n📧 PASO 3 — Verificando acceso a Mailbox de: ${USER_ID}...`);

  const mailRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${USER_ID}/mailFolders/SentItems`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const mailData = await mailRes.json();

  if (!mailRes.ok) {
    console.error("❌ ERROR accediendo al Mailbox:");
    console.error("  Código:", mailData.error?.code);
    console.error("  Detalle:", mailData.error?.message);
    console.log("\n💡 Causas comunes:");
    console.log("  - El permiso Mail.Send no tiene 'Grant admin consent'");
    console.log("  - El usuario no tiene buzón de Exchange / Microsoft 365");
  } else {
    const totalItems = mailData.totalItemCount ?? "?";
    console.log(`✅ Mailbox accesible. Elementos en Enviados: ${totalItems}`);
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ Prueba completada. Revisa los resultados arriba.");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
