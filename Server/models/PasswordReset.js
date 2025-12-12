// models/PasswordReset.js
import { query } from '../config/db.js';

export async function upsert(email, code, expiresAt) {
  const res = await query(
    `INSERT INTO password_resets (email, code, expires_at, verified)
     VALUES ($1, $2, $3, FALSE)
     ON CONFLICT (email) 
     DO UPDATE SET 
       code = EXCLUDED.code, 
       expires_at = EXCLUDED.expires_at, 
       verified = FALSE,
       created_at = now()
     RETURNING *`,
    [email, code, expiresAt]
  );
  return res.rows[0];
}

export async function findByEmail(email) {
  const res = await query(
    `SELECT * FROM password_resets WHERE email = $1 ORDER BY created_at DESC LIMIT 1`, 
    [email]
  );
  return res.rows[0] || null;
}

export async function markVerified(email) {
  const res = await query(
    `UPDATE password_resets SET verified = TRUE WHERE email = $1 RETURNING *`,
    [email]
  );
  return res.rows[0] || null;
}

export async function deleteByEmail(email) {
  await query('DELETE FROM password_resets WHERE email = $1', [email]);
}