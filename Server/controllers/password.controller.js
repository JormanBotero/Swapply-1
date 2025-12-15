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
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña - Swapply</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px; background-color:#f4f4f4;">
    <tr>
    <td align="center">
      <table style="width:100%; max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:#3b82f6; padding:40px 20px; text-align:center; color:#fff;">
            <h1 style="margin:0; font-size:28px;">Swapply</h1>
            <p style="margin:5px 0 0 0; font-size:16px;">Restablecimiento de contraseña</p>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 20px; text-align:center; color:#1e293b;">
            <h2 style="font-size:20px; margin-bottom:20px;">¡Hola!</h2>
            <p style="margin:0 0 20px 0; font-size:16px; color:#64748b;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta Swapply.
            </p>
            <p style="margin:0 0 20px 0; font-size:16px; color:#64748b;">
              Ingresa el siguiente código en la aplicación para continuar:
            </p>

            <!-- Código -->
            <a href="#" style="display:inline-block; text-decoration:none; background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%); color:#fff; padding:20px 40px; font-size:32px; font-weight:700; letter-spacing:8px; border-radius:10px; margin:20px 0;">
              ${code}
            </a>

            <p style="margin:20px 0 0 0; font-size:14px; color:#64748b;">
              ⏰ <strong>Importante:</strong> Este código expirará en <strong>10 minutos</strong>
            </p>
            <p style="font-size:14px; color:#0369a1; margin:8px 0;">
              🔒 No compartas este código con nadie.
            </p>
            <p style="font-size:12px; color:#94a3b8; margin-top:20px;">
              Si no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9; padding:20px; text-align:center; font-size:12px; color:#64748b;">
            <p style="margin:0;">¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@swapply.com" style="color:#3b82f6; text-decoration:none;">soporte@swapply.com</a></p>
            <p style="margin:4px 0 0 0;">© ${new Date().getFullYear()} Swapply. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </td>
    </tr>
    </table>
    </body>
    </html>
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
