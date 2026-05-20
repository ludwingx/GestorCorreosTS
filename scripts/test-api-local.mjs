/**
 * Script para probar los endpoints de la API en local
 * 
 * Uso: node scripts/test-api-local.mjs
 */

const BASE_URL = "http://localhost:3000/api";

async function testApi() {
  console.log("🚀 INICIANDO PRUEBAS DE API LOCAL...\n");

  try {
    // 1. Probar listar raíz
    console.log("📂 1. Listando raíz de OneDrive...");
    let res = await fetch(`${BASE_URL}/onedrive/files`);
    let data = await res.json();
    console.log(`   ✅ Respuesta obtenida: ${data.length || 0} elementos encontrados.`);

    // 2. Crear carpeta
    console.log("\n📁 2. Intentando crear carpeta 'GESTOR_TEST'...");
    res = await fetch(`${BASE_URL}/onedrive/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentPath: "", folderName: "GESTOR_TEST" })
    });
    data = await res.json();
    console.log("   ✅ Respuesta:", data.message || data.error);

    // 3. Enviar correo
    console.log("\n📧 3. Enviando correo de prueba a reymondaf650@gmail.com...");
    res = await fetch(`${BASE_URL}/outlook/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "reymondaf650@gmail.com",
        subject: "Test API Automático",
        html: "<p>Correo enviado exitosamente usando nuestro endpoint <b>/api/outlook/send</b></p>"
      })
    });
    data = await res.json();
    console.log("   ✅ Respuesta:", data.message || data.error);

    console.log("\n🎉 PRUEBAS FINALIZADAS.");
  } catch (error) {
    console.error("\n❌ Error de red. ¿Está encendido el servidor (npm run dev)?");
    console.error(error.message);
  }
}

testApi();
