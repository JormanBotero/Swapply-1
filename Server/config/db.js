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

export const query = (text, params) => {
  return pool.query(text, params);
};

export default pool;
