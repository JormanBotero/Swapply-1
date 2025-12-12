import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { initTables } from './config/db.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

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

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

// Inicializar tablas → levantar servidor
initTables()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Failed initializing database', err);
    process.exit(1);
  });
