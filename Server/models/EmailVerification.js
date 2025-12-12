// models/EmailVerification.js
import { query } from '../config/db.js';

export async function findByEmail(email) {
  const { rows } = await query(`
    SELECT * FROM email_verifications
    WHERE email = $1
    LIMIT 1
  `, [email]);
  return rows[0];
}

export async function deleteByEmail(email) {
  await query(`
    DELETE FROM email_verifications
    WHERE email = $1
  `, [email]);
  return true;
}

export async function markAsVerified(email) {
  await query(`
    UPDATE email_verifications
    SET verified = true
    WHERE email = $1
  `, [email]);
  return true;
}

export async function saveOrUpdate(email, code, expiresAt) {
  await query(`
    INSERT INTO email_verifications (email, code, expires_at, verified)
    VALUES ($1, $2, $3, false)
    ON CONFLICT (email)
    DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified = false;
  `, [email, code, expiresAt]);

  return true;
}
