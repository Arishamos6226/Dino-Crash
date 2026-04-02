import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MatchmakingQueue } from './MatchmakingQueue';
import { FindMatchPayload } from '../../shared/network-types';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors());

// Socket.io server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, specify your client origin
    methods: ['GET', 'POST']
  }
});

// Initialize matchmaking queue
const matchmakingQueue = new MatchmakingQueue(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: matchmakingQueue.getActiveRoomCount(),
    queueSize: matchmakingQueue.getQueueSize()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle find match request
  socket.on('find_match', (payload: FindMatchPayload) => {
    console.log(`${socket.id} searching for ${payload.gameMode} match`);
    matchmakingQueue.addPlayer(socket, payload.gameMode);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    matchmakingQueue.removePlayer(socket);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Dino-Crash Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
