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

    // 1. Tabla users - optimizada
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

    // 2. Tabla products - ¡FALTABA ESTA!
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        condition VARCHAR(50) DEFAULT 'nuevo',
        price DECIMAL(10,2) DEFAULT 0,
        images TEXT[] DEFAULT '{}',
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(200),
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    console.log('✅ Tabla "products" lista');

    // 3. Tabla conversations - para el chat
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
    console.log('✅ Tabla "conversations" lista');

    // 4. Tabla messages - para los mensajes del chat
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
    console.log('✅ Tabla "messages" lista');

    // 5. Tabla email_verifications - con verdadero UPSERT
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

    // 6. Tabla password_resets - optimizada
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

    // 7. Crear índices para mejor performance
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

    console.log('🎉 ¡Todas las tablas inicializadas correctamente!');

    // 8. Insertar datos de prueba si no hay productos
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('📦 Insertando datos de prueba...');
      
      // Asegurarse de que exista al menos un usuario
      const usersCount = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(usersCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO users (nombre, correo, password_hash, created_at)
          VALUES ('Usuario Demo', 'demo@swapply.com', '$2b$10$demoHashForTesting', now())
          ON CONFLICT (correo) DO NOTHING;
        `);
      }
      
      // Obtener el primer usuario
      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      const userId = userResult.rows[0]?.id || 1;
      
      // Insertar productos de prueba
      await pool.query(`
        INSERT INTO products (title, description, category, condition, price, images, owner_id, location, status) 
        VALUES 
          ('iPhone 12 Pro 128GB', 'iPhone en perfecto estado, con cargador y funda original. Color plata.', 'electronica', 'como_nuevo', 450, ARRAY['https://images.unsplash.com/photo-1607936854279-55e8a4c64888?w=400'], $1, 'Ciudad de México', 'available'),
          ('Libro: Cien años de soledad', 'Edición especial, apenas leído una vez. Perfecto estado.', 'libros', 'como_nuevo', 25, ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'], $1, 'Guadalajara', 'available'),
          ('Bicicleta de montaña Trek', 'Tamaño M, recién revisada. Ideal para rutas de montaña.', 'deportes', 'bueno', 1200, ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400'], $1, 'Monterrey', 'available'),
          ('Silla gamer ergonómica', 'Con soporte lumbar y reposabrazos ajustables. Color negro.', 'hogar', 'como_nuevo', 180, ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], $1, 'Puebla', 'available'),
          ('Nintendo Switch OLED', 'Incluye 2 controles y juego Mario Kart. Poco uso.', 'electronica', 'como_nuevo', 320, ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400'], $1, 'Querétaro', 'available')
        ON CONFLICT DO NOTHING;
      `, [userId]);
      
      console.log('✅ Datos de prueba insertados');
    }
    
  } catch (err) {
    console.error("❌ Error inicializando tablas:", err);
    throw err;
  }
}

export default pool;