// server/controllers/chat.controller.js
import * as ConversationModel from '../models/Conversation.js';
import * as MessageModel from '../models/message.js';

// Obtener todas las conversaciones del usuario
export const getConversations = async (req, res) => {
  try {
    const userId = 1; // Temporal - reemplazar con autenticación real
    
    const conversations = await ConversationModel.findUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

// Obtener mensajes de una conversación específica
export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1; // Temporal
    
    // Verificar que el usuario pertenece a la conversación
    const conversation = await ConversationModel.findConversationById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    // Marcar mensajes como leídos
    await MessageModel.markMessagesAsRead(id, userId);
    
    const messages = await MessageModel.findMessagesByConversation(id);
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// Enviar un mensaje
export const sendMessage = async (req, res) => {
  try {
    const { conversation_id, content } = req.body;
    const userId = 1; // Temporal
    
    // Verificar que el usuario pertenece a la conversación
    const conversation = await ConversationModel.findConversationById(conversation_id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const message = await MessageModel.createMessage({
      conversation_id,
      sender_id: userId,
      content
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};