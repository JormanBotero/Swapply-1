// services/jwt.js
import jwt from 'jsonwebtoken';

const ACCESS_EXPIRES = process.env.JWT_EXPIRES || '7d';

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_EXPIRES });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.verify(token, secret);
}
