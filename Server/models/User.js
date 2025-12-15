import { query } from '../config/db.js';

// Buscar un usuario por email
export async function findOneByEmail(email) {
  try {
    const res = await query('SELECT * FROM users WHERE correo = $1 LIMIT 1', [email]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error al buscar por correo:', err);
    throw new Error('Error al consultar el correo');
  }
}

// Buscar un usuario por Google ID
export async function findOneByGoogleId(googleId) {
  try {
    const res = await query('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error al buscar por Google ID:', err);
    throw new Error('Error al consultar el Google ID');
  }
}

// Buscar un usuario por ID
export async function findById(id) {
  try {
    const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('Error al buscar por ID:', err);
    throw new Error('Error al consultar el ID');
  }
}

// Crear un nuevo usuario
export async function createUser({ nombre, correo, passwordHash = null, googleId = null, picture = null }) {
  try {
    const res = await query(
      `INSERT INTO users (nombre, correo, password_hash, google_id, picture)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, correo, passwordHash, googleId, picture]
    );
    return res.rows[0];
  } catch (err) {
    console.error('Error al crear usuario:', err);
    throw new Error('Error al crear el usuario');
  }
}

// Actualizar usuario por ID
export async function updateUserById(id, updates = {}) {
  const fields = [];
  const values = [];
  let idx = 1;

  // Iteramos sobre los campos que recibimos para generar la consulta
  for (const [k, v] of Object.entries(updates)) {
    if (k === 'passwordHash') {
      fields.push(`password_hash = $${idx++}`);
      values.push(v);
    } else if (['nombre', 'correo', 'googleId', 'picture', 'is_premium'].includes(k)) {
      const col = k === 'googleId' ? 'google_id' : k;
      fields.push(`${col} = $${idx++}`);
      values.push(v);
    }
  }

  // Si no hay campos para actualizar, retornamos el usuario original
  if (fields.length === 0) return await findById(id);

  fields.push(`updated_at = now()`);
  values.push(id);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;

  try {
    const res = await query(sql, values);
    return res.rows[0];
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    throw new Error('Error al actualizar el usuario');
  }
}
