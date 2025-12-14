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

// Inicialización de tablas
export async function initTables() {
  try {
    console.log('🔄 Inicializando tablas de base de datos...');

    // 1. Users
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
    console.log(' Tabla "users" lista');

    // 2. Products
    await pool.query(`
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
    console.log('Tabla "products" lista');

    // 3. Conversations
    await pool.query(`
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
    console.log('Tabla "conversations" lista');

    // 4. Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    console.log('Tabla "messages" lista');

    // 5. Email verifications
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
    console.log('Tabla "email_verifications" lista');

    // 6. Password resets
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
    console.log('Tabla "password_resets" lista');

    // 7. Índices de performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_category_idx
      ON products(category);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_status_idx
      ON products(status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS products_owner_id_idx
      ON products(owner_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
      ON messages(conversation_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS conversations_user1_id_idx
      ON conversations(user1_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS conversations_user2_id_idx
      ON conversations(user2_id);
    `);

    console.log('¡Todas las tablas inicializadas correctamente!');

    // 8. Insertar datos de prueba si no hay productos
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('📦 Insertando datos de prueba...');

      const usersCount = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(usersCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO users (nombre, correo, password_hash)
          VALUES ('Usuario Demo', 'demo@swapply.com', '$2b$10$demoHash')
          ON CONFLICT (correo) DO NOTHING;
        `);
      }

      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      const userId = userResult.rows[0].id;

      await pool.query(`
        INSERT INTO products
          (title, description, category, condition, images, owner_id, location, status)
        VALUES
          ('iPhone 12 Pro', 'En excelente estado, se busca intercambiar por Android gama alta.', 'electronica', 'como_nuevo',
           ARRAY['https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400'], $1, 'Ciudad de México', 'available'),

          ('Bicicleta de montaña Trek', 'Ideal para rutas de montaña, abierta a intercambios por equipo deportivo.', 'deportes', 'bueno',
           ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400'], $1, 'Monterrey', 'available'),

          ('Nintendo Switch OLED', 'Poco uso, busco intercambiar por consola retro o accesorios gaming.', 'electronica', 'como_nuevo',
           ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400'], $1, 'Querétaro', 'available');
      `, [userId]);

      console.log('Datos de prueba insertados');
    }

  } catch (err) {
    console.error('Error inicializando tablas:', err);
    throw err;
  }
}

export default pool;
