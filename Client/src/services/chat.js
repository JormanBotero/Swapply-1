// services/chat.js - VERSIÓN PARA COOKIES
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Usar withCredentials para cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ← COOKIES
});

// Obtener conversaciones
export async function getConversations() {
  try {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

// Obtener mensajes
export async function getMessages(conversationId) {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Enviar mensaje
export async function sendMessage(conversationId, content) {
  try {
    const response = await api.post('/api/chat/messages', {
      conversation_id: conversationId,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Mostrar interés en producto
export async function expressInterest(productId) {
  try {
    console.log(`🤝 Mostrando interés en producto: ${productId}`);
    const response = await api.post(`/api/products/${productId}/interest`);
    console.log('✅ Interés registrado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error expresando interés:', error);
    throw error;
  }
}

export { api }