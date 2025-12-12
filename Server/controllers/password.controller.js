// controllers/password.controller.js
import { upsert as upsertPasswordReset, findByEmail as findPasswordReset, markVerified as markPasswordResetVerified, deleteByEmail as deletePasswordReset } from '../models/PasswordReset.js';
import { findOneByEmail, updateUserById } from '../models/User.js';
import { sendMail } from '../services/mailer.js';
import bcrypt from 'bcrypt';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestPasswordReset(req, res) {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ message: 'Correo requerido' });
    const email = String(correo).toLowerCase().trim();

    const user = await findOneByEmail(email);
    if (!user) {
      // No revelar si el correo existe o no en producción; aquí devolvemos ok para no filtrar
      return res.json({ ok: true });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await upsertPasswordReset(email, code, expiresAt);

    const subject = 'Código de restablecimiento de contraseña - Swapply';
    const html = `
      <p>Ingresa este código para restablecer tu contraseña:</p>
      <h2>${code}</h2>
      <p>Expira en 10 minutos.</p>
    `;
    await sendMail({ to: email, subject, html });

    return res.json({ ok: true });
  } catch (err) {
    console.error('requestPasswordReset error', err);
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${err?.message || 'error'})`;
    return res.status(500).json({ message: `No se pudo enviar el código${detail}` });
  }
}

export async function verifyPasswordReset(req, res) {
  try {
    const { correo, codigo } = req.body;
    if (!correo || !codigo) return res.status(400).json({ message: 'Datos incompletos' });
    const email = String(correo).toLowerCase().trim();
    const code = String(codigo).trim();

    const rec = await findPasswordReset(email);
    if (!rec) return res.status(400).json({ message: 'Solicita un código primero' });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ message: 'El código expiró' });
    if (rec.code !== code) return res.status(400).json({ message: 'Código inválido' });

    await markPasswordResetVerified(email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('verifyPasswordReset error', err);
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${err?.message || 'error'})`;
    return res.status(500).json({ message: `No se pudo verificar el código${detail}` });
  }
}

export async function resetPassword(req, res) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ message: 'Datos incompletos' });
    const email = String(correo).toLowerCase().trim();

    const rec = await findPasswordReset(email);
    if (!rec || !rec.verified) return res.status(400).json({ message: 'Verifica el código primero' });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ message: 'El código expiró' });

    if (typeof contrasena !== 'string' || contrasena.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña es inválida (mínimo 6 caracteres)' });
    }

    const user = await findOneByEmail(email);
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const passwordHash = await bcrypt.hash(contrasena, 10);
    await updateUserById(user.id, { passwordHash });

    // limpiar token de reset
    try { await deletePasswordReset(email); } catch (e) {}

    return res.json({ ok: true });
  } catch (err) {
    console.error('resetPassword error', err);
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${err?.message || 'error'})`;
    return res.status(500).json({ message: `No se pudo restablecer la contraseña${detail}` });
  }
}
