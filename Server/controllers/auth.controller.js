// controllers/auth.controller.js
import bcrypt from 'bcrypt';
import {
  findOneByEmail,
  createUser,
  findById,
  findOneByGoogleId,
  updateUserById
} from '../models/User.js';
import {
  findByEmail as findEmailVerification,
  deleteByEmail as deleteEmailVerification
} from '../models/EmailVerification.js';
import { signAccessToken, verifyToken } from '../services/jwt.js';
import { OAuth2Client } from 'google-auth-library';

const COOKIE_NAME = 'swapply_token';
const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ---------- REGISTER ----------
export async function register(req, res) {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const email = correo.toLowerCase().trim();
    const existing = await findOneByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const ver = await findEmailVerification(email);
    if (!ver || !ver.verified || new Date(ver.expires_at) < new Date()) {
      return res.status(400).json({
        message: 'Debes verificar tu correo antes de registrarte'
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 10);
    const user = await createUser({
      nombre,
      correo: email,
      passwordHash
    });

    await deleteEmailVerification(email).catch(() => {});

    const token = signAccessToken({ sub: user.id, correo: user.correo });

    res
      .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      .status(201)
      .json({
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Error en el registro' });
  }
}

// ---------- LOGIN ----------
export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    const email = correo.toLowerCase().trim();
    const user = await findOneByEmail(email);

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(contrasena, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = signAccessToken({ sub: user.id, correo: user.correo });

    res
      .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      .json({
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        isPremium: user.is_premium
      });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Error en el login' });
  }
}

// ---------- ME ----------
export async function me(req, res) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const payload = verifyToken(token);
    const user = await findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('me error:', err);
    res.status(401).json({ message: 'Token inválido' });
  }
}

// ---------- LOGOUT ----------
export async function logout(_req, res) {
  res
    .clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'none',
      secure: isProd
    })
    .json({ ok: true });
}

// ---------- CHANGE PASSWORD ----------
export async function changePassword(req, res) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const payload = verifyToken(token);
    const user = await findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { contrasena } = req.body;
    if (!contrasena || contrasena.length < 8) {
      return res.status(400).json({
        message: 'Contraseña inválida (mínimo 8 caracteres)'
      });
    }

    const passwordHash = await bcrypt.hash(contrasena, 10);
    await updateUserById(user.id, { passwordHash });

    res.json({ ok: true });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'No se pudo cambiar la contraseña' });
  }
}

// ---------- GOOGLE AUTH ----------
export async function googleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Falta credential' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({
        message: 'Falta GOOGLE_CLIENT_ID en el servidor'
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Token de Google inválido' });
    }

    const sub = payload.sub;
    const email = (payload.email || '').toLowerCase();
    const emailVerified = payload.email_verified;
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture || null;

    if (!email || emailVerified === false) {
      return res.status(401).json({
        message: 'Correo de Google no verificado'
      });
    }

    let user = await findOneByGoogleId(sub);
    if (!user) {
      user = await findOneByEmail(email);
    }

    if (!user) {
      user = await createUser({
        nombre: name,
        correo: email,
        passwordHash: null,
        googleId: sub,
        picture
      });
    } else {
      const updates = {};
      if (!user.google_id) updates.googleId = sub;
      if (!user.picture && picture) updates.picture = picture;

      if (Object.keys(updates).length > 0) {
        user = await updateUserById(user.id, updates);
      }
    }

    const token = signAccessToken({ sub: user.id, correo: user.correo });

    res
      .cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      .json({
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        isPremium: user.is_premium
      });
  } catch (err) {
    console.error('googleAuth error:', err);
    res.status(500).json({
      message: 'No se pudo iniciar sesión con Google'
    });
  }
}
