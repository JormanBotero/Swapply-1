// server/config/db.js
import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('PostgreSQL conectado');
});

pool.on('error', (err) => {
  console.error('Error PostgreSQL:', err);
});

// Función para ejecutar queries
export const query = (text, params) => pool.query(text, params);

// Función para verificar conexión al iniciar
export const checkConnection = async () => {
  try {
    const res = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public';
    `);
    console.log('Tablas existentes en la DB:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error al listar tablas:', err);
    process.exit(1); // Detiene el servidor si no hay conexión
  }
};

export default pool;
