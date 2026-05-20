import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const templates = await prisma.template.findMany();
  for (const t of templates) {
    console.log(`ID: ${t.id}`);
    console.log(`Name: ${t.name}`);
    if (t.json) {
      try {
        const parsed = JSON.parse(t.json);
        console.log("Template JSON:", JSON.stringify(parsed, null, 2));
      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
    console.log(`---`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
