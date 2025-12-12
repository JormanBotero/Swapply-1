import { query } from '../config/db.js';

export async function findOneByEmail(email) {
  const res = await query('SELECT * FROM users WHERE correo = $1 LIMIT 1', [email]);
  return res.rows[0] || null;
}

export async function findOneByGoogleId(googleId) {
  const res = await query('SELECT * FROM users WHERE google_id = $1 LIMIT 1', [googleId]);
  return res.rows[0] || null;
}

export async function findById(id) {
  const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0] || null;
}

export async function createUser({ nombre, correo, passwordHash = null, googleId = null, picture = null }) {
  const res = await query(
    `INSERT INTO users (nombre, correo, password_hash, google_id, picture)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [nombre, correo, passwordHash, googleId, picture]
  );
  return res.rows[0];
}

export async function updateUserById(id, updates = {}) {
  const fields = [];
  const values = [];
  let idx = 1;

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

  if (fields.length === 0) return await findById(id);

  fields.push(`updated_at = now()`);
  values.push(id);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
}