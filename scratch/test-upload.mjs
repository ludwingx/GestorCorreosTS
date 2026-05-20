
const OB_FILE_TOKEN = "sk_f0aa1147cb619eede17fba029ec575a9941ac19d4fb85ebc";
const url = "https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload";

async function testUpload() {
  const base64Content = Buffer.from("Hello World from Agent test").toString("base64");
  
  // Try sending "file" (base64) and "filename"
  const payload = {
    file: base64Content,
    filename: "test_agent_upload.txt"
  };

  console.log("Sending payload to", url);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OB_FILE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error during upload test:", error);
  }
}

testUpload();
