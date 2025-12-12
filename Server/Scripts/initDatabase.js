// scripts/initDatabase.js
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

async function ensureDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      console.error("Missing DATABASE_URL in .env");
      process.exit(1);
    }

    console.log("🔍 Intentando conectar a PostgreSQL...");

    // 1) Parse DATABASE_URL
    const url = new URL(dbUrl);
    const targetDb = url.pathname.replace("/", "");
    const baseUrl = dbUrl.replace(`/${targetDb}`, "/postgres");

    // 2) Connect to default DB (postgres)
    const client = new Client({
      connectionString: baseUrl
    });

    await client.connect();
    console.log("✅ Conectado a PostgreSQL exitosamente");

    // 3) Check if target database exists
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1;",
      [targetDb]
    );

    if (exists.rowCount === 0) {
      console.log(`📦 Base de datos "${targetDb}" no encontrada. Creando...`);
      await client.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`✅ Base de datos "${targetDb}" creada exitosamente.`);
    } else {
      console.log(`📊 Base de datos "${targetDb}" ya existe.`);
    }

    await client.end();
    console.log("🚀 Base de datos lista para usar!");
    
  } catch (err) {
    console.error("❌ Error en conexión a base de datos:", err.message);
    process.exit(1);
  }
}

ensureDatabase();