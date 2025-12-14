// server/middlewares/auth.js
import { verifyToken } from '../services/jwt.js';
import { findById } from '../models/User.js';

const COOKIE_NAME = 'swapply_token';

// Middleware para requerir autenticación
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    
    if (!token) {
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
    
    // Verificar si el token está a punto de expirar (menos de 24 horas)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && (payload.exp - now) < 24 * 60 * 60) {
      // El token se refresca automáticamente en cada request
      // gracias a que ya está en la cookie con maxAge de 7 días
      console.log(`Token del usuario ${user.id} se refrescará pronto`);
    }
    
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
    const token = req.cookies?.[COOKIE_NAME];
    
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