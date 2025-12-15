// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import chatRoutes from './routes/chat.routes.js';

import * as ConversationModel from './models/Conversation.js';
import * as MessageModel from './models/message.js';

const app = express();

/**
 * =====================================================
 *  CRÍTICO PARA PRODUCCIÓN (Render / HTTPS / Cookies)
 * =====================================================
 */
app.set('trust proxy', 1); // ← SIN ESTO, LAS COOKIES SECURE NO FUNCIONAN

const httpServer = createServer(app);

/**
 * =====================================================
 *  SOCKET.IO CONFIGURADO CON AUTENTICACIÓN POR COOKIE
 * =====================================================
 */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  },
});

// --------- AUTENTICACIÓN SOCKET.IO (JWT EN COOKIE) ---------
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('No cookies sent'));
    }

    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );

    const token = cookies.swapply_token;
    if (!token) {
      return next(new Error('No token in cookies'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.sub;

    next();
  } catch (err) {
    return next(new Error('Unauthorized socket'));
  }
});

// ---------------- SOCKET EVENTS ------------------
io.on('connection', (socket) => {
  console.log('Usuario conectado (socket):', socket.userId);

  // Sala personal
  socket.join(`user_${socket.userId}`);

  socket.on('join-chat', async (conversationId) => {
    const convo = await ConversationModel.findConversationById(conversationId);
    if (!convo) return;

    if (
      convo.user1_id !== socket.userId &&
      convo.user2_id !== socket.userId
    ) return;

    socket.join(`chat_${conversationId}`);
  });

  socket.on('leave-chat', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  socket.on('send-message', async ({ conversationId, content }) => {
    const convo = await ConversationModel.findConversationById(conversationId);
    if (!convo) return;

    if (
      convo.user1_id !== socket.userId &&
      convo.user2_id !== socket.userId
    ) return;

    const message = await MessageModel.createMessage({
      conversation_id: conversationId,
      sender_id: socket.userId,
      content,
    });

    io.to(`chat_${conversationId}`).emit('new-message', message);
  });

  socket.on('interest-in-product', ({ productId, productOwnerId }) => {
    io.to(`user_${productOwnerId}`).emit('new-interest-notification', {
      productId,
      fromUserId: socket.userId,
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket desconectado:', socket.userId);
  });
});

/**
 * =====================================================
 *  EXPRESS MIDDLEWARES
 * =====================================================
 */
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cookieParser());

/**
 * =====================================================
 *  ROUTES
 * =====================================================
 */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/**
 * =====================================================
 *  START SERVER
 * =====================================================
 */
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO autenticado activo');
});
