import * as ConversationModel from '../models/Conversation.js';
import * as MessageModel from '../models/message.js';

/**
 * Obtener todas las conversaciones del usuario autenticado
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await ConversationModel.findUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

/**
 * Obtener mensajes de una conversación específica
 */
export const getConversationMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const userId = req.user.id;

    const conversation =
      await ConversationModel.findConversationById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (
      conversation.user1_id !== userId &&
      conversation.user2_id !== userId
    ) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await MessageModel.markMessagesAsRead(conversationId, userId);

    const messages =
      await MessageModel.findMessagesByConversation(conversationId);

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

/**
 * Enviar un mensaje
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversation_id, content } = req.body;
    const userId = req.user.id;

    const conversation =
      await ConversationModel.findConversationById(conversation_id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (
      conversation.user1_id !== userId &&
      conversation.user2_id !== userId
    ) {
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
