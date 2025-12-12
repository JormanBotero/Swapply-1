// Server/config/db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test de conexión
pool.on('connect', () => {
  console.log('🔗 Conexión a PostgreSQL establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error en conexión PostgreSQL:', err);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Error en query:', { text, params, error: error.message });
    throw error;
  }
}

// Crear tablas optimizadas
export async function initTables() {
  try {
    console.log('🔄 Inicializando tablas de base de datos...');

    // Tabla users - optimizada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        google_id TEXT UNIQUE,
        picture TEXT,
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    console.log('✅ Tabla "users" lista');

    // Tabla email_verifications - con verdadero UPSERT
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS email_verifications_email_idx 
      ON email_verifications(email);
    `);
    console.log('✅ Tabla "email_verifications" lista');

    // Tabla password_resets - optimizada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS password_resets_email_idx 
      ON password_resets(email);
    `);
    console.log('✅ Tabla "password_resets" lista');

    console.log("🎉 ¡Todas las tablas inicializadas correctamente!");
    
  } catch (err) {
    console.error("❌ Error inicializando tablas:", err);
    throw err;
  }
}

export default pool;