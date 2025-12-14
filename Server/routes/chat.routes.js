// server/routes/chat.routes.js
import { Router } from 'express';
import { 
  getConversations, 
  getConversationMessages,
  sendMessage 
} from '../controllers/chat.controller.js';

const router = Router();

// Obtener todas las conversaciones del usuario
router.get('/conversations', getConversations);

// Obtener mensajes de una conversación específica
router.get('/conversations/:id/messages', getConversationMessages);

// Enviar un mensaje
router.post('/messages', sendMessage);

export default router;