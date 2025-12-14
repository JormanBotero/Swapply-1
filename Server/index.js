// server/index.js - VERSIÓN CON SOCKET.IO
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http'; // <-- AGREGAR
import { Server } from 'socket.io'; // <-- AGREGAR

import { initTables } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import chatRoutes from './routes/chat.routes.js'; // <-- AGREGAR

const app = express();

// Crear servidor HTTP para Socket.io
const httpServer = createServer(app); // <-- MODIFICAR
const io = new Server(httpServer, { // <-- AGREGAR
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

app.use(cors({
  origin: (origin, cb) => {
    const allow = [process.env.CLIENT_ORIGIN || 'http://localhost:5173'];
    if (!origin || allow.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes); // <-- AGREGAR

app.get('/health', (_req, res) => res.json({ ok: true }));

// Socket.io Connection Handling
io.on('connection', (socket) => {
  console.log('Usuario conectado al chat:', socket.id);

  // Unirse a una sala de chat específica
  socket.on('join-chat', (conversationId) => {
    socket.join(`chat_${conversationId}`);
    console.log(`Socket ${socket.id} unido a chat_${conversationId}`);
  });

  // Salir de una sala de chat
  socket.on('leave-chat', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  // Enviar mensaje
  socket.on('send-message', async (data) => {
    const { conversationId, senderId, content } = data;
    
    console.log('Mensaje recibido:', data);
    
    // Aquí guardarías en la base de datos
    // const message = await MessageModel.createMessage({...});
    
    // Emitir el mensaje a todos en la sala
    io.to(`chat_${conversationId}`).emit('new-message', {
      conversationId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      id: Date.now() // Temporal - usar ID real de BD
    });
    
    // Notificar a otros usuarios (para notificaciones)
    socket.to(`chat_${conversationId}`).emit('message-notification', {
      conversationId,
      senderId,
      preview: content.substring(0, 50)
    });
  });

  // Cuando un usuario muestra interés en un producto
  socket.on('interest-in-product', (data) => {
    const { productId, productOwnerId, interestedUserId } = data;
    
    // Notificar al dueño del producto
    io.to(`user_${productOwnerId}`).emit('new-interest-notification', {
      productId,
      interestedUserId,
      message: 'Alguien está interesado en tu producto'
    });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado del chat:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

// Inicializar tablas → levantar servidor
initTables()
  .then(() => {
    httpServer.listen(PORT, () => { // <-- CAMBIAR app.listen por httpServer.listen
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSockets disponibles en ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed initializing database', err);
    process.exit(1);
  });