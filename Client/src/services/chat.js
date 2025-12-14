// client/src/services/chat.js
import api from './api';

// Obtener todas las conversaciones del usuario
export async function getConversations() {
  try {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return []; // Retornar array vacío en caso de error
  }
}

// Obtener mensajes de una conversación
export async function getMessages(conversationId) {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Enviar un mensaje
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