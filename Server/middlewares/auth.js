// server/middlewares/auth.js - VERSIÓN CORREGIDA
import { verifyToken } from '../services/jwt.js';
import { findById } from '../models/User.js';

const COOKIE_NAME = 'swapply_token';

// Middleware para requerir autenticación
export const requireAuth = async (req, res, next) => {
  try {
    let token;
    
    // 1. PRIMERO: Intentar obtener token de HEADERS (Authorization: Bearer ...)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Token obtenido de headers');
    }
    
    // 2. SEGUNDO: Si no hay en headers, intentar de COOKIES
    if (!token && req.cookies?.[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
      console.log('Token obtenido de cookies');
    }
    
    if (!token) {
      console.log('No se encontró token ni en headers ni en cookies');
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    const payload = verifyToken(token);
    const user = await findById(payload.sub);
    
    if (!user) {
      // Limpiar cookie si usuario no existe
      res.clearCookie(COOKIE_NAME, { 
        httpOnly: true, 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
        secure: process.env.NODE_ENV === 'production' 
      });
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Adjuntar usuario a la request
    req.user = user;
    req.userId = user.id;
    
    console.log(`Usuario autenticado: ${user.id} (${user.email})`);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Limpiar cookie si token es inválido
    res.clearCookie(COOKIE_NAME, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
      secure: process.env.NODE_ENV === 'production' 
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesión expirada' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    return res.status(500).json({ message: 'Error de autenticación' });
  }
};

// Middleware opcional (para rutas que pueden ser públicas o privadas)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Intentar de headers primero
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // Si no, intentar de cookies
    if (!token && req.cookies?.[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    
    if (token) {
      const payload = verifyToken(token);
      const user = await findById(payload.sub);
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Si hay error con el token, continuar sin usuario
    next();
  }
};