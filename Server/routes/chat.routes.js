import { Router } from 'express';
import { 
  getConversations, 
  getConversationMessages,
  sendMessage 
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.js'; // ← Importar

const router = Router();

// Todas las rutas de chat requieren autenticación
router.get('/conversations', requireAuth, getConversations);
router.get('/conversations/:id/messages', requireAuth, getConversationMessages);
router.post('/messages', requireAuth, sendMessage);

export default router;