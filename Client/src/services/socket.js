// client/src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

// Inicializar conexión Socket.io
export function initSocket(token = null) {
  if (socket?.connected) return socket;
  
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  socket = io(url, {
    auth: token ? { token } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  // Eventos de conexión
  socket.on('connect', () => {
    console.log('Conectado al servidor de chat');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Desconectado del chat:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Error de conexión al chat:', error);
  });
  
  return socket;
}

// Obtener la instancia del socket
export function getSocket() {
  if (!socket) {
    console.warn('Socket no inicializado. Llama a initSocket() primero.');
  }
  return socket;
}

// Unirse a una sala de chat
export function joinChat(conversationId) {
  if (socket) {
    socket.emit('join-chat', conversationId);
  }
}

// Salir de una sala de chat
export function leaveChat(conversationId) {
  if (socket) {
    socket.emit('leave-chat', conversationId);
  }
}

// Enviar mensaje a través de Socket.io
export function sendMessageViaSocket(data) {
  if (socket) {
    socket.emit('send-message', data);
    return true;
  }
  return false;
}

// Notificar interés en producto
export function notifyProductInterest(data) {
  if (socket) {
    socket.emit('interest-in-product', data);
  }
}

// Desconectar socket
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}