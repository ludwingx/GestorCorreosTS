// ============================================================
// MICROSOFT AUTH — Delegated (Device Code / Refresh Token)
// Usa el refresh_token guardado en .env para obtener
// access tokens frescos sin necesidad de login del usuario.
// ============================================================

const SCOPES = [
  "https://graph.microsoft.com/Files.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/User.Read",
  "offline_access",
].join(" ");

// Cache en memoria para no pedir token en cada request
let cachedToken: string | null  = null;
let tokenExpiresAt: number      = 0;

export async function getAccessToken(): Promise<string> {
  // Retornar token cacheado si aún es válido (con 60s de margen)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error(
      "❌ MICROSOFT_REFRESH_TOKEN no está configurado en el archivo .env."
    );
  }

  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params: Record<string, string> = {
    client_id:     process.env.AZURE_CLIENT_ID!,
    grant_type:    "refresh_token",
    refresh_token: refreshToken,
    scope:         SCOPES,
  };

  if (process.env.AZURE_CLIENT_SECRET) {
    params.client_secret = process.env.AZURE_CLIENT_SECRET;
  }

  let res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  let data = await res.json();

  // AADSTS90023: Public clients can't send a client secret.
  // Si ocurre este error, significa que la App en Azure se registró como cliente público,
  // por lo que reintentamos el request omitiendo el client_secret.
  if (!res.ok && (data.error_description?.includes("AADSTS90023") || String(data.error).includes("AADSTS90023"))) {
    console.warn("[Auth] ⚠️ La aplicación de Azure está configurada como Cliente Público. Reintentando sin enviar client_secret...");
    delete params.client_secret;
    res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    data = await res.json();
  }

  if (!res.ok || !data.access_token) {
    console.error("[Auth] Error renovando token:", data.error_description || data.error);
    throw new Error("No se pudo obtener un access token de Microsoft.");
  }

  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  console.log(`[Auth] ✅ Access Token actualizado correctamente.`);

  return cachedToken!;
}
