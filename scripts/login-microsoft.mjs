/**
 * Script de Login con Device Code Flow (OAuth 2.0 Delegated)
 *
 * Uso:
 *   node scripts/login-microsoft.mjs
 *
 * Qué hace:
 *   1. Pide un código a Microsoft
 *   2. Te muestra una URL y un código para pegar en el browser
 *   3. Espera a que inicies sesión con tu cuenta Microsoft personal
 *   4. Guarda el refresh_token en .env.local automáticamente
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

// ── Cargar .env.local ─────────────────────────────────────────
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").replace(/^"|"$/g, "").trim();
}

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;

if (!TENANT_ID || !CLIENT_ID) {
  console.error("❌ Faltan AZURE_TENANT_ID o AZURE_CLIENT_ID en .env.local");
  process.exit(1);
}

const SCOPES = [
  "https://graph.microsoft.com/Files.ReadWrite",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
].join(" ");

const TOKEN_URL   = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const DEVICE_URL  = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`;

// ── PASO 1: Solicitar Device Code ─────────────────────────────
console.log("\n🔐 Iniciando autenticación con Microsoft...\n");

const deviceRes = await fetch(DEVICE_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPES }),
});

const deviceData = await deviceRes.json();

if (!deviceRes.ok) {
  console.error("❌ Error al solicitar Device Code:");
  console.error("  ", deviceData.error_description || deviceData.error);
  process.exit(1);
}

const { device_code, user_code, verification_uri, interval, expires_in } = deviceData;

// ── PASO 2: Mostrar instrucciones al usuario ──────────────────
console.log("═══════════════════════════════════════════════════════");
console.log("  INSTRUCCIONES PARA AUTENTICARTE:");
console.log("═══════════════════════════════════════════════════════");
console.log(`\n  1. Abre este enlace en tu browser:`);
console.log(`     👉  ${verification_uri}\n`);
console.log(`  2. Ingresa este código:`);
console.log(`     🔑  ${user_code}\n`);
console.log(`  3. Inicia sesión con tu cuenta Microsoft personal`);
console.log(`     (reymondaf650@gmail.com)\n`);
console.log(`  ⏳ Tienes ${Math.round(expires_in / 60)} minutos para completarlo.`);
console.log("═══════════════════════════════════════════════════════\n");
console.log("Esperando autenticación...");

// ── PASO 3: Polling hasta que el usuario se autentique ────────
const pollInterval = (interval || 5) * 1000;

async function pollForToken() {
  while (true) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:   CLIENT_ID,
        grant_type:  "urn:ietf:params:oauth:grant-type:device_code",
        device_code: device_code,
      }),
    });

    const tokenData = await tokenRes.json();

    // Todavía esperando al usuario
    if (tokenData.error === "authorization_pending") {
      process.stdout.write(".");
      continue;
    }

    // Usuario se demoró demasiado
    if (tokenData.error === "expired_token") {
      console.error("\n❌ El código expiró. Vuelve a correr el script.");
      process.exit(1);
    }

    // Otro error
    if (tokenData.error) {
      console.error("\n❌ Error:", tokenData.error_description || tokenData.error);
      process.exit(1);
    }

    // ✅ Autenticación exitosa
    return tokenData;
  }
}

const tokens = await pollForToken();

console.log("\n\n✅ ¡Autenticación exitosa!\n");

// ── PASO 4: Guardar refresh_token en .env.local ───────────────
const { access_token, refresh_token } = tokens;

// Leer el archivo actual y reemplazar/agregar los tokens
let newEnvContent = envContent;

if (newEnvContent.includes("MICROSOFT_REFRESH_TOKEN=")) {
  newEnvContent = newEnvContent.replace(
    /MICROSOFT_REFRESH_TOKEN=".*"/,
    `MICROSOFT_REFRESH_TOKEN="${refresh_token}"`
  );
} else {
  newEnvContent += `\n# Token de refresco de Microsoft (generado automáticamente — no compartir)\nMICROSOFT_REFRESH_TOKEN="${refresh_token}"\n`;
}

writeFileSync(envPath, newEnvContent, "utf-8");
console.log("💾 refresh_token guardado en .env.local");
console.log("   (El token dura ~90 días. Vuelve a correr este script si expira)\n");

// ── PASO 5: Verificar identidad del usuario ───────────────────
console.log("🔍 Verificando acceso a Graph API...\n");

const meRes  = await fetch("https://graph.microsoft.com/v1.0/me", {
  headers: { Authorization: `Bearer ${access_token}` },
});
const meData = await meRes.json();

if (meRes.ok) {
  console.log(`  👤 Usuario:  ${meData.displayName}`);
  console.log(`  📧 Email:    ${meData.userPrincipalName || meData.mail}`);
}

const driveRes  = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
  headers: { Authorization: `Bearer ${access_token}` },
});
const driveData = await driveRes.json();

if (driveRes.ok) {
  const usedGB  = (driveData.quota?.used  / 1e9).toFixed(2);
  const totalGB = (driveData.quota?.total / 1e9).toFixed(2);
  console.log(`  📁 OneDrive: ${driveData.driveType} (${usedGB} GB / ${totalGB} GB)`);
} else {
  console.log("  ⚠️  OneDrive:", driveData.error?.message);
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🚀 Todo listo. Ya puedes usar la integración con Microsoft.");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
