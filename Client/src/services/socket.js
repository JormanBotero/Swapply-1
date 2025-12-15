// client/src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

export function initSocket() {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_SOCKET_URL;

  socket = io(url, {
    withCredentials: true,
    transports: ['websocket'],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    console.log('Conectado al chat (socket)');
  });

  socket.on('connect_error', (err) => {
    console.error('Error de conexión al chat:', err.message);
  });

  return socket;
}

export function getSocket() {
  if (!socket) {
    console.warn('Socket no inicializado. Llama a initSocket() primero.');
  }
  return socket;
}

export function joinChat(conversationId) {
  socket?.emit('join-chat', conversationId);
}

export function leaveChat(conversationId) {
  socket?.emit('leave-chat', conversationId);
}

export function sendMessageViaSocket(data) {
  if (!socket) return false;
  socket.emit('send-message', data);
  return true;
}

export function notifyProductInterest(data) {
  socket?.emit('interest-in-product', data);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
