import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/microsoft/auth";

// POST: Enviar correo
// Body JSON: { "to": "correo@destino.com", "subject": "Asunto", "html": "<h1>Hola</h1>" }
export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan parámetros (to, subject, html)" }, { status: 400 });
    }

    const token = await getAccessToken();

    const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }]
        },
        saveToSentItems: true
      })
    });

    if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.error?.message || "Error enviando correo");
    }

    return NextResponse.json({ message: "Correo enviado correctamente a " + to });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
