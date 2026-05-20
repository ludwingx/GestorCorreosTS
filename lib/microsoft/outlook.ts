// ============================================================
// MICROSOFT GRAPH — Outlook / Mail (Delegated /me/)
// ============================================================

import { getAccessToken } from "./auth";

export interface SendMailPayload {
  to:       string;
  subject:  string;
  htmlBody: string;
}

// ─────────────────────────────────────────────────────────────
// Enviar correo desde la cuenta autenticada
// ─────────────────────────────────────────────────────────────

export async function sendEmail(payload: SendMailPayload): Promise<void> {
  const token = await getAccessToken();
  const senderUserId = process.env.ONEDRIVE_USER_ID || process.env.OUTLOOK_SENDER_EMAIL || "me";

  const endpoint = senderUserId === "me"
    ? "https://graph.microsoft.com/v1.0/me/sendMail"
    : `https://graph.microsoft.com/v1.0/users/${senderUserId}/sendMail`;

  const res = await fetch(endpoint, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: payload.subject,
        body:    { contentType: "HTML", content: payload.htmlBody },
        toRecipients: [
          { emailAddress: { address: payload.to } },
        ],
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[Outlook] Error enviando correo:", err.error?.message);
    throw new Error(err.error?.message || "Error enviando correo");
  }
}
