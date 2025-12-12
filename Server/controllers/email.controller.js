// controllers/emailVerificationController.js
import { query } from '../config/db.js';
import { sendMail } from '../services/mailer.js';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestEmailCode(req, res) {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ message: 'Correo requerido' });

    const email = String(correo).toLowerCase().trim();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // UPSERT en PostgreSQL
    await query(`
      INSERT INTO email_verifications (email, code, expires_at, verified)
      VALUES ($1, $2, $3, false)
      ON CONFLICT (email)
      DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, verified = false;
    `, [email, code, expiresAt]);

    const subject = 'Tu código de verificación - Swapply';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificación - Swapply</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
              <tr>
                  <td align="center">
                      <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                          <tr>
                              <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 50px 0; text-align: center;">
                                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Swapply</h1>
                                  <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px; font-weight: 400;">Verificación de correo electrónico</p>
                              </td>
                          </tr>
                          <tr>
                              <td style="padding: 50px 40px;">
                                  <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">¡Hola!</h2>
                                  <p style="color: #64748b; line-height: 1.7; margin: 0 0 32px 0; font-size: 16px;">
                                      Para continuar con tu proceso en Swapply, ingresa el siguiente código de verificación:
                                  </p>

                                  <div style="text-align: center; margin: 40px 0;">
                                      <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 24px 48px; border-radius: 12px; font-size: 36px; font-weight: 800; letter-spacing: 10px; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); border: 1px solid #3b82f6;">
                                          ${code}
                                      </div>
                                  </div>

                                  <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 32px 0;">
                                      <p style="color: #92400e; margin: 0; font-size: 15px; line-height: 1.6; text-align: center;">
                                          ⏰ <strong>Importante:</strong> Este código expirará en <strong>10 minutos</strong>
                                      </p>
                                  </div>

                                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 8px; margin: 24px 0;">
                                      <p style="color: #0369a1; margin: 0; font-size: 14px; line-height: 1.5; text-align: center;">
                                          🔒 Por tu seguridad, no compartas este código con nadie.
                                      </p>
                                  </div>

                                  <p style="color: #94a3b8; line-height: 1.6; margin: 32px 0 0 0; font-size: 14px; text-align: center;">
                                      Si no reconoces esta actividad, puedes ignorar este mensaje de manera segura.
                                  </p>
                              </td>
                          </tr>
                          <tr>
                              <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                                  <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">
                                      ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@swapply.com" style="color: #3b82f6; text-decoration: none;">soporte@swapply.com</a>
                                  </p>
                                  <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                                      © ${new Date().getFullYear()} Swapply. Todos los derechos reservados.
                                  </p>
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
    console.error('requestEmailCode error', err);
    return res.status(500).json({ message: 'No se pudo enviar el código' });
  }
}


// =========================================
// VERIFICAR CÓDIGO
// =========================================

export async function verifyEmailCode(req, res) {
  try {
    const { correo, codigo } = req.body;
    if (!correo || !codigo) return res.status(400).json({ message: 'Datos incompletos' });

    const email = correo.toLowerCase().trim();
    const code = codigo.trim();

    const { rows } = await query(`
      SELECT * FROM email_verifications WHERE email = $1 LIMIT 1
    `, [email]);

    const rec = rows[0];
    if (!rec) return res.status(400).json({ message: 'Solicita un código primero' });
    if (rec.expires_at < new Date()) return res.status(400).json({ message: 'El código expiró' });
    if (rec.code !== code) return res.status(400).json({ message: 'Código inválido' });

    await query(`UPDATE email_verifications SET verified = true WHERE email = $1`, [email]);

    return res.json({ ok: true });

  } catch (err) {
    console.error('verifyEmailCode error', err);
    return res.status(500).json({ message: 'No se pudo verificar el código' });
  }
}
