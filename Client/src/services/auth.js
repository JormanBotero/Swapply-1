import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // ← MANDATORIO para cookies
  headers: { 'Content-Type': 'application/json' },
});

// ¡NO uses interceptor para guardar token! Tu backend usa cookies

export async function registerUser({ nombre, correo, contrasena }) {
  const res = await api.post('/api/auth/register', { nombre, correo, contrasena });
  return res.data;
}

export async function loginUser({ correo, contrasena }) {
  const res = await api.post('/api/auth/login', { correo, contrasena });
  return res.data;
}

export async function me() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

export async function logoutUser() {
  const res = await api.post('/api/auth/logout');
  localStorage.removeItem('user'); // Limpiar solo usuario
  return res.data;
}

// Email verification
export async function requestEmailVerification(correo) {
  const res = await api.post('/api/auth/email/request-code', { correo });
  return res.data;
}

export async function verifyEmailVerification(correo, codigo) {
  const res = await api.post('/api/auth/email/verify-code', { correo, codigo });
  return res.data;
}

export async function changePassword(contrasena) {
  const res = await api.post('/api/auth/change-password', { contrasena });
  return res.data;
}

// Forgot password
export async function requestPasswordReset(correo) {
  const res = await api.post('/api/auth/password/request', { correo });
  return res.data;
}

export async function verifyPasswordReset(correo, codigo) {
  const res = await api.post('/api/auth/password/verify', { correo, codigo });
  return res.data;
}

export async function resetPassword(correo, codigo, contrasena) {
  const res = await api.post('/api/auth/password/reset', { correo, codigo, contrasena });
  return res.data;
}

// Google login
export async function loginWithGoogle(credential) {
  const res = await api.post('/api/auth/google', { credential });
  return res.data;
}

// **Actualizar perfil**
export async function updateUser({ nombre, correo, picture }) {
  const res = await api.put('/api/users/me', { nombre, correo, picture });
  return res.data; // debe devolver el usuario actualizado
}

export { api };
