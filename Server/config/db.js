import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => console.log('🔗 Conexión a PostgreSQL establecida'));
pool.on('error', (err) => console.error('❌ Error en conexión PostgreSQL:', err));

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('❌ Error en query:', { text, params, error: error.message });
    throw error;
  }
}

export async function initTables() {
  try {
    console.log('🔄 Inicializando tablas de base de datos...');

    // Función para actualizar updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // ----------------------------
    // Tabla users
    await query(`
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
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
        ) THEN
          CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END$$;
    `);

    // ----------------------------
    // Tabla products
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        condition VARCHAR(50) DEFAULT 'nuevo',
        images TEXT[] DEFAULT '{}',
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(200),
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
        ) THEN
          CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END$$;
    `);

    // ----------------------------
    // Tabla conversations
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        last_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(user1_id, user2_id, product_id)
      );
    `);
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at'
        ) THEN
          CREATE TRIGGER update_conversations_updated_at
          BEFORE UPDATE ON conversations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END$$;
    `);

    // ----------------------------
    // Tabla messages
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);`);

    // ----------------------------
    // Tabla email_verifications
    await query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS email_verifications_email_idx ON email_verifications(email);`);

    // ----------------------------
    // Tabla password_resets
    await query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS password_resets_email_idx ON password_resets(email);`);

    // ----------------------------
    // Índices de performance
    await query(`CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);`);
    await query(`CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);`);
    await query(`CREATE INDEX IF NOT EXISTS products_owner_id_idx ON products(owner_id);`);
    await query(`CREATE INDEX IF NOT EXISTS conversations_user1_id_idx ON conversations(user1_id);`);
    await query(`CREATE INDEX IF NOT EXISTS conversations_user2_id_idx ON conversations(user2_id);`);

    console.log('¡Todas las tablas e índices inicializados correctamente!');
  } catch (err) {
    console.error('❌ Error inicializando tablas:', err);
    throw err;
  }
}

export default pool;
