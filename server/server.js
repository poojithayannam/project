import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import feedbackRoutes from './routes/feedbackRoutes.js';
import authRoutes from './routes/authRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import logger from './utils/logger.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:5173', 'http://localhost:5174']
  }
});

// Inject socket io into Express
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:5174']
}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  message: { error: 'Too many requests from this IP, please try again in a minute.', success: false }
});

app.use(limiter);
app.use(express.json({ limit: '10kb' })); 

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/intelligence', intelligenceRoutes);
app.use('/api/v1/health', healthRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    success: false
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feedbackDB')
  .then(async () => {
    logger.info('Connected to MongoDB');
    try {
      const adminExists = await User.findOne({ email: 'admin@test.com' });
      if (!adminExists) {
         await User.create({ email: 'admin@test.com', password: 'admin123', role: 'admin' });
         logger.info('✅ Default Admin account created (admin@test.com / admin123)');
      }

      const viewerExists = await User.findOne({ email: 'viewer@test.com' });
      if (!viewerExists) {
         await User.create({ email: 'viewer@test.com', password: 'viewer123', role: 'viewer' });
         logger.info('✅ Default Viewer account created (viewer@test.com / viewer123)');
      }
    } catch(err) { logger.error(`Database seed failed: ${err.message}`); }
  })
  .catch((err) => logger.warn(`MongoDB connection error details (Mock RAM DB will be used): ${err.message}`));

io.on('connection', (socket) => {
  logger.info('🟢 New Client Socket Connected');
  socket.on('disconnect', () => logger.info('🔴 Client Socket Disconnected'));
});

httpServer.listen(PORT, () => logger.info(`WebSocket Server running on port ${PORT}`));
