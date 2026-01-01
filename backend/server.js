import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import colors from 'colors';
import { corsConfig } from './src/config/cors.config.js';
import { socketConfig } from './src/config/socket.config.js';
import { setupSocketHandlers } from './src/socket/socketHandler.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, socketConfig);

// Middleware
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Stop Game API',
    version: '1.0.0',
    description: 'Real-time multiplayer Stop/Basta game',
    endpoints: {
      health: '/health',
      info: '/api/info'
    }
  });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.cyan);
  console.log(`🎮 STOP GAME SERVER`.bold.green);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.cyan);
  console.log(`🚀 Server running on port ${PORT}`.yellow);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`.yellow);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`.yellow);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.cyan);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing server...'.yellow);
  httpServer.close(() => {
    console.log('✅ Server closed'.green);
    process.exit(0);
  });
});